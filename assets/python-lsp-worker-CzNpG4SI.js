//#region ../runtime/builtins/python-lsp.js
const JEDI_PACKAGES = ["jedi"];
const BLACK_PACKAGES = ["black"];
const MYPY_PACKAGES = ["mypy", ...["types-requests", "pandas-stubs"]];
const LSP_DRIVER_SOURCE = `
import json, os, re, sys

import jedi
from jedi.api.environment import InterpreterEnvironment

_VV_ENV = InterpreterEnvironment()
_VV_ROOT = "/"
_VV_PROJECT = None

# The last completion list, kept so resolve() can fetch one docstring for the one
# item the user highlighted. jedi's own docs warn that calling docstring() on a
# whole completion list is slow, and a popup that takes a second to appear is not
# worth a docstring nobody read.
_VV_LAST = {"token": None, "items": []}


def _vv_project(root):
    global _VV_ROOT, _VV_PROJECT
    if _VV_PROJECT is None or root != _VV_ROOT:
        _VV_ROOT = root
        _VV_PROJECT = jedi.Project(root)
    return _VV_PROJECT


def _vv_script(req):
    return jedi.Script(
        code=req["code"],
        path=req.get("path") or None,
        project=_vv_project(req.get("root") or "/"),
        environment=_VV_ENV,
    )


def _vv_where(d):
    """Where a definition lives, and whether that is a file anyone can open."""
    p = str(d.module_path) if d.module_path else ""
    return {"path": p, "line": d.line or 1, "column": (d.column or 0) + 1, "name": d.name or ""}


def _vv_complete(req):
    script = _vv_script(req)
    comps = script.complete(req["line"], req["column"])
    _VV_LAST["token"] = req.get("token")
    _VV_LAST["items"] = comps
    out = []
    for i, c in enumerate(comps):
        # description is jedi's one-liner ("def dumps", "instance int", "module
        # json"). No docstring here — see _VV_LAST.
        out.append({"i": i, "label": c.name, "type": c.type, "detail": c.description})
    return {"items": out}


def _vv_resolve(req):
    if _VV_LAST["token"] != req.get("token"):
        # The list this index refers to has been superseded. Answering from the
        # current list would attach one symbol's documentation to another's name.
        return {"stale": True}
    i = req.get("index", -1)
    if i < 0 or i >= len(_VV_LAST["items"]):
        return {"stale": True}
    c = _VV_LAST["items"][i]
    try:
        doc = c.docstring(raw=False)
    except Exception:
        doc = ""
    return {"doc": doc}


def _vv_hover(req):
    script = _vv_script(req)
    out = []
    for d in script.help(req["line"], req["column"]):
        doc = ""
        try:
            doc = d.docstring(raw=False)
        except Exception:
            pass
        if not doc and not d.description:
            continue
        out.append({"signature": d.description or "", "doc": doc, "type": d.type or ""})
    return {"items": out}


def _vv_signature(req):
    script = _vv_script(req)
    out = []
    for s in script.get_signatures(req["line"], req["column"]):
        params = []
        for p in s.params:
            params.append({"label": p.name, "detail": p.description or ""})
        out.append({
            "label": s.to_string(),
            "params": params,
            # index is None when the cursor is past the last parameter.
            "active": s.index if s.index is not None else -1,
        })
    return {"items": out}


def _vv_goto(req):
    script = _vv_script(req)
    defs = script.goto(req["line"], req["column"], follow_imports=True)
    return {"items": [_vv_where(d) for d in defs]}


def _vv_format(req):
    import black
    from black.parsing import ASTSafetyError

    src = req["code"]
    mode = black.Mode(line_length=req.get("lineLength") or 88)
    try:
        dst = black.format_str(src, mode=mode)
    except Exception as e:
        # InvalidInput carries "Cannot parse: 3:10", which is the only useful
        # thing anyone can be told here. Returning the input unchanged instead
        # would report success for a file black refused to read.
        return {"error": "parse", "message": str(e).split(chr(10))[0]}
    try:
        # black's own --safe check. format_str does NOT run it, and the failure
        # it catches is black changing what the code MEANS. Returning mangled
        # source over someone's buffer is the one outcome worth any cost.
        black.assert_equivalent(src, dst)
    except ASTSafetyError as e:
        return {"error": "unsafe", "message": str(e).split(chr(10))[0]}
    except Exception as e:
        return {"error": "unsafe", "message": type(e).__name__ + ": " + str(e)[:200]}
    return {"text": dst, "changed": dst != src}


_VV_CHECK_LINE = re.compile(
    r"^(?P<path>.+?):(?P<line>\\d+):(?P<col>\\d+):(?P<eline>\\d+):(?P<ecol>\\d+): "
    r"(?P<sev>error|warning|note): (?P<msg>.*?)(?:  \\[(?P<code>[a-z-]+)\\])?$"
)


def _vv_check(req):
    # The buffer, not the file. Everything else in this driver reads req["code"]
    # because the editor's copy is ahead of the disk; mypy only reads files, so
    # the buffer is written down first. The project mirror already put the rest
    # of the tree here, at the same absolute paths, which is what makes an
    # import of a sibling module resolve.
    from mypy import api

    path = req["path"]
    with open(path, "w", encoding="utf8") as fh:
        fh.write(req["code"])

    args = [
        "--no-color-output",
        "--no-error-summary",
        "--no-pretty",
        # Positions Monaco can place a squiggle on. Without these mypy reports a
        # line and nothing else, and every marker would underline the whole line.
        "--show-column-numbers",
        "--show-error-end",
        # Type information from imported modules, but diagnostics only for the
        # file being edited: errors in a file the user is not looking at cannot
        # be shown anywhere, and would otherwise be silently discarded below.
        "--follow-imports=silent",
        # Incremental is the difference between 2s and 0.35s per check. The cache
        # lives beside the project's package store rather than inside it, so pip
        # freeze and the store's size accounting do not see it.
        "--cache-dir=" + req.get("cacheDir", "/tmp/vv-mypy-cache"),
        path,
    ]
    out, errs, code = api.run(args)
    if code not in (0, 1):
        # 2 is a usage or configuration error — a bad mypy.ini, say. That is worth
        # showing as itself rather than as an empty, clean-looking result.
        detail = (errs or out or "").strip().split(chr(10))
        return {"error": "config", "message": detail[0] if detail else "mypy exited " + str(code)}

    items = []
    for line in (out or "").split(chr(10)):
        m = _VV_CHECK_LINE.match(line.strip())
        if m is None:
            continue
        # mypy reports the path the way it was reached, which is relative to the
        # working directory when that is where the file lives — so an exact
        # comparison against the absolute path silently drops every diagnostic.
        reported = os.path.realpath(os.path.join(os.getcwd(), m.group("path")))
        if reported != os.path.realpath(path):
            continue
        if m.group("sev") == "note":
            # A note explains the diagnostic above it (mypy emits them as
            # separate lines). Folding it in keeps the explanation without
            # putting a second squiggle under the same code.
            if items:
                items[-1]["message"] += chr(10) + m.group("msg")
            continue
        items.append({
            "line": int(m.group("line")),
            "column": int(m.group("col")),
            "endLine": int(m.group("eline")),
            # mypy's end column is INCLUSIVE and Monaco's is not.
            "endColumn": int(m.group("ecol")) + 1,
            "severity": m.group("sev"),
            "message": m.group("msg"),
            "code": m.group("code") or "",
        })
    return {"items": items}


_VV_OPS = {
    "check": _vv_check,
    "complete": _vv_complete,
    "resolve": _vv_resolve,
    "hover": _vv_hover,
    "signature": _vv_signature,
    "goto": _vv_goto,
    "format": _vv_format,
}


def _vv_lsp(req_json):
    req = json.loads(req_json)
    op = req.get("op")
    fn = _VV_OPS.get(op)
    if fn is None:
        return json.dumps({"error": "op", "message": "unknown language-service op: " + str(op)})
    try:
        return json.dumps(fn(req))
    except Exception as e:
        # A jedi crash on one keystroke must not take the service down. Report it
        # as this request failing, and let the next one try again.
        return json.dumps({"error": "raised", "message": type(e).__name__ + ": " + str(e)[:300]})
`;
const MONACO_KIND = {
	METHOD: 0,
	FUNCTION: 1,
	FIELD: 3,
	VARIABLE: 4,
	CLASS: 5,
	MODULE: 8,
	PROPERTY: 9,
	VALUE: 13,
	KEYWORD: 17,
	FILE: 20,
	FOLDER: 23
};
MONACO_KIND.MODULE, MONACO_KIND.CLASS, MONACO_KIND.VARIABLE, MONACO_KIND.FUNCTION, MONACO_KIND.VARIABLE, MONACO_KIND.FILE, MONACO_KIND.KEYWORD, MONACO_KIND.PROPERTY, MONACO_KIND.VARIABLE;
/**
* ruff's own diagnostics, as the marker fields the editor wants.
*
* Here rather than in the worker so both spike tiers can hold it to the real
* shapes: the offline tier feeds it recorded ones, the bridge tier feeds it what
* the vendored wasm actually returns today.
*
* ruff counts rows and columns from 1 and its end column is EXCLUSIVE, which is
* what Monaco means too — unlike mypy, whose inclusive end has to be corrected
* by one. Not assumed: the bridge tier slices the source with these numbers and
* checks the result is the token being complained about.
*
* SYNTAX ERRORS ARE DROPPED, and that is the one real judgement in this file.
* ruff reports an unparseable file as ordinary diagnostics coded invalid-syntax
* rather than by failing, so `x = ` — a line anyone is in the middle of writing
* — comes back as "Expected an expression". At a 150ms debounce that is a red
* squiggle appearing under the cursor during a pause for thought, which is the
* classic reason people switch linting off. The 700ms checker still reports a
* file it cannot parse, so nothing is lost but the flicker.
*/
function ruffMarkersFrom(diagnostics) {
	const items = [];
	for (const d of diagnostics || []) {
		if (d.code === "invalid-syntax" || !d.code) continue;
		items.push({
			line: d.start_location.row,
			column: d.start_location.column,
			endLine: d.end_location.row,
			endColumn: d.end_location.column,
			message: d.message,
			code: d.code
		});
	}
	return { items };
}
//#endregion
//#region src/workers/python-lsp-worker.ts
const quiet = {
	messageCallback: () => {},
	errorCallback: () => {}
};
let pyodide = null;
let dispatch = null;
let booting = null;
let blackLoaded = false;
let blackError = null;
let mypyLoaded = false;
let mypyError = null;
let ruff = null;
let ruffError = null;
const post = (type, extra) => self.postMessage({
	type,
	...extra
});
const errText = (e) => e && e.message || String(e);
/**
* Boot once. Concurrent callers await the same promise rather than starting a
* second interpreter — two 30 MB boots racing is the failure mode that turns a
* slow feature into an out-of-memory one.
*/
function boot(indexUrl) {
	if (booting) return booting;
	booting = (async () => {
		post("state", { state: "starting" });
		const url = String(indexUrl || "").replace(/\/*$/, "/");
		const { loadPyodide } = await import(
			/* @vite-ignore */
			url + "pyodide.mjs"
);
		const py = await loadPyodide({ indexURL: url });
		py.runPython("import sys; sys.executable = \"python\"");
		await py.loadPackage(JEDI_PACKAGES, quiet);
		py.runPython(LSP_DRIVER_SOURCE);
		pyodide = py;
		dispatch = py.globals.get("_vv_lsp");
		post("state", { state: "ready" });
		return py;
	})().catch((e) => {
		booting = null;
		const message = errText(e);
		post("state", {
			state: "failed",
			detail: message
		});
		throw e;
	});
	return booting;
}
/**
* black is loaded separately, and only when someone formats. It is four wheels
* nobody editing a file needs until they press the key, and jedi is what makes
* the editor feel alive.
*/
async function ensureBlack() {
	if (blackLoaded) return;
	if (blackError) throw new Error(blackError);
	try {
		await pyodide.loadPackage(BLACK_PACKAGES, quiet);
		blackLoaded = true;
	} catch (e) {
		blackError = errText(e);
		throw new Error(blackError);
	}
}
/**
* mypy, on the same terms as black and for a stronger reason: it is the biggest
* wheel the studio can pull, and it is only wanted once someone has written
* enough to be worth checking. A failure is remembered rather than retried,
* because the check runs on a timer and a retry loop would be a fetch per pause.
*/
async function ensureMypy() {
	if (mypyLoaded) return;
	if (mypyError) throw new Error(mypyError);
	try {
		await pyodide.loadPackage(MYPY_PACKAGES, quiet);
		mypyLoaded = true;
	} catch (e) {
		mypyError = errText(e);
		throw new Error(mypyError);
	}
}
/**
* ruff, which is not Python and therefore not loaded like any of the above.
*
* It is a WebAssembly module of its own (scripts/vendor-ruff.mjs), so this needs
* no interpreter, no wheel and no lock — and the caller below deliberately does
* NOT boot Pyodide for a lint. That is the whole reason ruff is worth having in
* the editor as well as at a prompt: opening a .py file puts its markers up in
* the time it takes to fetch 11 MB, while the ~30 MB interpreter that answers
* "is this a type error" is still starting.
*
* Its wasm is fetched with the browser's own fetch, not the blocking syscall the
* `ruff` command uses: this worker is host code with a network of its own,
* whereas that one is a guest process behind the kernel.
*/
async function ensureRuff(ruffUrl) {
	if (ruff) return ruff;
	if (ruffError) throw new Error(ruffError);
	try {
		if (!ruffUrl) throw new Error("no vendored ruff (VV_RUFF_URL is unset for this build)");
		const [mod, wasm] = await Promise.all([import(
			/* @vite-ignore */
			ruffUrl + "ruff_wasm.js"
), fetch(ruffUrl + "ruff_wasm_bg.wasm").then((r) => {
			if (!r.ok) throw new Error("fetching the ruff wasm returned HTTP " + r.status);
			return r.arrayBuffer();
		})]);
		await mod.default({ module_or_path: wasm });
		ruff = new mod.Workspace(mod.Workspace.defaultSettings());
		return ruff;
	} catch (e) {
		ruffError = errText(e);
		throw new Error(ruffError);
	}
}
/**
* One lint. The mapping lives in the runtime module next to the provider that
* consumes it (ruffMarkersFrom), so both spike tiers can check it without a
* worker; this is only the call.
*/
function ruffLint(source) {
	return ruffMarkersFrom(ruff.check(source));
}
function syncFiles(files, removed) {
	if (!pyodide) return;
	for (const path of removed || []) try {
		pyodide.FS.unlink(path);
	} catch {}
	for (const [path, text] of files || []) try {
		const slash = path.lastIndexOf("/");
		if (slash > 0) pyodide.FS.mkdirTree(path.slice(0, slash));
		pyodide.FS.writeFile(path, new TextEncoder().encode(text));
	} catch {}
}
self.onmessage = async (event) => {
	const m = event.data;
	if (!m || typeof m !== "object") return;
	if (m.type === "py-lsp-sync") {
		if (pyodide) syncFiles(m.files, m.removed);
		return;
	}
	if (m.type !== "py-lsp-request") return;
	const { id, req, indexUrl, ruffUrl } = m;
	try {
		if (req.op === "lint") {
			await ensureRuff(ruffUrl);
			post("py-lsp-reply", {
				id,
				ok: true,
				result: ruffLint(req.code || "")
			});
			return;
		}
		if (!pyodide) await boot(indexUrl);
		syncFiles(m.files, m.removed);
		if (req.op === "format") await ensureBlack();
		if (req.op === "check") await ensureMypy();
		const answer = dispatch(JSON.stringify(req));
		post("py-lsp-reply", {
			id,
			ok: true,
			result: JSON.parse(answer)
		});
	} catch (e) {
		post("py-lsp-reply", {
			id,
			ok: false,
			error: errText(e)
		});
	}
};
//#endregion

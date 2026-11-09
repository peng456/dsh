//#region ../runtime/toolchain-shims.js
/**
* Native package name -> its official, API-compatible WASM drop-in package name.
* Consumed by packages/studio/src/workers/fetcher-worker.js (registry packument aliasing).
* @type {Record<string, string>}
*/
const NATIVE_WASM_ALIASES = {
	esbuild: "esbuild-wasm",
	rollup: "@rollup/wasm-node",
	lightningcss: "lightningcss-wasm"
};
/**
* Native package name -> an API-compatible drop-in whose versions are NOT
* published in lockstep with the source. Consumed by the Fetcher Worker via
* synthesizeRemappedPackument (registry packument VERSION-remapping).
*
* TO ADD A NEW DROP-IN, append a { source: target } entry.
* REQUIREMENTS (all must hold, else DO NOT alias here):
*   - `target` is API-compatible with `source` (a genuine drop-in: same public
*     surface the ecosystem relies on), pure-JS/wasm, with NO native deps.
*   - the pairing is proven by an offline spike (scripts/spike-*.mjs) AND a live
*     browser install before shipping.
* NOTE the weaker contract vs NATIVE_WASM_ALIASES: because versions differ, a
* `source@<range>` resolves to a SOURCE version number but downloads the TARGET's
* latest tarball — acceptable for a stable, API-compatible drop-in.
* @type {Record<string, string>}
*/
const NATIVE_DROPIN_ALIASES = { bcrypt: "bcryptjs" };
/**
* Build a packument for a version-remapped drop-in (NATIVE_DROPIN_ALIASES): keep
* the SOURCE's version numbers + dist-tags (so any `source@<range>` resolves, since
* npm.js runs semver.maxSatisfying over meta.versions), but point every version at
* the TARGET's latest tarball + deps and drop native-install metadata. The single
* target tarball is shared by every synthesized entry; npm.js verifies no integrity,
* so this installs cleanly and `require('<source>')` loads the target's files.
*
* @param {any} sourceJson  the source package's real packument (for versions/tags)
* @param {any} targetJson  the target package's real packument (for the tarball/deps)
* @param {string} src      the source name to present the packument under
* @returns {any|null} the synthesized packument, or null if either input is unusable
*/
function synthesizeRemappedPackument(sourceJson, targetJson, src) {
	if (!sourceJson || typeof sourceJson !== "object") return null;
	if (!targetJson || typeof targetJson !== "object") return null;
	const srcVersions = sourceJson.versions;
	const tgtVersions = targetJson.versions;
	const targetLatest = (targetJson["dist-tags"] || {}).latest || tgtVersions && Object.keys(tgtVersions).pop();
	if (!srcVersions || typeof srcVersions !== "object") return null;
	if (!tgtVersions || typeof tgtVersions !== "object") return null;
	const tgtManifest = tgtVersions[targetLatest];
	if (!tgtManifest || !tgtManifest.dist || !tgtManifest.dist.tarball) return null;
	const versions = {};
	for (const v of Object.keys(srcVersions)) versions[v] = {
		name: src,
		version: v,
		dist: tgtManifest.dist,
		dependencies: tgtManifest.dependencies || {},
		...tgtManifest.main ? { main: tgtManifest.main } : {},
		...tgtManifest.module ? { module: tgtManifest.module } : {},
		...tgtManifest.exports ? { exports: tgtManifest.exports } : {},
		...tgtManifest.bin ? { bin: tgtManifest.bin } : {},
		...tgtManifest.type ? { type: tgtManifest.type } : {},
		...tgtManifest.engines ? { engines: tgtManifest.engines } : {},
		_id: src + "@" + v
	};
	return {
		name: src,
		_id: src,
		"dist-tags": sourceJson["dist-tags"] || {},
		versions
	};
}
//#endregion
//#region ../runtime/egress-header-policy.js
const CORS_SAFELISTED = /* @__PURE__ */ new Set([
	"accept",
	"accept-language",
	"content-language",
	"content-type"
]);
const SAFE_CONTENT_TYPES = /* @__PURE__ */ new Set([
	"application/x-www-form-urlencoded",
	"multipart/form-data",
	"text/plain"
]);
const PREFLIGHT_HOSTILE_HOSTS = /* @__PURE__ */ new Set([
	"registry.npmjs.org",
	"registry.yarnpkg.com",
	"registry.npmmirror.com"
]);
/**
* Should this URL's custom request headers be dropped to keep the request
* preflight-free? True only for the package registries; same-origin requests are
* not subject to CORS at all.
*/
function stripsCustomHeaders(url, selfOrigin) {
	let u;
	try {
		u = new URL(url);
	} catch {
		return false;
	}
	if (selfOrigin && u.origin === selfOrigin) return false;
	return PREFLIGHT_HOSTILE_HOSTS.has(u.hostname) || u.hostname.startsWith("registry.");
}
/** Keep only the CORS-safelisted request headers. */
function corsSafeHeaders(headers) {
	if (!headers) return void 0;
	const entries = typeof Headers !== "undefined" && headers instanceof Headers ? [...headers] : Object.entries(headers);
	const out = {};
	for (const [k, v] of entries) {
		const lk = String(k).toLowerCase();
		if (!CORS_SAFELISTED.has(lk)) continue;
		if (lk === "content-type" && !SAFE_CONTENT_TYPES.has(String(v).split(";")[0].trim().toLowerCase())) continue;
		out[k] = v;
	}
	return out;
}
/** The headers to actually put on the browser `fetch()` for this URL. */
function egressHeaders(url, headers, selfOrigin) {
	if (!headers) return void 0;
	return stripsCustomHeaders(url, selfOrigin) ? corsSafeHeaders(headers) : headers;
}
//#endregion
//#region src/workers/fetcher-worker.ts
const HOST_ALIAS = "host.vivari.internal";
function rewrite(url) {
	try {
		const u = new URL(url);
		if (u.hostname === HOST_ALIAS) {
			u.hostname = self.location && self.location.hostname || "localhost";
			url = u.toString();
		}
	} catch {}
	return url;
}
function encodePkgSegment(name) {
	return name.startsWith("@") ? "@" + encodeURIComponent(name.slice(1)) : encodeURIComponent(name);
}
function matchPackumentAlias(url) {
	let u;
	try {
		u = new URL(url);
	} catch {
		return null;
	}
	const segs = u.pathname.split("/").filter(Boolean);
	if (!segs.length || segs.includes("-")) return null;
	let nameIdx = segs.length - 1;
	const last = decodeURIComponent(segs[nameIdx]);
	if ((/^\d/.test(last) || last === "latest") && segs.length >= 2) nameIdx = segs.length - 2;
	const src = decodeURIComponent(segs[nameIdx]);
	const remap = !NATIVE_WASM_ALIASES[src] && !!NATIVE_DROPIN_ALIASES[src];
	const dst = NATIVE_WASM_ALIASES[src] || NATIVE_DROPIN_ALIASES[src];
	if (!dst) return null;
	const newSegs = segs.slice();
	newSegs[nameIdx] = encodePkgSegment(dst);
	u.pathname = "/" + newSegs.join("/");
	return {
		targetUrl: u.toString(),
		src,
		dst,
		remap
	};
}
function rewritePackument(json, src) {
	if (json && typeof json === "object") {
		if ("name" in json) json.name = src;
		if ("_id" in json) json._id = src;
		const versions = json.versions;
		if (versions && typeof versions === "object") for (const v of Object.keys(versions)) {
			const m = versions[v];
			if (m && typeof m === "object") {
				if ("name" in m) m.name = src;
				if ("_id" in m) m._id = src + "@" + (m.version || v);
			}
		}
	}
	return json;
}
async function doFetch(url, init) {
	const opts = { redirect: "follow" };
	if (init) {
		if (init.method) opts.method = init.method;
		if (init.headers) opts.headers = egressHeaders(rewrite(url), init.headers, self.location && self.location.origin);
		if (init.body) opts.body = init.body;
	}
	if ((opts.method || "GET").toUpperCase() === "GET") {
		const alias = matchPackumentAlias(url);
		if (alias) try {
			if (alias.remap) {
				const [srcRes, dstRes] = await Promise.all([fetch(rewrite(url), opts), fetch(rewrite(alias.targetUrl), opts)]);
				if (srcRes.ok && dstRes.ok) {
					const json = synthesizeRemappedPackument(await srcRes.json(), await dstRes.json(), alias.src);
					if (json) {
						const body = new TextEncoder().encode(JSON.stringify(json)).buffer;
						const headers = {};
						for (const [k, v] of dstRes.headers) headers[k] = v;
						headers["content-type"] = "application/json";
						delete headers["content-length"];
						delete headers["content-encoding"];
						return {
							ok: true,
							status: 200,
							statusText: "OK",
							headers,
							body
						};
					}
				}
			} else {
				const res = await fetch(rewrite(alias.targetUrl), opts);
				if (res.ok) {
					const json = rewritePackument(await res.json(), alias.src);
					const body = new TextEncoder().encode(JSON.stringify(json)).buffer;
					const headers = {};
					for (const [k, v] of res.headers) headers[k] = v;
					headers["content-type"] = "application/json";
					delete headers["content-length"];
					delete headers["content-encoding"];
					return {
						ok: true,
						status: res.status,
						statusText: res.statusText,
						headers,
						body
					};
				}
			}
		} catch {}
	}
	const res = await fetch(rewrite(url), opts);
	const buf = await res.arrayBuffer();
	const headers = {};
	for (const [k, v] of res.headers) headers[k] = v;
	return {
		ok: res.ok,
		status: res.status,
		statusText: res.statusText,
		headers,
		body: buf
	};
}
self.onmessage = async (event) => {
	const m = event.data;
	if (m.type !== "fetch") return;
	try {
		const r = await doFetch(m.url, m.init);
		self.postMessage({
			type: "fetch-result",
			id: m.id,
			ok: r.ok,
			status: r.status,
			statusText: r.statusText,
			headers: r.headers,
			body: r.body
		}, [r.body]);
	} catch (err) {
		self.postMessage({
			type: "fetch-result",
			id: m.id,
			error: String(err && err.message || err)
		});
	}
};
//#endregion

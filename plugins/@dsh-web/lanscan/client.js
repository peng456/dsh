window.__ModuleLoader__.load({
	id: "@dsh-web/lanscan",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		"use strict";
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __export = (target, all) => {
		  for (var name in all)
		    __defProp(target, name, { get: all[name], enumerable: true });
		};
		var __copyProps = (to, from, except, desc) => {
		  if (from && typeof from === "object" || typeof from === "function") {
		    for (let key of __getOwnPropNames(from))
		      if (!__hasOwnProp.call(to, key) && key !== except)
		        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
		  }
		  return to;
		};
		var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

		// packages/dsh-web-lanscan/src/client.tsx
		var client_exports = {};
		__export(client_exports, {
		  apply: () => apply,
		  default: () => client_default,
		  inject: () => inject
		});
		module.exports = __toCommonJS(client_exports);
		var import_react = require("react");
		var import_jsx_runtime = require("react/jsx-runtime");
		var CACHE_KEY = "dsh-web-lanscan:last";
		var CACHE_TTL = 10 * 60 * 1e3;
		function defaultSubnet() {
		  const host = location.hostname;
		  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return host.split(".").slice(0, 3).join(".");
		  return "127.0.0";
		}
		async function probe(host, port, path, timeoutMs) {
		  const controller = new AbortController();
		  const timer = setTimeout(() => controller.abort(), timeoutMs);
		  const started = performance.now();
		  try {
		    const response = await fetch(`http://${host}:${port}${path}`, {
		      mode: "cors",
		      cache: "no-store",
		      redirect: "follow",
		      signal: controller.signal
		    });
		    const hit = { host, outcome: "open", ms: Math.round(performance.now() - started), status: response.status };
		    try {
		      hit.identity = await response.json();
		    } catch {
		    }
		    return hit;
		  } catch (error) {
		    const ms = Math.round(performance.now() - started);
		    return { host, outcome: error?.name === "AbortError" ? "timeout" : "refused", ms };
		  } finally {
		    clearTimeout(timer);
		  }
		}
		async function pool(items, limit, work) {
		  const results = new Array(items.length);
		  let next = 0;
		  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		    for (; ; ) {
		      const index = next++;
		      if (index >= items.length) return;
		      results[index] = await work(items[index]);
		    }
		  });
		  await Promise.all(workers);
		  return results;
		}
		async function sweep(subnet, port, path, fastMs, onProgress) {
		  const hosts = Array.from({ length: 254 }, (_, index) => `${subnet}.${String(index + 1)}`);
		  let done = 0;
		  const first = await pool(hosts, 128, async (host) => {
		    const hit = await probe(host, port, path, fastMs);
		    onProgress(++done, hosts.length);
		    return hit;
		  });
		  const quiet = first.filter((hit) => hit.outcome === "timeout");
		  const second = await pool(quiet, 32, async (hit) => {
		    const retried = await probe(hit.host, port, path, Math.max(1500, fastMs * 4));
		    onProgress(++done, hosts.length + quiet.length);
		    return retried;
		  });
		  const merged = [...first.filter((hit) => hit.outcome !== "timeout"), ...second];
		  const hits = merged.filter((hit) => hit.outcome === "open");
		  return {
		    hits,
		    refused: merged.filter((hit) => hit.outcome === "refused").length,
		    timedOut: merged.filter((hit) => hit.outcome === "timeout").length
		  };
		}
		function ScanIcon() {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.3", "aria-hidden": "true", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "6.2" }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "2.4" }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 8l4.4-4.4", strokeLinecap: "round" })
		  ] });
		}
		function ScanPanel({ onClose }) {
		  const [subnet, setSubnet] = (0, import_react.useState)(defaultSubnet);
		  const [port, setPort] = (0, import_react.useState)("45917");
		  const [path, setPath] = (0, import_react.useState)("/mesh/v1/health");
		  const [fastMs, setFastMs] = (0, import_react.useState)("250");
		  const [running, setRunning] = (0, import_react.useState)(false);
		  const [progress, setProgress] = (0, import_react.useState)(void 0);
		  const [hits, setHits] = (0, import_react.useState)([]);
		  const [counts, setCounts] = (0, import_react.useState)(void 0);
		  const [error, setError] = (0, import_react.useState)(void 0);
		  const insecure = location.protocol === "https:";
		  const cancelled = (0, import_react.useRef)(false);
		  (0, import_react.useEffect)(() => {
		    try {
		      const raw = localStorage.getItem(CACHE_KEY);
		      if (raw === null) return;
		      const entry = JSON.parse(raw);
		      if (typeof entry.at !== "number" || Date.now() - entry.at > CACHE_TTL) return;
		      if (Array.isArray(entry.hits)) setHits(entry.hits);
		      if (typeof entry.subnet === "string") setSubnet(entry.subnet);
		      if (typeof entry.port === "string") setPort(entry.port);
		    } catch {
		    }
		  }, []);
		  const run = (0, import_react.useCallback)(async () => {
		    setRunning(true);
		    setError(void 0);
		    setHits([]);
		    setCounts(void 0);
		    cancelled.current = false;
		    setProgress({ done: 0, total: 254 });
		    try {
		      const result = await sweep(subnet, Number(port), path, Math.max(50, Number(fastMs)), (done, total) => {
		        if (!cancelled.current) setProgress({ done, total });
		      });
		      setHits(result.hits);
		      setCounts({ refused: result.refused, timedOut: result.timedOut });
		      try {
		        localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), subnet, port, hits: result.hits }));
		      } catch {
		      }
		    } catch (failure) {
		      setError(failure instanceof Error ? failure.message : String(failure));
		    } finally {
		      setRunning(false);
		      setProgress(void 0);
		    }
		  }, [subnet, port, path, fastMs]);
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-lanscan-panel", role: "dialog", "aria-label": "\u5C40\u57DF\u7F51\u626B\u63CF", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "dsh-lanscan-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u5C40\u57DF\u7F51\u626B\u63CF" }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-lanscan-close", onClick: onClose, "aria-label": "\u5173\u95ED", children: "\xD7" })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "dsh-lanscan-note", children: [
		      "\u9875\u9762\u6CA1\u6709 UDP\u3001ARP\u3001ICMP\uFF0C\u4E5F\u6CA1\u6709\u4EFB\u4F55\u201C\u5217\u51FA\u5C40\u57DF\u7F51 IP\u201D\u7684\u63A5\u53E3\u3002\u552F\u4E00\u53EF\u884C\u7684\u4E8B\u662F\u9010\u4E2A\u53D1\u8D77 TCP \u63A2\u6D4B\u3002\u5B9E\u6D4B\u7ED3\u8BBA\uFF1A",
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
		        "\u53EA\u6709\u5141\u8BB8\u8DE8\u6E90\u8BFB\u53D6\uFF08\u53D1 ",
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "Access-Control-Allow-Origin" }),
		        "\uFF09\u7684\u670D\u52A1\u80FD\u88AB\u53D1\u73B0"
		      ] }),
		      "\uFF1B \u7AEF\u53E3\u5173\u95ED\u3001\u4E3B\u673A\u4E0D\u5B58\u5728\u3001\u5F00\u7740\u4F46\u6CA1\u53D1 CORS \u5934\uFF0C\u4E09\u8005\u8FD4\u56DE\u7684\u7ED3\u679C\u5B8C\u5168\u4E00\u6837\u3002"
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-lanscan-row", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
		        "\u7F51\u6BB5",
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: subnet, onChange: (event) => setSubnet(event.target.value.trim()), spellCheck: false })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
		        "\u7AEF\u53E3",
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: port, onChange: (event) => setPort(event.target.value.trim()), inputMode: "numeric" })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-lanscan-row", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
		        "\u8DEF\u5F84",
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: path, onChange: (event) => setPath(event.target.value), spellCheck: false })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
		        "\u9996\u8F6E\u8D85\u65F6",
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: fastMs, onChange: (event) => setFastMs(event.target.value.trim()), inputMode: "numeric" }),
		        " ms"
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-lanscan-actions", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-lanscan-run", disabled: running, onClick: () => {
		        void run();
		      }, children: running ? "\u626B\u63CF\u4E2D\u2026" : "\u5F00\u59CB\u626B\u63CF" }),
		      running && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-lanscan-stop", onClick: () => {
		        cancelled.current = true;
		      }, children: "\u505C\u6B62" }),
		      progress !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh-lanscan-progress", children: [
		        progress.done,
		        "/",
		        progress.total
		      ] })
		    ] }),
		    insecure && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh-lanscan-warn", children: "\u5F53\u524D\u9875\u9762\u662F HTTPS\uFF0C\u6D4F\u89C8\u5668\u4F1A\u4EE5\u6DF7\u5408\u5185\u5BB9\u4E3A\u7531\u62E6\u6389\u6240\u6709 http:// \u63A2\u6D4B\u3002\u8BF7\u7528 http \u6E90\u6253\u5F00\u3002" }),
		    error !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh-lanscan-warn", children: error }),
		    hits.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "dsh-lanscan-hits", children: hits.map((hit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", { href: `http://${hit.host}:${port}${path}`, target: "_blank", rel: "noreferrer noopener", children: [
		        hit.host,
		        ":",
		        port
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh-lanscan-badge", children: [
		        hit.ms,
		        " ms"
		      ] }),
		      hit.identity !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-lanscan-id", children: String(hit.identity.machine ?? hit.identity.app ?? hit.identity.ok ?? "\u5DF2\u8BC6\u522B") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-lanscan-id dsh-lanscan-dim", children: "\u53EF\u8DE8\u6E90\u8BFB\u53D6\uFF0C\u4F46\u54CD\u5E94\u4E0D\u662F JSON" })
		    ] }, hit.host)) }),
		    !running && hits.length === 0 && counts !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "dsh-lanscan-note", children: [
		      "\u6CA1\u6709\u53EF\u53D1\u73B0\u7684\u670D\u52A1\u3002",
		      counts.refused,
		      " \u4E2A\u65E0\u5E94\u7B54\uFF0C",
		      counts.timedOut,
		      " \u4E2A\u8D85\u65F6\u3002 \u8FD9\u4E24\u7C7B\u90FD\u65E0\u6CD5\u533A\u5206\u201C\u7AEF\u53E3\u5173\u95ED / \u4E3B\u673A\u4E0D\u5B58\u5728 / \u670D\u52A1\u6CA1\u53D1 CORS \u5934\u201D\uFF0C\u6240\u4EE5\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u7F51\u6BB5\u91CC\u6709\u6CA1\u6709\u8BBE\u5907\u3002"
		    ] })
		  ] });
		}
		function ScanAction({ wide }) {
		  const [open, setOpen] = (0, import_react.useState)(false);
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
		      "button",
		      {
		        type: "button",
		        className: "dsh-lanscan-trigger",
		        ...wide ? {} : { "data-rail": "" },
		        onClick: () => setOpen((value) => !value),
		        title: "\u626B\u63CF\u672C\u7F51\u6BB5\u7684 HTTP \u670D\u52A1",
		        "aria-label": "\u5C40\u57DF\u7F51\u626B\u63CF",
		        children: [
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanIcon, {}),
		          wide && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-lanscan-label", children: "\u5C40\u57DF\u7F51\u626B\u63CF" })
		        ]
		      }
		    ),
		    open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanPanel, { onClose: () => setOpen(false) })
		  ] });
		}
		var STYLE = `
		.dsh-lanscan-trigger{box-sizing:border-box;display:flex;align-items:center;gap:8px;flex:0 0 calc(100% + 8px);
		 width:calc(100% + 8px);height:34px;margin:4px -4px;padding:6px 2px 6px 10px;border:0;border-radius:12px;
		 background:transparent;color:var(--dsw-alias-label-primary,inherit);font-family:inherit;font-size:14px;
		 line-height:22px;text-align:left;cursor:pointer;overflow:hidden}
		.dsh-lanscan-trigger:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
		.dsh-lanscan-trigger[data-rail]{flex:0 0 36px;justify-content:center;gap:0;width:36px;height:36px;
		 margin:4px 0;padding:0;border-radius:50%}
		.dsh-lanscan-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
		.dsh-lanscan-panel{position:fixed;left:96px;bottom:72px;z-index:60;width:min(520px,calc(100vw - 120px));
		 max-height:70vh;overflow:auto;display:flex;flex-direction:column;gap:8px;padding:14px;
		 border:1px solid var(--dsw-alias-border-l2,#d0d0d0);border-radius:12px;
		 background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 8px 28px rgba(0,0,0,.18);
		 color:var(--dsw-alias-label-primary,#111);font-size:13px;line-height:1.6}
		.dsh-lanscan-head{display:flex;align-items:center;justify-content:space-between}
		.dsh-lanscan-close{border:0;background:transparent;color:inherit;font-size:18px;line-height:1;cursor:pointer}
		.dsh-lanscan-note{margin:0;color:var(--dsw-alias-label-secondary,#666)}
		.dsh-lanscan-warn{margin:0;color:#b45309}
		.dsh-lanscan-row{display:flex;gap:8px;flex-wrap:wrap}
		.dsh-lanscan-row label{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-secondary,#666)}
		.dsh-lanscan-row input{width:120px;padding:4px 8px;border:1px solid var(--dsw-alias-border-l2,#d0d0d0);
		 border-radius:6px;background:var(--dsw-alias-bg-layer-2,#fafafa);color:inherit;font-size:12px;font-family:inherit}
		.dsh-lanscan-actions{display:flex;align-items:center;gap:10px}
		.dsh-lanscan-run{padding:5px 14px;border:1px solid var(--dsw-alias-brand-primary,#3b6cf6);border-radius:6px;
		 background:var(--dsw-alias-brand-primary,#3b6cf6);color:var(--dsw-alias-bg-base,#fff);font-size:13px;cursor:pointer}
		.dsh-lanscan-run:disabled{opacity:.6;cursor:wait}
		.dsh-lanscan-stop{padding:5px 12px;border:1px solid var(--dsw-alias-border-l2,#d0d0d0);border-radius:6px;
		 background:transparent;color:inherit;font-size:13px;cursor:pointer}
		.dsh-lanscan-progress{font-size:12px;color:var(--dsw-alias-label-secondary,#666);font-variant-numeric:tabular-nums}
		.dsh-lanscan-hits{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}
		.dsh-lanscan-hits li{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:6px 8px;border-radius:8px;
		 background:var(--dsw-alias-bg-layer-2,#f6f6f6)}
		.dsh-lanscan-hits a{color:var(--dsw-alias-brand-primary,#3b6cf6);text-decoration:none;font-family:ui-monospace,Menlo,monospace;font-size:12px}
		.dsh-lanscan-badge{font-size:11px;color:var(--dsw-alias-label-secondary,#666);font-variant-numeric:tabular-nums}
		.dsh-lanscan-id{font-size:12px}
		.dsh-lanscan-dim{color:var(--dsw-alias-label-tertiary,#888)}
		`;
		var inject = ["slots"];
		function apply(ctx) {
		  if (document.getElementById("dsh-lanscan-chrome") === null) {
		    const style = document.createElement("style");
		    style.id = "dsh-lanscan-chrome";
		    style.textContent = STYLE;
		    document.head.append(style);
		  }
		  const slots = ctx.get("slots");
		  if (slots === void 0) return;
		  slots.inject("sidebar.footer.action", () => slots.register(
		    { name: "sidebar.footer.action", id: "web-lanscan", order: 90, label: "\u5C40\u57DF\u7F51\u626B\u63CF" },
		    ScanAction
		  ));
		}
		var client_default = { apply, inject };

		return module.exports;
	}
});

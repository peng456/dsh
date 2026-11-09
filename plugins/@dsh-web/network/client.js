window.__ModuleLoader__.load({
	id: "@dsh-web/network",
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

		// packages/dsh-web-network/src/client.tsx
		var client_exports = {};
		__export(client_exports, {
		  apply: () => apply,
		  default: () => client_default,
		  inject: () => inject
		});
		module.exports = __toCommonJS(client_exports);
		var import_react = require("react");
		var import_jsx_runtime = require("react/jsx-runtime");
		var BRIDGE = "__DSH_WEB_NETWORK__";
		function network() {
		  return globalThis[BRIDGE];
		}
		var STYLE = `
		.dsh-web-network{display:flex;flex-direction:column;gap:1.1rem;padding:.5rem 0 1.5rem}
		.dsh-web-network h3{margin:0;font-size:15px;font-weight:500}
		.dsh-web-network p{margin:0;font-size:13px;line-height:1.65;opacity:.72}
		.dsh-web-network code{font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;
		 background:var(--dsw-alias-markdown-code-block,rgba(127,127,127,.12));border-radius:.25rem;padding:.05rem .3rem}
		.dsh-web-network-field{display:flex;flex-direction:column;gap:.4rem}
		.dsh-web-network-field label{font-size:13px;font-weight:500}
		.dsh-web-network-row{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}
		.dsh-web-network-row input[type=text]{flex:1;min-width:18rem;padding:.45rem .6rem;border-radius:.5rem;
		 border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.4));background:transparent;color:inherit;
		 font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
		.dsh-web-network button{font:inherit;font-size:13px;padding:.4rem .8rem;border-radius:.5rem;cursor:pointer;
		 border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.4));background:transparent;color:inherit}
		.dsh-web-network button:disabled{opacity:.5;cursor:default}
		.dsh-web-network-toggle{display:flex;gap:.6rem;align-items:flex-start;cursor:pointer}
		.dsh-web-network-toggle input{margin-top:.25rem}
		.dsh-web-network-toggle span{font-size:13px;line-height:1.6}
		.dsh-web-network-warn{font-size:13px;line-height:1.65;padding:.6rem .75rem;border-radius:.5rem;
		 border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35));
		 background:var(--dsw-alias-markdown-code-block,rgba(127,127,127,.08))}
		.dsh-web-network-status{font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;
		 padding:.5rem .6rem;border-radius:.5rem;background:var(--dsw-alias-markdown-code-block,rgba(127,127,127,.12))}
		.dsh-web-network-status[data-error]{color:var(--dsw-alias-state-error-primary,#d33)}
		.dsh-web-network-list{margin:0;padding-left:1.1rem;font:12px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;opacity:.8}
		`;
		function MachineNetwork() {
		  const bridge = network()?.machine;
		  const [enabled, setEnabled] = (0, import_react.useState)(() => bridge?.config().enabled ?? false);
		  const [relay, setRelay] = (0, import_react.useState)(() => bridge?.config().relay ?? "");
		  const [allowSelf, setAllowSelf] = (0, import_react.useState)(() => bridge?.config().allowSelf ?? false);
		  const [status, setStatus] = (0, import_react.useState)(void 0);
		  const [busy, setBusy] = (0, import_react.useState)(false);
		  const [traffic, setTraffic] = (0, import_react.useState)(() => bridge?.traffic() ?? { requests: [], refusedPorts: [] });
		  (0, import_react.useEffect)(() => {
		    const timer = setInterval(() => {
		      const api = network()?.machine;
		      if (api !== void 0) setTraffic(api.traffic());
		    }, 2e3);
		    return () => {
		      clearInterval(timer);
		    };
		  }, []);
		  const save = (0, import_react.useCallback)((next) => {
		    const api = network()?.machine;
		    if (api === void 0) return;
		    const applied = api.setConfig(next);
		    setEnabled(applied.enabled);
		    setAllowSelf(applied.allowSelf);
		    if (next.relay !== void 0) setRelay(applied.relay);
		    setStatus({
		      text: !applied.enabled ? "Saved. The machine keeps its network card and the cable goes nowhere. Restart it to apply." : applied.relay === "" ? "Saved. The page answers the machine itself, over HTTP. Restart the machine to apply." : `Saved. The machine will use ${applied.relay}. Restart it to apply.`
		    });
		  }, []);
		  const probe = (0, import_react.useCallback)(async () => {
		    const api = network()?.machine;
		    if (api === void 0) return;
		    setBusy(true);
		    setStatus({ text: "Testing\u2026" });
		    try {
		      const result = await api.test(relay.trim());
		      setStatus({ text: result.detail, error: !result.ok });
		    } finally {
		      setBusy(false);
		    }
		  }, [relay]);
		  if (bridge === void 0) return null;
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Emulated machine" }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh-web-network-toggle", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "input",
		        {
		          type: "checkbox",
		          checked: enabled,
		          onChange: (event) => {
		            save({ enabled: event.target.checked });
		          }
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Give it a network. Outbound only." })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh-web-network-toggle", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "input",
		        {
		          type: "checkbox",
		          checked: allowSelf,
		          onChange: (event) => {
		            save({ allowSelf: event.target.checked });
		          }
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Let it reach this page's own address" })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-network-field", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: "dsh-web-network-relay", children: "Relay" }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-network-row", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		          "input",
		          {
		            id: "dsh-web-network-relay",
		            type: "text",
		            value: relay,
		            spellCheck: false,
		            placeholder: "empty \u2014 HTTP through this page",
		            onChange: (event) => {
		              setRelay(event.target.value);
		            },
		            onKeyDown: (event) => {
		              if (event.key === "Enter") save({ relay: relay.trim() });
		            }
		          }
		        ),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", disabled: busy, onClick: () => {
		          save({ relay: relay.trim() });
		        }, children: "Save" }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", disabled: busy, onClick: () => {
		          void probe();
		        }, children: "Test" }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", disabled: busy, onClick: () => {
		          save({ relay: "" });
		        }, children: "Clear" })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "A WISP or websockproxy server, which carries every byte. Empty: HTTP through this page, no TLS." }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "dsh-web-network-list", children: bridge.relays.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => {
		          setRelay(preset.url);
		          save({ relay: preset.url });
		        }, children: preset.label }),
		        " ",
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: preset.url })
		      ] }, preset.url)) })
		    ] }),
		    traffic.requests.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-network-field", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "The machine asked for" }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "dsh-web-network-list", children: traffic.requests.slice(-8).reverse().map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
		        entry.status === void 0 ? "\u2717" : entry.status,
		        " ",
		        entry.url,
		        entry.error === void 0 ? "" : ` \u2014 ${entry.error}`
		      ] }, `${entry.url}-${String(index)}`)) })
		    ] }),
		    traffic.refusedPorts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-network-warn", children: [
		      "Port ",
		      traffic.refusedPorts.join(", "),
		      " could not be carried without a relay."
		    ] }),
		    status !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-web-network-status", ...status.error === true ? { "data-error": "" } : {}, children: status.text })
		  ] });
		}
		function NetworkSection() {
		  const bridge = network();
		  const [enabled, setEnabled] = (0, import_react.useState)(() => bridge?.config().enabled ?? false);
		  const [template, setTemplate] = (0, import_react.useState)(() => bridge?.config().template ?? "");
		  const [status, setStatus] = (0, import_react.useState)(void 0);
		  const [busy, setBusy] = (0, import_react.useState)(false);
		  const [used, setUsed] = (0, import_react.useState)(() => bridge?.proxied() ?? []);
		  (0, import_react.useEffect)(() => {
		    const timer = setInterval(() => {
		      setUsed(network()?.proxied() ?? []);
		    }, 2e3);
		    return () => {
		      clearInterval(timer);
		    };
		  }, []);
		  const apply2 = (0, import_react.useCallback)((next) => {
		    const api = network();
		    if (api === void 0) {
		      setStatus({ text: "The network policy is not available in this build.", error: true });
		      return;
		    }
		    const applied = api.setConfig(next);
		    setEnabled(applied.enabled);
		    if (next.template !== void 0) setTemplate(applied.template);
		    setStatus({ text: applied.enabled ? `Saved. Blocked requests retry through ${applied.template}.` : "Saved. Blocked requests now fail instead of being retried." });
		  }, []);
		  const test = (0, import_react.useCallback)(async () => {
		    const api = network();
		    if (api === void 0) return;
		    setBusy(true);
		    setStatus({ text: "Testing\u2026" });
		    try {
		      const result = await api.test(template.trim());
		      setStatus({ text: result.detail, error: !result.ok });
		    } finally {
		      setBusy(false);
		    }
		  }, [template]);
		  if (bridge === void 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-web-network", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This build publishes no network policy, so there is nothing to configure here." }) });
		  }
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-network", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "CORS proxy" }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh-web-network-toggle", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "input",
		        {
		          type: "checkbox",
		          checked: enabled,
		          onChange: (event) => {
		            apply2({ enabled: event.target.checked });
		          }
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Retry requests a host refuses. Direct is always tried first." })
		    ] }),
		    !enabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-web-network-warn", children: "The default free model needs this on." }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-network-field", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: "dsh-web-network-template", children: "Proxy URL" }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-network-row", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		          "input",
		          {
		            id: "dsh-web-network-template",
		            type: "text",
		            value: template,
		            spellCheck: false,
		            placeholder: bridge.defaults.template,
		            onChange: (event) => {
		              setTemplate(event.target.value);
		            },
		            onKeyDown: (event) => {
		              if (event.key === "Enter") apply2({ template: template.trim() });
		            }
		          }
		        ),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", disabled: busy, onClick: () => {
		          apply2({ template: template.trim() });
		        }, children: "Save" }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", disabled: busy, onClick: () => {
		          void test();
		        }, children: "Test" }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		          "button",
		          {
		            type: "button",
		            disabled: busy,
		            onClick: () => {
		              apply2({ template: bridge.defaults.template });
		            },
		            children: "Reset"
		          }
		        )
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "{url}" }),
		        " marks the target. The proxy sees the whole request."
		      ] })
		    ] }),
		    used.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-network-field", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Proxied this session" }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "dsh-web-network-list", children: used.map((origin) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: origin }, origin)) })
		    ] }),
		    status !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-web-network-status", ...status.error === true ? { "data-error": "" } : {}, children: status.text }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MachineNetwork, {})
		  ] });
		}
		function NetworkIcon({ className }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
		    "svg",
		    {
		      className,
		      width: "16",
		      height: "16",
		      viewBox: "0 0 16 16",
		      fill: "none",
		      stroke: "currentColor",
		      strokeWidth: "1.3",
		      strokeLinecap: "round",
		      strokeLinejoin: "round",
		      "aria-hidden": "true",
		      children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "6.1" }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2.1 6.2h11.8" }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2.1 9.8h11.8" }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 1.9c1.7 1.7 2.6 3.8 2.6 6.1S9.7 12.4 8 14.1C6.3 12.4 5.4 10.3 5.4 8S6.3 3.6 8 1.9Z" })
		      ]
		    }
		  );
		}
		function navGlyph(id, draw) {
		  const table = globalThis;
		  table.__DSH_SETTINGS_NAV_ICON__ ??= {};
		  table.__DSH_SETTINGS_NAV_ICON__[id] = draw;
		}
		var inject = ["slots"];
		function apply(ctx) {
		  if (document.getElementById("dsh-web-network-style") === null) {
		    const style = document.createElement("style");
		    style.id = "dsh-web-network-style";
		    style.textContent = STYLE;
		    document.head.append(style);
		  }
		  const slots = ctx.get("slots");
		  if (slots === void 0) return;
		  navGlyph("network", (className) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetworkIcon, { className }));
		  slots.inject("settings.section", () => slots.register({
		    name: "settings.section",
		    id: "network",
		    order: 12,
		    label: () => "Network"
		  }, NetworkSection));
		}
		var client_default = { apply, inject };

		return module.exports;
	}
});

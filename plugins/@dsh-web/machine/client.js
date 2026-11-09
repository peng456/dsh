window.__ModuleLoader__.load({
	id: "@dsh-web/machine",
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

		// packages/dsh-web-machine/src/client.tsx
		var client_exports = {};
		__export(client_exports, {
		  apply: () => apply,
		  default: () => client_default,
		  inject: () => inject
		});
		module.exports = __toCommonJS(client_exports);
		var import_react = require("react");
		var import_jsx_runtime = require("react/jsx-runtime");
		var ESC = "\x1B";
		function machineBridge() {
		  return globalThis.__DSH_WEB_MACHINE__;
		}
		function runtimeBridge() {
		  return globalThis.__DSH_WEB_RUNTIME__;
		}
		function size(bytes) {
		  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
		  return `${Math.max(1, Math.round(bytes / 1024)).toString()} KB`;
		}
		function consoleLabel(kind) {
		  if (kind === "serial") return "shell";
		  if (kind === "dos") return "DOS prompt";
		  return "graphical";
		}
		function runningName(active, guests) {
		  if (active.kind === "node") return "Node container";
		  if (active.kind === "browser") return "Browser";
		  return guests.find((guest) => guest.id === active.image)?.name ?? active.image;
		}
		function Screen({ guestName }) {
		  const stage = (0, import_react.useRef)(null);
		  const scaler = (0, import_react.useRef)(null);
		  const [step, setStep] = (0, import_react.useState)("Starting the machine\u2026");
		  const [failed, setFailed] = (0, import_react.useState)(void 0);
		  const [focused, setFocused] = (0, import_react.useState)(false);
		  const [full, setFull] = (0, import_react.useState)(false);
		  const [scale, setScale] = (0, import_react.useState)(1);
		  const [pointer, setPointer] = (0, import_react.useState)({ enabled: false, absolute: false, held: false });
		  const [locked, setLocked] = (0, import_react.useState)(false);
		  const fit = (0, import_react.useCallback)(() => {
		    const box = stage.current;
		    const inner = scaler.current;
		    const screen = inner?.firstElementChild;
		    if (box === null || inner === null || !(screen instanceof HTMLElement)) return;
		    inner.style.transform = "none";
		    const natural = screen.getBoundingClientRect();
		    if (natural.width < 1 || natural.height < 1) return;
		    const next = Math.min(box.clientWidth / natural.width, box.clientHeight / natural.height);
		    const clamped = Number.isFinite(next) && next > 0 ? next : 1;
		    inner.style.transform = `scale(${String(clamped)})`;
		    setScale(clamped);
		  }, []);
		  (0, import_react.useEffect)(() => {
		    const machine = machineBridge();
		    if (machine === void 0 || scaler.current === null) return;
		    let release;
		    let gone = false;
		    void (async () => {
		      try {
		        await machine.boot((next) => {
		          if (!gone) setStep(next);
		        });
		        if (gone || scaler.current === null) return;
		        const disposer = await machine.adoptScreen(scaler.current);
		        if (gone) {
		          disposer();
		          return;
		        }
		        release = disposer;
		        setStep("");
		        fit();
		      } catch (error) {
		        if (!gone) setFailed(error instanceof Error ? error.message : String(error));
		      }
		    })();
		    return () => {
		      gone = true;
		      release?.();
		    };
		  }, [fit]);
		  (0, import_react.useEffect)(() => {
		    const read = () => {
		      const machine = machineBridge();
		      if (machine === void 0) return;
		      const next = machine.pointer();
		      setPointer((previous) => previous.enabled === next.enabled && previous.absolute === next.absolute && previous.held === next.held ? previous : next);
		    };
		    read();
		    const timer = setInterval(read, 500);
		    return () => {
		      clearInterval(timer);
		    };
		  }, []);
		  (0, import_react.useEffect)(() => {
		    const onChange = () => {
		      const mine = document.pointerLockElement === scaler.current;
		      setLocked(mine);
		      machineBridge()?.usePointer(mine);
		    };
		    document.addEventListener("pointerlockchange", onChange);
		    return () => {
		      document.removeEventListener("pointerlockchange", onChange);
		      machineBridge()?.usePointer(false);
		    };
		  }, []);
		  (0, import_react.useEffect)(() => {
		    const box = stage.current;
		    const inner = scaler.current;
		    if (box === null || inner === null) return;
		    const sizes = new ResizeObserver(() => {
		      fit();
		    });
		    sizes.observe(box);
		    const observeScreen = () => {
		      const screen = inner.firstElementChild;
		      if (!(screen instanceof HTMLElement)) return;
		      sizes.observe(screen);
		      for (const child of Array.from(screen.children)) if (child instanceof HTMLElement) sizes.observe(child);
		    };
		    observeScreen();
		    const arrivals = new MutationObserver(() => {
		      observeScreen();
		      fit();
		    });
		    arrivals.observe(inner, { childList: true, subtree: true });
		    return () => {
		      sizes.disconnect();
		      arrivals.disconnect();
		    };
		  }, [fit]);
		  (0, import_react.useEffect)(() => {
		    const onChange = () => {
		      setFull(document.fullscreenElement === stage.current);
		      requestAnimationFrame(fit);
		    };
		    document.addEventListener("fullscreenchange", onChange);
		    return () => {
		      document.removeEventListener("fullscreenchange", onChange);
		    };
		  }, [fit]);
		  const toggleFull = (0, import_react.useCallback)(() => {
		    const box = stage.current;
		    if (box === null) return;
		    if (document.fullscreenElement === box) {
		      void document.exitFullscreen().catch(() => void 0);
		      return;
		    }
		    void box.requestFullscreen().then(
		      () => {
		        scaler.current?.focus();
		      },
		      () => void 0
		    );
		  }, []);
		  const onKey = (0, import_react.useCallback)((event) => {
		    const machine = machineBridge();
		    if (machine === void 0) return;
		    if (machine.key(event.nativeEvent.code, event.type === "keydown")) event.preventDefault();
		  }, []);
		  if (failed !== void 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh-web-machine-notice", children: failed });
		  const owned = pointer.enabled && pointer.absolute;
		  const lockable = pointer.enabled && !pointer.absolute;
		  (0, import_react.useEffect)(() => {
		    if (!owned) return;
		    machineBridge()?.usePointer(true);
		    return () => {
		      machineBridge()?.usePointer(false);
		    };
		  }, [owned]);
		  const grab = (0, import_react.useCallback)(() => {
		    scaler.current?.focus();
		    if (!lockable || document.pointerLockElement !== null) return;
		    void Promise.resolve(scaler.current?.requestPointerLock()).catch(() => void 0);
		  }, [lockable]);
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-machine-stage", ref: stage, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      "div",
		      {
		        className: "dsh-web-machine-screen",
		        ...focused ? { "data-focused": "" } : {},
		        ...owned || locked ? { "data-owned": "" } : {},
		        ref: scaler,
		        tabIndex: 0,
		        role: "application",
		        "aria-label": `${guestName}: the machine's screen`,
		        onFocus: () => {
		          setFocused(true);
		        },
		        onBlur: () => {
		          setFocused(false);
		        },
		        onKeyDown: onKey,
		        onKeyUp: onKey,
		        onClick: grab
		      }
		    ),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-machine-overlay", children: [
		      step === "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-web-machine-zoom", children: `${String(Math.round(scale * 100))}%` }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-web-machine-step", children: step }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-web-machine-hint", children: locked ? "The mouse and keyboard are going to the machine. Press Escape to get them back." : lockable ? "The machine has a mouse but is not being given one. Click the screen to hand it over." : focused ? "The keyboard is going to the machine. Click outside to give it back." : "Click the screen to type at the machine." }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: toggleFull, children: full ? "Leave full screen" : "Full screen" })
		    ] })
		  ] });
		}
		function surfaceColours(element) {
		  const fallback = { background: "#0d1017", foreground: "#dfe3ea", cursor: "#7fd1a0" };
		  if (element === null) return fallback;
		  const style = getComputedStyle(element);
		  const background = style.backgroundColor;
		  const foreground = style.color;
		  if (background === "" || background === "transparent" || background.startsWith("rgba(0, 0, 0, 0")) return fallback;
		  return { background, foreground: foreground === "" ? fallback.foreground : foreground, cursor: fallback.cursor };
		}
		function TerminalScreen({ open }) {
		  const host = (0, import_react.useRef)(null);
		  const started = (0, import_react.useRef)(false);
		  const fitter = (0, import_react.useRef)(void 0);
		  const emulator = (0, import_react.useRef)(void 0);
		  const gone = (0, import_react.useRef)(false);
		  const [message, setMessage] = (0, import_react.useState)(void 0);
		  (0, import_react.useEffect)(() => () => {
		    gone.current = true;
		    emulator.current?.dispose();
		  }, []);
		  (0, import_react.useEffect)(() => {
		    if (!open) return;
		    const frame = requestAnimationFrame(() => {
		      fitter.current?.fit();
		      const terminal = emulator.current;
		      if (terminal !== void 0) terminal.refresh(0, Math.max(0, terminal.rows - 1));
		    });
		    return () => {
		      cancelAnimationFrame(frame);
		    };
		  }, [open]);
		  (0, import_react.useEffect)(() => {
		    if (!open || started.current || host.current === null) return;
		    const runtime = runtimeBridge();
		    if (runtime === void 0) {
		      setMessage("The runtime bridge is not available in this build.");
		      return;
		    }
		    const reason = runtime.unavailable();
		    if (reason !== void 0) {
		      setMessage(reason);
		      return;
		    }
		    started.current = true;
		    let terminal;
		    void (async () => {
		      const { Terminal, FitAddon, styles } = await runtime.terminal();
		      if (gone.current) return;
		      if (document.getElementById("dsh-web-machine-xterm-style") === null) {
		        const style = document.createElement("style");
		        style.id = "dsh-web-machine-xterm-style";
		        style.textContent = styles;
		        document.head.append(style);
		      }
		      terminal = new Terminal({
		        // The shell is not behind a line discipline, so a bare newline arrives
		        // without the carriage return a tty would have added.
		        convertEol: true,
		        cursorBlink: true,
		        fontSize: 12.5,
		        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
		        // Read off the panel this terminal is inside rather than written down
		        // here. xterm paints its own background, so a hard-coded dark pair was
		        // a black rectangle in a light panel; asking the element what colour it
		        // ended up means the terminal follows the theme for free, including
		        // themes this build has never seen.
		        theme: surfaceColours(host.current?.closest(".dsh-web-machine") ?? null)
		      });
		      const fit = new FitAddon();
		      fitter.current = fit;
		      emulator.current = terminal;
		      terminal.loadAddon(fit);
		      terminal.open(host.current);
		      fit.fit();
		      globalThis.__DSH_TERMINAL__ = {
		        text: () => {
		          const buffer = terminal.buffer.active;
		          const lines = [];
		          for (let i = 0; i < buffer.length; i++) lines.push(buffer.getLine(i)?.translateToString(true) ?? "");
		          return lines.join("\n");
		        },
		        send: (text) => {
		          void writer?.write(text);
		        }
		      };
		      terminal.write(`${ESC}[38;5;108mStarting the runtime\u2026${ESC}[0m\r
		`);
		      let writer;
		      try {
		        await runtime.boot((step) => {
		          terminal.write(`${ESC}[38;5;244m${step}\u2026${ESC}[0m\r
		`);
		        });
		        const shell = await runtime.startShell({ cols: terminal.cols, rows: terminal.rows });
		        void shell.output.pipeTo(new WritableStream({
		          write(chunk) {
		            terminal.write(chunk);
		          }
		        })).catch(() => void 0);
		        writer = shell.input.getWriter();
		        terminal.onData((data) => {
		          void writer?.write(data);
		        });
		        terminal.onResize((grid) => {
		          shell.resize(grid);
		        });
		        const resize = () => {
		          fit.fit();
		        };
		        window.addEventListener("resize", resize);
		        await shell.exit;
		        window.removeEventListener("resize", resize);
		        terminal.write(`\r
		${ESC}[38;5;244m[the shell exited \u2014 reload to start a new one]${ESC}[0m\r
		`);
		      } catch (error) {
		        terminal.write(`\r
		${ESC}[31m${error instanceof Error ? error.message : String(error)}${ESC}[0m\r
		`);
		        started.current = false;
		      }
		    })();
		  }, [open]);
		  return message === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-web-machine-terminal", ref: host }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh-web-machine-notice", children: message });
		}
		function MachinePanel({ open, onClose }) {
		  const machine = machineBridge();
		  const active = machine?.selection() ?? { kind: "node" };
		  const guests = machine?.guests() ?? [];
		  const status = machine?.status();
		  const emulated = active.kind === "v86";
		  const browsing = active.kind === "browser";
		  const panel = (0, import_react.useRef)(null);
		  (0, import_react.useEffect)(() => dockAside(panel.current, DOCK_VARIABLE), []);
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
		    "div",
		    {
		      className: "dsh-web-machine",
		      ref: panel,
		      ...emulated || browsing ? { "data-emulated": "" } : {},
		      ...open ? { "data-open": "" } : { hidden: true },
		      children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-machine-bar", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-web-machine-title", children: "Machine" }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-web-machine-now", children: runningName(active, guests) }),
		          emulated && status?.running === true && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => {
		            void machine?.restart().then(() => {
		              location.reload();
		            });
		          }, children: "Restart" }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: onClose, children: "Close" })
		        ] }),
		        emulated ? open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Screen, { guestName: runningName(active, guests) }) : browsing ? open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrowserScreen, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TerminalScreen, { open })
		      ]
		    }
		  );
		}
		function BrowserScreen() {
		  const stage = (0, import_react.useRef)(null);
		  const scaler = (0, import_react.useRef)(null);
		  const [tabs, setTabs] = (0, import_react.useState)([]);
		  const [typed, setTyped] = (0, import_react.useState)("");
		  const [editing, setEditing] = (0, import_react.useState)(false);
		  const [failed, setFailed] = (0, import_react.useState)(void 0);
		  const browser = machineBridge()?.browser;
		  const fit = (0, import_react.useCallback)(() => {
		    const box = stage.current;
		    const inner = scaler.current;
		    if (box === null || inner === null || browser === void 0) return;
		    const next = Math.min(
		      box.clientWidth / browser.viewport.width,
		      box.clientHeight / browser.viewport.height
		    );
		    const clamped = Number.isFinite(next) && next > 0 ? Math.min(next, 1) : 1;
		    inner.style.transform = `scale(${String(clamped)})`;
		  }, [browser]);
		  (0, import_react.useEffect)(() => {
		    if (browser === void 0 || scaler.current === null) return;
		    let release;
		    let gone = false;
		    void (async () => {
		      try {
		        const disposer = await browser.adopt(scaler.current);
		        if (gone) {
		          disposer();
		          return;
		        }
		        release = disposer;
		        setTabs(browser.tabs());
		        fit();
		      } catch (error) {
		        if (!gone) setFailed(error instanceof Error ? error.message : String(error));
		      }
		    })();
		    return () => {
		      gone = true;
		      release?.();
		    };
		  }, [browser, fit]);
		  (0, import_react.useEffect)(() => {
		    if (browser === void 0) return;
		    const stop = browser.watch(() => {
		      setTabs(browser.tabs());
		    });
		    return () => {
		      stop();
		    };
		  }, [browser]);
		  (0, import_react.useEffect)(() => {
		    const box = stage.current;
		    if (box === null) return;
		    const sizes = new ResizeObserver(() => {
		      fit();
		    });
		    sizes.observe(box);
		    return () => {
		      sizes.disconnect();
		    };
		  }, [fit]);
		  const current = tabs.find((tab) => tab.active);
		  const showing = current?.url === void 0 || current.url === "about:blank" ? "" : current.url;
		  (0, import_react.useEffect)(() => {
		    if (!editing) setTyped(showing);
		  }, [showing, editing]);
		  const goto = (0, import_react.useCallback)((url) => {
		    if (browser === void 0 || url.trim() === "") return;
		    setEditing(false);
		    setFailed(void 0);
		    void browser.navigate(url.trim()).catch((error) => {
		      setFailed(error instanceof Error ? error.message : String(error));
		    });
		  }, [browser]);
		  if (browser === void 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-web-browser-note", children: "This build has no browser machine." });
		  }
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-browser", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-browser-tabs", children: [
		      tabs.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
		        "span",
		        {
		          className: "dsh-web-browser-tab",
		          ...tab.active ? { "data-active": "" } : {},
		          title: tab.url,
		          children: [
		            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", onClick: () => {
		              browser.select(tab.id);
		            }, children: [
		              tab.loading ? "\xB7 " : "",
		              tab.title === "" ? tab.url : tab.title
		            ] }),
		            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		              "button",
		              {
		                type: "button",
		                className: "dsh-web-browser-tab-close",
		                "aria-label": `Close ${tab.title}`,
		                onClick: () => {
		                  browser.close(tab.id);
		                },
		                children: "\xD7"
		              }
		            )
		          ]
		        },
		        tab.id
		      )),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "button",
		        {
		          type: "button",
		          className: "dsh-web-browser-new",
		          "aria-label": "New tab",
		          onClick: () => {
		            void browser.newTab().catch(() => void 0);
		          },
		          children: "+"
		        }
		      )
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-browser-bar", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "button",
		        {
		          type: "button",
		          disabled: current?.canGoBack !== true,
		          "aria-label": "Back",
		          onClick: () => {
		            void browser.go(-1).catch(() => void 0);
		          },
		          children: "\u2039"
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "button",
		        {
		          type: "button",
		          disabled: current?.canGoForward !== true,
		          "aria-label": "Forward",
		          onClick: () => {
		            void browser.go(1).catch(() => void 0);
		          },
		          children: "\u203A"
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "input",
		        {
		          className: "dsh-web-browser-url",
		          value: typed,
		          placeholder: "Enter a URL",
		          spellCheck: false,
		          onChange: (event) => {
		            setEditing(true);
		            setTyped(event.currentTarget.value);
		          },
		          onKeyDown: (event) => {
		            if (event.key === "Enter") goto(event.currentTarget.value);
		            if (event.key === "Escape") setEditing(false);
		          }
		        }
		      )
		    ] }),
		    (failed ?? current?.error) !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-web-browser-error", children: failed ?? current?.error }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-web-browser-stage", ref: stage, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-web-browser-scaler", ref: scaler }) })
		  ] });
		}
		var DOCK_VARIABLE = "--dsh-web-dock-machine";
		function dockAside(panel, variable) {
		  if (panel === null) return () => void 0;
		  let frame = null;
		  for (let node = panel.parentElement; node !== null; node = node.parentElement) {
		    const style = getComputedStyle(node);
		    if (style.display === "grid" && style.position === "relative") {
		      frame = node;
		      break;
		    }
		  }
		  if (frame === null) return () => void 0;
		  frame.dataset.dshWebDock = "";
		  const apply2 = () => {
		    const box = panel.getBoundingClientRect();
		    const aside = box.width > 0 && box.left > 1 && box.right >= window.innerWidth - 1 && box.height >= window.innerHeight - 1;
		    frame.style.setProperty(variable, aside ? `${String(Math.round(box.width))}px` : "0px");
		  };
		  apply2();
		  const sizes = new ResizeObserver(apply2);
		  sizes.observe(panel);
		  window.addEventListener("resize", apply2);
		  return () => {
		    sizes.disconnect();
		    window.removeEventListener("resize", apply2);
		    frame.style.setProperty(variable, "0px");
		  };
		}
		function MachineRow({
		  title,
		  detail,
		  tags,
		  chosen,
		  onChoose,
		  action,
		  children
		}) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-machine-row", ...chosen ? { "data-chosen": "" } : {}, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "dsh-web-machine-pick", onClick: onChoose, "aria-pressed": chosen, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-web-machine-name", children: title }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-web-machine-tags", children: tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tag }, tag)) }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-web-machine-detail", children: detail })
		    ] }),
		    action,
		    children
		  ] });
		}
		function MachineSettings() {
		  const machine = machineBridge();
		  const [chosen, setChosen] = (0, import_react.useState)(() => machine?.selection() ?? { kind: "node" });
		  const [disks, setDisks] = (0, import_react.useState)([]);
		  const [host, setHost] = (0, import_react.useState)(() => machine?.imageHost() ?? "");
		  const [keepShots, setKeepShots] = (0, import_react.useState)(() => machine?.keepScreenshots() ?? false);
		  const [saved, setSaved] = (0, import_react.useState)(false);
		  const [problem, setProblem] = (0, import_react.useState)(void 0);
		  const active = machine?.selection() ?? { kind: "node" };
		  const guests = machine?.guests() ?? [];
		  const refreshDisks = (0, import_react.useCallback)(() => {
		    void machine?.disks().then(setDisks).catch(() => void 0);
		  }, [machine]);
		  (0, import_react.useEffect)(() => {
		    refreshDisks();
		  }, [refreshDisks]);
		  const choose = (0, import_react.useCallback)((next) => {
		    setChosen(next);
		    setSaved(false);
		  }, []);
		  const apply2 = (0, import_react.useCallback)(() => {
		    machine?.select(chosen);
		    if (host.trim() !== "") machine?.setImageHost(host.trim());
		    setSaved(true);
		  }, [machine, chosen, host]);
		  const openDisk = (0, import_react.useCallback)(async (guest, slot, file) => {
		    if (file === void 0 || machine === void 0) return;
		    setProblem(void 0);
		    try {
		      await machine.storeDisk(guest, slot, file);
		    } catch (error) {
		      setProblem(`${file.name} could not be kept: ${error instanceof Error ? error.message : String(error)}`);
		      return;
		    }
		    refreshDisks();
		  }, [machine, refreshDisks]);
		  const same = active.kind === chosen.kind && (active.kind !== "v86" || chosen.kind !== "v86" || active.image === chosen.image);
		  const storedHost = machine?.imageHost() ?? "";
		  const typedHost = host.trim() === "" ? "" : host.trim().endsWith("/") ? host.trim() : `${host.trim()}/`;
		  const hostChanged = typedHost !== "" && typedHost !== storedHost;
		  const savedNote = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
		    "Saved. It applies on the next load \u2014",
		    " ",
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh-web-machine-link", onClick: () => {
		      location.reload();
		    }, children: "reload now" }),
		    "."
		  ] });
		  const rowAction = (chosenHere) => chosenHere && !same && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-machine-apply", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: apply2, children: "Use this machine" }),
		    saved && savedNote
		  ] });
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-machine-settings", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Machine" }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "dsh-web-machine-lede", children: [
		      "Applies on the next load. Now running ",
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: runningName(active, guests) }),
		      "."
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      MachineRow,
		      {
		        title: "Node container",
		        detail: "Node 22, npm, CPython with pip, and the assistant's own filesystem.",
		        tags: ["terminal", "nothing to download"],
		        chosen: chosen.kind === "node",
		        onChoose: () => {
		          choose({ kind: "node" });
		        },
		        action: rowAction(chosen.kind === "node")
		      }
		    ),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      MachineRow,
		      {
		        title: "Browser",
		        detail: "Real tabs of the real web, each sandboxed away from this page. The assistant drives them by the page structure, by pixels, or by running JavaScript in the page.",
		        tags: ["tabs", "nothing to download", "cannot log in"],
		        chosen: chosen.kind === "browser",
		        onChoose: () => {
		          choose({ kind: "browser" });
		        },
		        action: rowAction(chosen.kind === "browser")
		      }
		    ),
		    guests.map((guest) => {
		      const opened = disks.filter((disk) => disk.guest === guest.id);
		      const openedFor = (slot) => opened.find(
		        // A row an earlier version stored carries no slot, and was always the
		        // guest's boot image — which is the first file it declares.
		        (disk) => disk.slot === slot || disk.slot === "" && guest.files[0]?.slot === slot
		      );
		      const supplied = guest.files.every((entry) => openedFor(entry.slot) !== void 0);
		      const ready = guest.bundled || supplied && guest.filesystem === void 0;
		      const bytes = opened.reduce((sum, disk) => sum + disk.size, 0);
		      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        MachineRow,
		        {
		          title: guest.name,
		          detail: guest.boots === void 0 ? guest.summary : `${guest.summary} Boots in ${guest.boots}.`,
		          tags: [
		            consoleLabel(guest.console),
		            opened.length === 0 ? size(guest.transfer) : `${size(bytes)} on this device`,
		            ...ready ? [] : ["needs a disk"]
		          ],
		          chosen: chosen.kind === "v86" && chosen.image === guest.id,
		          onChoose: () => {
		            choose({ kind: "v86", image: guest.id });
		          },
		          action: rowAction(chosen.kind === "v86" && chosen.image === guest.id),
		          children: (!guest.bundled || opened.length > 0 || chosen.kind === "v86" && chosen.image === guest.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-machine-disk", children: [
		            guest.filesystem !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh-web-machine-tree", children: [
		              guest.name,
		              " reads its root filesystem from ",
		              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: guest.filesystem }),
		              " on the image host, one file at a time \u2014 a directory, not an image, so opening a file cannot supply it. This machine needs an image host that serves that tree."
		            ] }),
		            guest.files.map((entry) => {
		              const stored = openedFor(entry.slot);
		              return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh-web-machine-file", children: stored === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
		                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: entry.file }),
		                  " \u2014 ",
		                  entry.held ? "fetched for you when this machine starts. Open your own copy instead:" : "not on the default image host. Point the image host below at one that has it, or open it from this computer:"
		                ] }),
		                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		                  "input",
		                  {
		                    type: "file",
		                    "aria-label": guest.files.length === 1 ? `Disk image for ${guest.name}` : `${entry.file} for ${guest.name}`,
		                    onChange: (event) => {
		                      void openDisk(guest.id, entry.slot, event.currentTarget.files?.[0]);
		                    }
		                  }
		                )
		              ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
		                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: entry.file }),
		                  " \u2014 using ",
		                  stored.name,
		                  " from this computer (",
		                  size(stored.size),
		                  "), kept in this browser."
		                ] }),
		                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		                  "button",
		                  {
		                    type: "button",
		                    onClick: () => {
		                      void machine?.forgetDisk(guest.id, entry.slot).then(refreshDisks);
		                    },
		                    children: "Forget it"
		                  }
		                )
		              ] }) }, entry.slot);
		            })
		          ] })
		        },
		        guest.id
		      );
		    }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Image host" }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh-web-machine-lede", children: "Where disk images come from. Blank uses the default mirror." }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-machine-host", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "input",
		        {
		          type: "url",
		          value: host,
		          spellCheck: false,
		          placeholder: machine?.hosts.default,
		          "aria-label": "Image host",
		          onChange: (event) => {
		            setHost(event.currentTarget.value);
		          }
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => {
		        setHost(machine?.hosts.default ?? "");
		      }, children: "Default" })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Screenshots" }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh-web-machine-lede", children: "The assistant sees the screen by photographing it, and watching a machine takes a great many photographs. It is shown each one whether or not this is on; what this decides is whether a copy is also left in the workspace." }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh-web-machine-toggle", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "input",
		        {
		          type: "checkbox",
		          checked: keepShots,
		          onChange: (event) => {
		            setKeepShots(machine?.setKeepScreenshots(event.currentTarget.checked) ?? false);
		          }
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
		        "Keep every screenshot in ",
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "screenshots/" }),
		        ". Off, the assistant still writes one when it asks for a particular file \u2014 or when the model it is running on cannot be shown a picture at all, since then the file is all there is."
		      ] })
		    ] }),
		    problem !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh-web-machine-problem", children: problem }),
		    same && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh-web-machine-apply", "data-end": true, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", disabled: !hostChanged, onClick: apply2, children: "Save image host" }),
		      saved && savedNote
		    ] })
		  ] });
		}
		function MachineIcon({ className }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
		    "svg",
		    {
		      className: className ?? "dsh-web-machine-action-icon",
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
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "1.6", y: "3", width: "12.8", height: "8.4", rx: "1.6" }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5.6 13.6h4.8" }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 11.4v2.2" }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4.9 6.2 6.4 7.3 4.9 8.4" }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8.1 8.8h3.1" })
		      ]
		    }
		  );
		}
		function navGlyph(id, draw) {
		  const table = globalThis;
		  table.__DSH_SETTINGS_NAV_ICON__ ??= {};
		  table.__DSH_SETTINGS_NAV_ICON__[id] = draw;
		}
		function MachineAction({ open, onToggle, wide }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
		    "button",
		    {
		      type: "button",
		      className: "dsh-web-machine-action",
		      ...wide ? {} : { "data-rail": "" },
		      ...open ? { "data-open": "" } : {},
		      "aria-expanded": open,
		      "aria-label": "Machine panel",
		      onClick: onToggle,
		      title: "Show the machine this session runs on (Ctrl+`)",
		      children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MachineIcon, {}),
		        wide && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh-web-machine-action-label", children: "Machine" })
		      ]
		    }
		  );
		}
		var STYLE = `
		/* Colours from the surface's own tokens, with the system pair underneath.
		   The literals that were here \u2014 a near-black panel and a pale grey type \u2014
		   made this the one surface in the app that stayed dark when the theme went
		   light. Canvas and CanvasText are the browser's own pair and they move
		   together, so a token this deployment's theme happens not to define still
		   lands on a background and a foreground that belong to each other. */
		.dsh-web-machine[hidden]{display:none}
		.dsh-web-machine{position:fixed;left:0;right:0;bottom:0;height:min(52vh,32rem);z-index:60;display:flex;
		 flex-direction:column;background:var(--dsw-alias-bg-layer-1,Canvas);color:var(--dsw-alias-label-primary,CanvasText);
		 border-top:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.3));box-shadow:0 -8px 32px rgba(0,0,0,.18)}
		.dsh-web-machine[data-emulated]{height:min(72vh,44rem)}

		/* The app frame gives up the width a right-hand column takes, the way it does
		   for the sidebar on the other side. \`max()\` of the two panels' contributions
		   rather than either alone: both can be open, they dock to the same edge, and
		   the gap that has to be there is the wider of the two. See \`dockAside\`. */
		[data-dsh-web-dock]{box-sizing:border-box;
		 padding-right:max(var(--dsh-web-dock-machine,0px),var(--dsh-web-dock-files,0px));
		 transition:padding-right .16s ease}

		/* Which edge it comes in from follows the shape of the window rather than a
		   guess about the device. A landscape window has height to spare and width to
		   lose, so a full-height column on the right leaves the conversation readable
		   beside it; a portrait one \u2014 a phone, a split screen \u2014 has the opposite
		   problem, and a drawer along the bottom is the only shape that fits. The
		   breakpoint is an aspect ratio and a floor, because a narrow landscape window
		   is still narrow.
		   Two numbers rather than one, because the column takes width from the
		   conversation rather than covering it: the window has to be wide enough for
		   three columns before this is an improvement, and the panel is capped so the
		   conversation keeps about twenty-six rems whatever the panel would like. */
		@media (min-aspect-ratio: 1/1) and (min-width: 80rem) {
		  .dsh-web-machine{left:auto;top:0;bottom:0;height:auto;width:min(46vw,54rem,100vw - 44rem);
		   border-top:0;border-left:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.3));
		   box-shadow:-8px 0 32px rgba(0,0,0,.18)}
		  .dsh-web-machine[data-emulated]{height:auto;width:min(58vw,68rem,100vw - 44rem)}
		}

		/* The browser machine: a tab strip, an address bar, and the tabs themselves.
		   The stage is what the frames are scaled into, and it is the only part that
		   is allowed to be smaller than the tab really is \u2014 everything above it is
		   chrome at the panel's own scale, so the controls stay legible however far
		   down a 1280-pixel-wide tab has been scaled to fit. */
		.dsh-web-browser{display:flex;flex-direction:column;min-height:0;flex:1}
		.dsh-web-browser-tabs{display:flex;align-items:stretch;gap:.25rem;padding:.3rem .5rem 0;overflow-x:auto;flex:none}
		.dsh-web-browser-tab{display:flex;align-items:center;max-width:14rem;border-radius:.4rem .4rem 0 0;
		 background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.12))}
		.dsh-web-browser-tab[data-active]{background:var(--dsw-alias-bg-layer-1,Canvas);
		 box-shadow:inset 0 -2px 0 var(--dsw-alias-brand,#2f81f7)}
		.dsh-web-browser-tab > button{border:0;background:none;color:inherit;font:inherit;font-size:.8rem;
		 padding:.35rem .5rem;max-width:11rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
		.dsh-web-browser-tab-close{opacity:.6;padding:.35rem .4rem !important}
		.dsh-web-browser-tab-close:hover{opacity:1}
		.dsh-web-browser-new{border:0;background:none;color:inherit;font:inherit;padding:.35rem .6rem;cursor:pointer;opacity:.7}
		.dsh-web-browser-new:hover{opacity:1}
		.dsh-web-browser-bar{display:flex;align-items:center;gap:.35rem;padding:.35rem .5rem;flex:none;
		 border-bottom:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.3))}
		.dsh-web-browser-bar > button{border:0;background:none;color:inherit;font:inherit;font-size:1rem;
		 padding:.1rem .45rem;cursor:pointer;border-radius:.3rem}
		.dsh-web-browser-bar > button:disabled{opacity:.3;cursor:default}
		.dsh-web-browser-url{flex:1;min-width:0;font:inherit;font-size:.8rem;padding:.25rem .5rem;border-radius:.35rem;
		 border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.3));background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.08));
		 color:inherit}
		.dsh-web-browser-error{flex:none;padding:.35rem .6rem;font-size:.75rem;
		 background:rgba(200,40,40,.12);color:var(--dsw-alias-label-primary,CanvasText)}
		.dsh-web-browser-note{padding:1rem;font-size:.85rem;opacity:.8}
		/* The frames are laid out at their real size and scaled by a transform, so the
		   stage has to clip rather than scroll: a transform does not change the box the
		   element reserves, and without this the panel would scroll to a tab's full
		   1280x800 however small it had been drawn. */
		.dsh-web-browser-stage{flex:1;min-height:0;overflow:hidden;display:flex;align-items:flex-start;
		 justify-content:center;background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.08))}
		.dsh-web-browser-scaler{transform-origin:top center;flex:none;position:relative}

		.dsh-web-machine-bar{display:flex;align-items:center;gap:.75rem;padding:.4rem .75rem;flex:none;
		 color:var(--dsw-alias-label-primary,CanvasText);
		 border-bottom:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.2));
		 font:12px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}
		.dsh-web-machine-title{font-weight:600}
		.dsh-web-machine-now{opacity:.55;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
		.dsh-web-machine-bar button{font:inherit;background:transparent;color:inherit;cursor:pointer;
		 border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.4));border-radius:.35rem;padding:.15rem .5rem}
		.dsh-web-machine-bar button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
		.dsh-web-machine-terminal{flex:1;min-height:0;padding:.35rem .5rem}
		.dsh-web-machine-notice{padding:1rem;font:12px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;
		 color:var(--dsw-alias-label-secondary,inherit);opacity:.85}

		/* The screen, and the box it is fitted into. Grid rather than flex so a screen
		   larger than the box still centres on it \u2014 the transform brings it back
		   inside, and a flex item that overflows is clipped from one side only. */
		.dsh-web-machine-stage{position:relative;flex:1;min-height:0;display:grid;place-items:center;overflow:hidden;background:#000}
		.dsh-web-machine-screen{transform-origin:center center;line-height:0;outline:none;
		 box-shadow:0 0 0 2px transparent;transition:box-shadow .12s}
		.dsh-web-machine-screen[data-focused]{box-shadow:0 0 0 2px var(--dsw-alias-border-focus,#2f81f7)}
		/* The guest is drawing the cursor, or the browser has taken it away: either
		   way there is exactly one pointer on this screen and it is not the host's.
		   The rule is on the scaler as well as v86's own container because the
		   transform gives this element a box of its own, and a hair of it can stick
		   out past the picture. */
		.dsh-web-machine-screen[data-owned],.dsh-web-machine-screen[data-owned] *{cursor:none}
		/* Nearest-neighbour: every guest here draws pixels that mean something at
		   their own size, and a smoothing filter over a DOS text screen is a blurred
		   DOS text screen. */
		.dsh-web-machine-screen canvas,.dsh-web-machine-screen img{image-rendering:pixelated}
		.dsh-web-machine-overlay{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:.6rem;
		 padding:.3rem .6rem;background:linear-gradient(transparent,rgba(0,0,0,.72));color:#dfe3ea;
		 font:11px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;pointer-events:none}
		.dsh-web-machine-overlay button{pointer-events:auto;font:inherit;background:rgba(0,0,0,.45);
		 border:1px solid rgba(255,255,255,.35);color:inherit;border-radius:.35rem;padding:.15rem .5rem;cursor:pointer}
		.dsh-web-machine-hint{flex:1;opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
		.dsh-web-machine-step,.dsh-web-machine-zoom{opacity:.75;font-variant-numeric:tabular-nums}

		/* The Settings page. */
		.dsh-web-machine-settings{font:13px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;
		 color:var(--dsw-alias-label-primary,inherit)}
		.dsh-web-machine-settings h3{margin:1.4rem 0 .4rem;font-size:13px;letter-spacing:.02em;text-transform:uppercase;opacity:.6}
		.dsh-web-machine-settings h3:first-child{margin-top:0}
		.dsh-web-machine-lede{margin:0 0 .7rem;opacity:.72;max-width:52rem}
		.dsh-web-machine-lede code{font-size:12px;opacity:.9}
		.dsh-web-machine-row{border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.22));border-radius:.5rem;
		 margin-bottom:.4rem;overflow:hidden}
		.dsh-web-machine-row[data-chosen]{border-color:var(--dsw-alias-border-focus,#2f81f7)}
		.dsh-web-machine-pick{display:grid;grid-template-columns:minmax(9rem,auto) 1fr;gap:.15rem .75rem;width:100%;
		 text-align:left;background:0 0;border:0;color:inherit;font:inherit;padding:.6rem .75rem;cursor:pointer}
		.dsh-web-machine-pick:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.1))}
		.dsh-web-machine-name{font-weight:600}
		.dsh-web-machine-tags{display:flex;gap:.35rem;flex-wrap:wrap;justify-self:start}
		.dsh-web-machine-tags span{font-size:11px;padding:.05rem .4rem;border-radius:.6rem;opacity:.75;
		 border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35))}
		.dsh-web-machine-detail{grid-column:1/-1;opacity:.7}
		.dsh-web-machine-disk{display:flex;flex-direction:column;gap:.45rem;padding:.5rem .75rem;font-size:12px;
		 opacity:.85;border-top:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.18))}
		.dsh-web-machine-file{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem}
		.dsh-web-machine-file span{flex:1;min-width:16rem}
		.dsh-web-machine-tree{display:block}
		.dsh-web-machine-problem{margin:.8rem 0 0;color:var(--dsw-alias-label-danger,#f5a3a3)}
		.dsh-web-machine-toggle{display:flex;gap:.6rem;align-items:flex-start;cursor:pointer;max-width:52rem}
		.dsh-web-machine-toggle input{margin-top:.25rem}
		.dsh-web-machine-toggle span{opacity:.85}
		.dsh-web-machine-host{display:flex;gap:.5rem;align-items:center}
		.dsh-web-machine-host input{flex:1;font:inherit;padding:.3rem .5rem;border-radius:.35rem;background:transparent;
		 color:inherit;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.4))}
		.dsh-web-machine-apply{display:flex;align-items:center;flex-wrap:wrap;gap:.7rem;padding:.5rem .75rem;
		 border-top:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.18))}
		.dsh-web-machine-apply[data-end]{margin:1.4rem 0 0;padding:0;border-top:0}
		.dsh-web-machine-apply button,.dsh-web-machine-disk button,.dsh-web-machine-host button{font:inherit;cursor:pointer;
		 border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.4));background:transparent;color:inherit;
		 border-radius:.35rem;padding:.3rem .7rem}
		.dsh-web-machine-apply button:disabled{opacity:.4;cursor:default}
		.dsh-web-machine-link{border:0!important;padding:0!important;text-decoration:underline;background:0 0;color:inherit;
		 font:inherit;cursor:pointer}

		/* The sidebar row, in the shape the sidebar's Settings row already has. */
		.dsh-web-machine-action{box-sizing:border-box;display:flex;align-items:center;gap:8px;flex:0 0 calc(100% + 8px);
		 width:calc(100% + 8px);height:34px;margin:4px -4px;padding:6px 2px 6px 10px;border:none;border-radius:12px;
		 background:0 0;color:var(--dsw-alias-label-primary,inherit);font-family:inherit;font-size:14px;line-height:22px;
		 cursor:pointer;overflow:hidden}
		.dsh-web-machine-action:hover,.dsh-web-machine-action[data-open]{
		 background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
		.dsh-web-machine-action-icon{flex:none}
		.dsh-web-machine-action-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
		.dsh-web-machine-action[data-rail]{flex:0 0 36px;justify-content:center;gap:0;width:36px;height:36px;
		 margin:4px 0;padding:0;border-radius:50%}
		/* The foot's action line is one nowrap row, so a second action would sit beside
		   this one. Opening the line is what puts each action on a row of its own \u2014
		   the two shapes cover the slot renderer's wrapper being present or not, and
		   nothing else in the tree has this element as a child or grandchild. */
		:has(> .dsh-web-machine-action),:has(> * > .dsh-web-machine-action){flex-wrap:wrap}
		`;
		var inject = ["slots"];
		function apply(ctx) {
		  if (document.getElementById("dsh-web-machine-chrome") === null) {
		    const style = document.createElement("style");
		    style.id = "dsh-web-machine-chrome";
		    style.textContent = STYLE;
		    document.head.append(style);
		  }
		  let open = false;
		  const listeners = /* @__PURE__ */ new Set();
		  const setOpen = (next) => {
		    open = next;
		    for (const listener of listeners) listener();
		  };
		  const useOpen = () => {
		    const [, force] = (0, import_react.useState)(0);
		    (0, import_react.useEffect)(() => {
		      const listener = () => {
		        force((count) => count + 1);
		      };
		      listeners.add(listener);
		      return () => {
		        listeners.delete(listener);
		      };
		    }, []);
		    return open;
		  };
		  const slots = ctx.get("slots");
		  if (slots === void 0) return;
		  slots.inject("shell.overlay", () => slots.register(
		    { name: "shell.overlay", id: "web-machine" },
		    function Overlay() {
		      const isOpen = useOpen();
		      const close = (0, import_react.useCallback)(() => {
		        setOpen(false);
		      }, []);
		      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { "data-dsh-web-machine-slot": "", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MachinePanel, { open: isOpen, onClose: close }) });
		    }
		  ));
		  slots.inject("sidebar.footer.action", () => slots.register(
		    { name: "sidebar.footer.action", id: "web-machine" },
		    function Action({ wide }) {
		      const isOpen = useOpen();
		      const toggle = (0, import_react.useCallback)(() => {
		        setOpen(!open);
		      }, []);
		      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MachineAction, { open: isOpen, onToggle: toggle, wide });
		    }
		  ));
		  navGlyph("machine", (className) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MachineIcon, { className }));
		  slots.inject("settings.section", () => slots.register(
		    { name: "settings.section", id: "machine", order: 12, label: () => "Machine" },
		    MachineSettings
		  ));
		  const onKey = (event) => {
		    if (event.ctrlKey && event.key === "`") {
		      setOpen(!open);
		      event.preventDefault();
		    }
		  };
		  window.addEventListener("keydown", onKey);
		  globalThis.__DSH_MACHINE_PANEL__ = {
		    open: () => {
		      setOpen(true);
		    },
		    close: () => {
		      setOpen(false);
		    },
		    isOpen: () => open
		  };
		  ctx.on("dispose", () => {
		    window.removeEventListener("keydown", onKey);
		  });
		}
		var client_default = { apply, inject };

		return module.exports;
	}
});

"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/chat-widget/src/index.ts
var index_exports = {};
__export(index_exports, {
  ChatWidget: () => ChatWidget
});
module.exports = __toCommonJS(index_exports);

// packages/chat-widget/src/ChatWidget.tsx
var import_react = require("react");
var import_lucide_react = require("lucide-react");
var import_react_markdown = __toESM(require("react-markdown"));
var import_remark_gfm = __toESM(require("remark-gfm"));
var import_jsx_runtime = require("react/jsx-runtime");
function ChatWidget({
  apiPath,
  title = "AI Assistant",
  subtitle = "Ask anything",
  placeholder = "Type your message...",
  initialMessage = "Hi! How can I help you today?",
  width = 380,
  height = 640,
  theme = "light",
  position = "bottom-right",
  zIndex = 50,
  className = ""
}) {
  const storageKey = (0, import_react.useMemo)(() => `chat-session-id:${apiPath}`, [apiPath]);
  const [sessionId, setSessionId] = (0, import_react.useState)("");
  const [isOpen, setIsOpen] = (0, import_react.useState)(false);
  const [input, setInput] = (0, import_react.useState)("");
  const [isLoading, setIsLoading] = (0, import_react.useState)(false);
  const [messages, setMessages] = (0, import_react.useState)([
    {
      id: "welcome",
      role: "assistant",
      content: initialMessage
    }
  ]);
  const abortRef = (0, import_react.useRef)(null);
  const bottomRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const existing = localStorage.getItem(storageKey);
    if (existing) {
      setSessionId(existing);
    } else {
      const newId = crypto.randomUUID();
      localStorage.setItem(storageKey, newId);
      setSessionId(newId);
    }
  }, [storageKey]);
  (0, import_react.useEffect)(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);
  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || isLoading || !sessionId) return;
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt
    };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "" }
    ]);
    setInput("");
    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const separator = apiPath.includes("?") ? "&" : "?";
      const response = await fetch(
        `${apiPath}${separator}prompt=${encodeURIComponent(prompt)}&sessionId=${encodeURIComponent(sessionId)}`,
        {
          method: "GET",
          signal: controller.signal,
          headers: { Accept: "text/plain" }
        }
      );
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages(
          (prev) => prev.map(
            (m) => m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  const positionClasses = position === "bottom-left" ? "left-6 bottom-6" : "right-6 bottom-6";
  const panelPosition = position === "bottom-left" ? "left-6 bottom-24" : "right-6 bottom-24";
  const isDark = theme === "dark";
  const themeClasses = isDark ? {
    panel: "bg-zinc-900 text-white border-zinc-700",
    header: "bg-zinc-800 border-zinc-700",
    input: "bg-zinc-800 text-white"
  } : {
    panel: "bg-white text-black border-zinc-200",
    header: "bg-zinc-50 border-zinc-200",
    input: "bg-white text-black"
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        onClick: () => setIsOpen((prev) => !prev),
        className: `fixed ${positionClasses} z-[${zIndex}] h-14 w-14 rounded-full shadow-lg border bg-white`,
        children: isOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.X, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.MessageCircle, {})
      }
    ),
    isOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: `fixed ${panelPosition} z-[${zIndex}] rounded-2xl shadow-xl flex flex-col ${themeClasses.panel} ${className}`,
        style: { width, height },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `p-3 border-b ${themeClasses.header}`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "text-sm font-semibold", children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-xs opacity-60", children: subtitle })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex-1 overflow-y-auto p-3 space-y-4", children: [
            messages.map((msg) => {
              const isUser = msg.role === "user";
              return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "div",
                {
                  className: `flex ${isUser ? "justify-end" : "justify-start"}`,
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-start gap-2 max-w-[85%]", children: [
                    !isUser && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-1", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Bot, { className: "w-4 h-4 text-gray-500" }) }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      "div",
                      {
                        className: `rounded-lg px-3 py-2 text-sm ${isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-black"}`,
                        children: msg.content ? isUser ? msg.content : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_markdown.default, { remarkPlugins: [import_remark_gfm.default], children: msg.content }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "flex items-center gap-2 text-gray-400", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Loader2, { className: "w-4 h-4 animate-spin" }),
                          "Thinking..."
                        ] })
                      }
                    ),
                    isUser && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-1", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.User, { className: "w-4 h-4 text-blue-600" }) })
                  ] })
                },
                msg.id
              );
            }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: bottomRef })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "p-3 border-t flex gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                className: `flex-1 border rounded px-2 ${themeClasses.input}`,
                value: input,
                onChange: (e) => setInput(e.target.value),
                placeholder
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: sendMessage, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.SendHorizonal, {}) })
          ] })
        ]
      }
    )
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChatWidget
});
//# sourceMappingURL=index.js.map
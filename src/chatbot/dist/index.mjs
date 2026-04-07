// packages/chat-widget/src/ChatWidget.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Loader2,
  MessageCircle,
  SendHorizonal,
  User,
  X
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
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
  const storageKey = useMemo(() => `chat-session-id:${apiPath}`, [apiPath]);
  const [sessionId, setSessionId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: initialMessage
    }
  ]);
  const abortRef = useRef(null);
  const bottomRef = useRef(null);
  useEffect(() => {
    const existing = localStorage.getItem(storageKey);
    if (existing) {
      setSessionId(existing);
    } else {
      const newId = crypto.randomUUID();
      localStorage.setItem(storageKey, newId);
      setSessionId(newId);
    }
  }, [storageKey]);
  useEffect(() => {
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
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setIsOpen((prev) => !prev),
        className: `fixed ${positionClasses} z-[${zIndex}] h-14 w-14 rounded-full shadow-lg border bg-white`,
        children: isOpen ? /* @__PURE__ */ jsx(X, {}) : /* @__PURE__ */ jsx(MessageCircle, {})
      }
    ),
    isOpen && /* @__PURE__ */ jsxs(
      "div",
      {
        className: `fixed ${panelPosition} z-[${zIndex}] rounded-2xl shadow-xl flex flex-col ${themeClasses.panel} ${className}`,
        style: { width, height },
        children: [
          /* @__PURE__ */ jsxs("div", { className: `p-3 border-b ${themeClasses.header}`, children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold", children: title }),
            /* @__PURE__ */ jsx("p", { className: "text-xs opacity-60", children: subtitle })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-3 space-y-4", children: [
            messages.map((msg) => {
              const isUser = msg.role === "user";
              return /* @__PURE__ */ jsx(
                "div",
                {
                  className: `flex ${isUser ? "justify-end" : "justify-start"}`,
                  children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 max-w-[85%]", children: [
                    !isUser && /* @__PURE__ */ jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsx(Bot, { className: "w-4 h-4 text-gray-500" }) }),
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: `rounded-lg px-3 py-2 text-sm ${isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-black"}`,
                        children: msg.content ? isUser ? msg.content : /* @__PURE__ */ jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: msg.content }) : /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-gray-400", children: [
                          /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
                          "Thinking..."
                        ] })
                      }
                    ),
                    isUser && /* @__PURE__ */ jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-blue-600" }) })
                  ] })
                },
                msg.id
              );
            }),
            /* @__PURE__ */ jsx("div", { ref: bottomRef })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 border-t flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                className: `flex-1 border rounded px-2 ${themeClasses.input}`,
                value: input,
                onChange: (e) => setInput(e.target.value),
                placeholder
              }
            ),
            /* @__PURE__ */ jsx("button", { onClick: sendMessage, children: /* @__PURE__ */ jsx(SendHorizonal, {}) })
          ] })
        ]
      }
    )
  ] });
}
export {
  ChatWidget
};
//# sourceMappingURL=index.mjs.map
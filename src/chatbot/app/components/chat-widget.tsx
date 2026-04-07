'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  X,
  SendHorizonal,
  Bot,
  User,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ChatWidgetProps = {
  apiPath: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  initialMessage?: string;
};

export default function ChatWidget({
  apiPath,
  title = 'AI Assistant',
  subtitle = 'Ask anything',
  placeholder = 'Type your message...',
  initialMessage = 'Hi! How can I help you today?',
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-message',
      role: 'assistant',
      content: initialMessage,
    },
  ]);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);

    const storageKey = `chat-session-id:${apiPath}`;
    const existing = localStorage.getItem(storageKey);

    if (existing) {
      setSessionId(existing);
      return;
    }

    const newId = crypto.randomUUID();
    localStorage.setItem(storageKey, newId);
    setSessionId(newId);
  }, [apiPath]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || isLoading || !sessionId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
    };

    const assistantId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const separator = apiPath.includes('?') ? '&' : '?';
      const response = await fetch(
        `${apiPath}${separator}prompt=${encodeURIComponent(prompt)}&sessionId=${encodeURIComponent(sessionId)}`,
        {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'text/plain',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Streaming response body is missing.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;

        if (result.value) {
          const chunk = decoder.decode(result.value, { stream: true });

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: msg.content + chunk }
                : msg,
            ),
          );
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred.';

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  msg.content ||
                  `Sorry, I couldn’t complete the request. ${errorMessage}`,
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const resetChat = () => {
    abortRef.current?.abort();
    setIsLoading(false);

    const storageKey = `chat-session-id:${apiPath}`;
    const newId = crypto.randomUUID();
    localStorage.setItem(storageKey, newId);
    setSessionId(newId);

    setMessages([
      {
        id: 'welcome-message',
        role: 'assistant',
        content: initialMessage,
      },
    ]);

    setInput('');
  };

  return (
    <>
      {/* Floating Bubble */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-lg transition hover:scale-105 hover:shadow-xl"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-zinc-700" />
        ) : (
          <MessageCircle className="h-6 w-6 text-zinc-700" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[70vh] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-zinc-900">
                {title}
              </h2>
              <p className="truncate text-xs text-zinc-500">
                {subtitle} ·{' '}
                {mounted && sessionId ? sessionId.slice(0, 8) : '--------'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetChat}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 transition hover:bg-zinc-100"
              >
                New
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-zinc-50 px-3 py-4">
            <div className="flex flex-col gap-4">
              {messages.map((message) => {
                const isUser = message.role === 'user';

                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex max-w-[88%] gap-2 ${
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                          isUser
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-zinc-200 bg-white'
                        }`}
                      >
                        {isUser ? (
                          <User className="h-4 w-4 text-blue-700" />
                        ) : (
                          <Bot className="h-4 w-4 text-zinc-700" />
                        )}
                      </div>

                      <div
                        className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          isUser
                            ? 'bg-blue-600 text-white'
                            : 'border border-zinc-200 bg-white text-zinc-900'
                        }`}
                      >
                        {message.content ? (
                          isUser ? (
                            <p className="whitespace-pre-wrap break-words leading-6">
                              {message.content}
                            </p>
                          ) : (
                            <div className="prose prose-sm max-w-none break-words prose-zinc leading-6">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-2 text-zinc-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Thinking...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-zinc-200 bg-white p-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                rows={2}
                className="w-full resize-none border-0 bg-transparent px-2 py-1 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
              />

              <div className="mt-2 flex items-center justify-between px-1">
                <p className="text-[11px] text-zinc-400">
                  Enter to send · Shift + Enter for new line
                </p>

                <div className="flex items-center gap-2">
                  {isLoading && (
                    <button
                      type="button"
                      onClick={stopStreaming}
                      className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-100"
                    >
                      Stop
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading || !sessionId}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <SendHorizonal className="h-4 w-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

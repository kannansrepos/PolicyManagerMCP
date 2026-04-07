'use client';

import { useEffect, useRef, useState } from 'react';
import { SendHorizonal, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const API_URL = 'http://localhost:5015/api/KernelChat/stream';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-message',
      role: 'assistant',
      content: 'Hi! Ask me about products, search, or product details.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);

    const existing = localStorage.getItem('chat-session-id');
    if (existing) {
      setSessionId(existing);
      return;
    }

    const newId = crypto.randomUUID();
    localStorage.setItem('chat-session-id', newId);
    setSessionId(newId);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
      const response = await fetch(
        `${API_URL}?prompt=${encodeURIComponent(prompt)}&sessionId=${encodeURIComponent(sessionId)}`,
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
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred.';

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  msg.content ||
                  `Sorry, I couldn’t complete the request. ${message}`,
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    setIsLoading(false);

    const newId = crypto.randomUUID();
    localStorage.setItem('chat-session-id', newId);
    setSessionId(newId);

    setMessages([
      {
        id: 'welcome-message',
        role: 'assistant',
        content: 'Hi! Ask me about products, search, or product details.',
      },
    ]);

    setInput('');
  };

  return (
    <div className="flex h-[100dvh] bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <header className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">AI Product Chat</h1>
              <p className="text-sm text-zinc-400">
                Session:{' '}
                {mounted && sessionId ? sessionId.slice(0, 8) : '--------'}
              </p>
            </div>

            <button
              onClick={handleNewChat}
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
            >
              New Chat
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {messages.map((message) => {
              const isUser = message.role === 'user';

              return (
                <div
                  key={message.id}
                  className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex max-w-[85%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
                      {isUser ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>

                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isUser
                          ? 'bg-zinc-100 text-zinc-900'
                          : 'border border-zinc-800 bg-zinc-900 text-zinc-100'
                      }`}
                    >
                      {message.content ? (
                        <div className="prose prose-invert max-w-none break-words text-sm leading-7 prose-p:my-1 prose-headings:my-2">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
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
        </main>

        <div className="border-t border-zinc-800 px-4 py-4 sm:px-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something like: give me product id 1"
              rows={3}
              className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
            />

            <div className="flex justify-end">
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading || !sessionId}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
              >
                <SendHorizonal className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

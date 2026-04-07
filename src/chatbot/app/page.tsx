import ChatWidget from '@/components/chat-widget';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-bold text-zinc-900">My Application</h1>
        <p className="mt-4 text-zinc-600">
          This page has a floating AI chat widget.
        </p>
      </div>

      <ChatWidget
        apiPath="http://localhost:5015/api/KernelChat/stream"
        title="Product Assistant"
        subtitle="Streaming AI chat"
        placeholder="Ask about products..."
        initialMessage="Hi! Ask me about products, details, or search."
      />
    </main>
  );
}

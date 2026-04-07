# @your-scope/chat-widget

A reusable AI chat widget for Next.js applications with streaming API support.

## Features

- 🚀 Streaming responses support
- 🎨 Light/Dark theme support
- 📱 Responsive design
- 💬 Markdown rendering with GFM support
- 🔒 Session persistence with localStorage
- 🎯 Configurable position, size, and styling

## Installation

```bash
npm install @your-scope/chat-widget
# or
yarn add @your-scope/chat-widget
# or
pnpm add @your-scope/chat-widget
```

## Usage

### Basic Usage

```tsx
import { ChatWidget } from '@your-scope/chat-widget';

function App() {
  return <ChatWidget apiPath="/api/chat" />;
}
```

### With Custom Options

```tsx
import { ChatWidget } from '@your-scope/chat-widget';

function App() {
  return (
    <ChatWidget
      apiPath="/api/chat"
      title="AI Assistant"
      subtitle="Ask me anything"
      placeholder="Type your message..."
      initialMessage="Hello! How can I help you today?"
      width={400}
      height={600}
      theme="dark"
      position="bottom-left"
      zIndex={100}
    />
  );
}
```

## Props

| Prop             | Type                              | Default                           | Description                        |
| ---------------- | --------------------------------- | --------------------------------- | ---------------------------------- |
| `apiPath`        | `string`                          | required                          | The API endpoint for chat requests |
| `title`          | `string`                          | `"AI Assistant"`                  | Widget header title                |
| `subtitle`       | `string`                          | `"Ask anything"`                  | Widget header subtitle             |
| `placeholder`    | `string`                          | `"Type your message..."`          | Input placeholder text             |
| `initialMessage` | `string`                          | `"Hi! How can I help you today?"` | First message from assistant       |
| `width`          | `number`                          | `380`                             | Widget panel width in pixels       |
| `height`         | `number`                          | `640`                             | Widget panel height in pixels      |
| `theme`          | `"light" \| "dark"`               | `"light"`                         | Color theme                        |
| `position`       | `"bottom-right" \| "bottom-left"` | `"bottom-right"`                  | Widget position                    |
| `zIndex`         | `number`                          | `50`                              | CSS z-index for layering           |
| `className`      | `string`                          | `""`                              | Additional CSS class               |

## API Requirements

The widget expects a GET endpoint that supports streaming responses:

```
GET /api/chat?prompt={message}&sessionId={uuid}
```

The endpoint should return a streaming text response (`Content-Type: text/plain`).

## Peer Dependencies

- React 18 or 19
- React DOM 18 or 19
- Next.js 14 or 15

## License

MIT

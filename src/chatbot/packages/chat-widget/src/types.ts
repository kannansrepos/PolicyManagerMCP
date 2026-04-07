type ChatWidgetProps = {
  apiPath: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  initialMessage?: string;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left';
  zIndex?: number;
  className?: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type { Message, ChatWidgetProps };

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Bot, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How can I improve my profile?",
  "Prepare me for a product manager interview",
  "Help me negotiate a salary offer",
  "Build me a 2-year career roadmap",
  "Review my resume approach",
  "How do I network without feeling awkward?",
];

export function CoachClient({ userName }: { userName: string | null }) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-20) }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({ error: "Request failed" }));
        toast.error(body.error ?? "Something went wrong");
        setMessages(nextMessages);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages([...nextMessages, { role: "assistant", content: assistantText }]);
      }
    } catch {
      toast.error("Network error — please try again");
      setMessages(nextMessages);
    } finally {
      setStreaming(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="glass-strong flex h-[calc(100vh-240px)] min-h-[480px] flex-col overflow-hidden rounded-3xl">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-5 scrollbar-thin sm:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg">
              <Bot className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">
              {userName ? `Hey ${userName.split(" ")[0]}` : "Hey there"}, I&apos;m your career coach
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Ask me anything about your career — or start with one of these:
            </p>
            <div className="mt-5 flex max-w-lg flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="glass rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                  <Bot className="h-4 w-4" />
                </span>
              )}
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.content ||
                  (streaming && i === messages.length - 1 ? (
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:240ms]" />
                    </span>
                  ) : null)}
              </div>
              {message.role === "user" && (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <User className="h-4 w-4" />
                </span>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <Textarea
            rows={1}
            placeholder="Ask your career coach…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="max-h-32 min-h-[44px] resize-none"
            aria-label="Message"
          />
          <Button
            variant="gradient"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => void send()}
            disabled={streaming || !input.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          AI advice can be wrong — verify important career decisions.
        </p>
      </div>
    </div>
  );
}

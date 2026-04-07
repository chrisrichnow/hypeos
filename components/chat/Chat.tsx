"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey Chris. What do you need?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "var(--bg-chat)",
        borderLeft: "1px solid var(--border)",
        width: "320px",
        minWidth: "320px",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
      >
        AI Assistant
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className="text-xs px-3 py-2 rounded-lg max-w-[90%] leading-relaxed"
              style={{
                background: msg.role === "user" ? "var(--accent)" : "rgba(255,255,255,0.06)",
                color: "var(--text-primary)",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start">
            <div
              className="text-xs px-3 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}
            >
              ...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="p-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="flex items-end gap-2 rounded-md px-3 py-2"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <textarea
            className="flex-1 resize-none outline-none text-sm leading-relaxed bg-transparent"
            style={{ color: "var(--text-primary)", maxHeight: "120px" }}
            placeholder="Ask anything..."
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="text-xs px-2 py-1 rounded"
            style={{
              background: input.trim() ? "var(--accent)" : "transparent",
              color: input.trim() ? "white" : "var(--text-muted)",
              transition: "all 0.15s",
            }}
          >
            ↑
          </button>
        </div>
        <div className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

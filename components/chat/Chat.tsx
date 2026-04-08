"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const GREETING: Message = { role: "assistant", content: "Hey. What do you need?" };

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const convIdRef = useRef<string | null>(null);
  const supabase = createClient();

  // Load conversation from DB on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }

      const { data } = await supabase
        .from("conversations")
        .select("id, messages")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        convIdRef.current = data.id;
        const saved = data.messages as Message[];
        setMessages(saved?.length > 0 ? saved : [GREETING]);
      } else {
        setMessages([GREETING]);
      }
      setLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function persist(msgs: Message[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (convIdRef.current) {
      await supabase
        .from("conversations")
        .update({ messages: msgs, updated_at: new Date().toISOString() })
        .eq("id", convIdRef.current);
    } else {
      const { data } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, messages: msgs })
        .select("id")
        .single();
      if (data) convIdRef.current = data.id;
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const withPlaceholder: Message[] = [...newMessages, { role: "assistant", content: "" }];
    setMessages(withPlaceholder);

    let finalMessages = withPlaceholder;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const updated: Message[] = [...newMessages, { role: "assistant", content: accumulated }];
        setMessages(updated);
        finalMessages = updated;
      }
    } catch {
      const errMessages: Message[] = [
        ...newMessages,
        { role: "assistant", content: "Something went wrong. Try again." },
      ];
      setMessages(errMessages);
      finalMessages = errMessages;
    } finally {
      setLoading(false);
      persist(finalMessages);
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
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          AI Assistant
        </span>
        {messages.length > 1 && (
          <button
            onClick={() => {
              const reset = [GREETING];
              setMessages(reset);
              persist(reset);
            }}
            className="text-[10px] hover:opacity-100 transition-opacity"
            style={{ color: "var(--text-muted)", opacity: 0.5 }}
            title="Clear chat"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {!loaded ? (
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Loading...</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className="text-xs px-3 py-2 rounded-lg max-w-[90%] leading-relaxed whitespace-pre-wrap"
                style={{
                  background: msg.role === "user" ? "var(--accent)" : "rgba(255,255,255,0.06)",
                  color: "var(--text-primary)",
                }}
              >
                {msg.content}
                {loading && i === messages.length - 1 && msg.role === "assistant" && (
                  <span className="animate-pulse">▍</span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
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

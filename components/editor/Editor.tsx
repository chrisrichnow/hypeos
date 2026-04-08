"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Editor({ path }: { path: string | null }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!path) {
      setContent("");
      return;
    }

    setLoading(true);
    setSaveStatus("saved");

    supabase
      .from("files")
      .select("content")
      .eq("path", path)
      .single()
      .then(({ data }) => {
        setContent(data?.content ?? "");
        setLoading(false);
      });
  }, [path]);

  async function save(value: string) {
    if (!path) return;
    setSaveStatus("saving");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("files")
      .update({ content: value, updated_at: new Date().toISOString() })
      .eq("path", path)
      .eq("user_id", user.id);
    setSaveStatus("saved");
  }

  function handleChange(value: string) {
    setContent(value);
    setSaveStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(value), 1000);
  }

  if (!path) {
    return (
      <div
        className="flex-1 flex items-center justify-center h-full"
        style={{ background: "var(--bg-base)", color: "var(--text-muted)" }}
      >
        <div className="text-center">
          <div className="text-4xl mb-3" style={{ opacity: 0.3 }}>⌘</div>
          <div className="text-sm">Select a file to view or edit</div>
        </div>
      </div>
    );
  }

  const fileName = path.split("/").pop() ?? path;

  return (
    <div
      className="flex-1 flex flex-col h-full"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center justify-between text-sm"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-titlebar)" }}
      >
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{
            borderRight: "1px solid var(--border)",
            color: "var(--text-active)",
          }}
        >
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>⌐</span>
          {fileName}
        </div>
        <div className="px-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "unsaved" && "Unsaved"}
          {saveStatus === "saved" && "Saved"}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</div>
        ) : (
          <textarea
            className="w-full h-full resize-none outline-none text-sm leading-relaxed font-mono"
            style={{
              background: "transparent",
              color: "var(--text-primary)",
              caretColor: "var(--accent)",
            }}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`# ${fileName}\n\nStart writing...`}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}

"use client";

export default function Editor({ file }: { file: string | null }) {
  if (!file) {
    return (
      <div
        className="flex-1 flex items-center justify-center h-full"
        style={{ background: "var(--bg-editor)", color: "var(--text-muted)" }}
      >
        <div className="text-center">
          <div className="text-4xl mb-3">⌘</div>
          <div className="text-sm">Select a file to view or edit</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col h-full"
      style={{ background: "var(--bg-editor)" }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center text-sm"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-titlebar)" }}
      >
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{
            borderRight: "1px solid var(--border)",
            color: "var(--text-active)",
            borderBottom: "1px solid var(--bg-editor)",
          }}
        >
          <span className="text-xs">📄</span>
          {file}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-6">
        <textarea
          className="w-full h-full resize-none outline-none text-sm leading-relaxed font-mono"
          style={{
            background: "transparent",
            color: "var(--text-primary)",
            caretColor: "var(--accent)",
          }}
          placeholder={`# ${file}\n\nStart writing...`}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

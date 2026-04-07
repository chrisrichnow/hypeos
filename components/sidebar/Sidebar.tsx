"use client";

import { useState } from "react";

type FileNode = {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
};

const fileTree: FileNode[] = [
  {
    name: "context",
    type: "folder",
    children: [
      { name: "me.md", type: "file" },
      { name: "goals.md", type: "file" },
      { name: "current-priorities.md", type: "file" },
    ],
  },
  {
    name: "projects",
    type: "folder",
    children: [
      { name: "internship-search.md", type: "file" },
      { name: "hypeos.md", type: "file" },
    ],
  },
  {
    name: "memory",
    type: "folder",
    children: [
      { name: "MEMORY.md", type: "file" },
    ],
  },
];

function FileItem({
  node,
  depth,
  onSelect,
  selected,
}: {
  node: FileNode;
  depth: number;
  onSelect: (name: string) => void;
  selected: string | null;
}) {
  const [open, setOpen] = useState(true);

  if (node.type === "folder") {
    return (
      <div>
        <div
          className="flex items-center gap-1 px-2 py-0.5 cursor-pointer hover:bg-white/5 text-sm select-none"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setOpen(!open)}
        >
          <span className="text-[10px] text-[var(--text-muted)]">{open ? "▾" : "▸"}</span>
          <span className="text-[var(--text-muted)] uppercase text-[11px] font-semibold tracking-wide">
            {node.name}
          </span>
        </div>
        {open &&
          node.children?.map((child) => (
            <FileItem
              key={child.name}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selected={selected}
            />
          ))}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-2 py-0.5 cursor-pointer text-sm select-none"
      style={{
        paddingLeft: `${depth * 12 + 8}px`,
        background: selected === node.name ? "var(--accent)" : "transparent",
        color: selected === node.name ? "var(--text-active)" : "var(--text-primary)",
      }}
      onClick={() => onSelect(node.name)}
      onMouseEnter={(e) => {
        if (selected !== node.name)
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={(e) => {
        if (selected !== node.name)
          (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <span className="text-[var(--text-muted)] text-xs">📄</span>
      {node.name}
    </div>
  );
}

export default function Sidebar({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        width: "220px",
        minWidth: "220px",
      }}
    >
      <div
        className="px-3 py-2 text-[11px] uppercase font-semibold tracking-widest"
        style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
      >
        HypeOS
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {fileTree.map((node) => (
          <FileItem
            key={node.name}
            node={node}
            depth={0}
            onSelect={onSelect}
            selected={selected}
          />
        ))}
      </div>
    </div>
  );
}

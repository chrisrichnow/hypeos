"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type DBFile = { id: string; path: string; name: string };

type FolderNode = { type: "folder"; name: string; children: TreeNode[] };
type FileLeaf = { type: "file"; name: string; path: string };
type TreeNode = FolderNode | FileLeaf;

function buildTree(files: DBFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      let folder = current.find(
        (n): n is FolderNode => n.type === "folder" && n.name === folderName
      );
      if (!folder) {
        folder = { type: "folder", name: folderName, children: [] };
        current.push(folder);
      }
      current = folder.children;
    }

    current.push({ type: "file", name: file.name, path: file.path });
  }

  return root;
}

function FileItem({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selected: string | null;
  onSelect: (path: string) => void;
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
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {open ? "▾" : "▸"}
          </span>
          <span
            className="uppercase text-[11px] font-semibold tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            {node.name}
          </span>
        </div>
        {open &&
          node.children.map((child) => (
            <FileItem
              key={child.type === "file" ? child.path : child.name}
              node={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
      </div>
    );
  }

  const isSelected = selected === node.path;

  return (
    <div
      className="flex items-center gap-2 px-2 py-0.5 cursor-pointer text-sm select-none"
      style={{
        paddingLeft: `${depth * 12 + 8}px`,
        background: isSelected ? "var(--accent)" : "transparent",
        color: isSelected ? "white" : "var(--text-primary)",
      }}
      onClick={() => onSelect(node.path)}
      onMouseEnter={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <span className="text-xs" style={{ color: isSelected ? "white" : "var(--text-muted)" }}>
        ⌐
      </span>
      {node.name}
    </div>
  );
}

export default function Sidebar({
  selected,
  onSelect,
  onFilesChange,
}: {
  selected: string | null;
  onSelect: (path: string) => void;
  onFilesChange?: () => void;
}) {
  const [files, setFiles] = useState<DBFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPath, setNewPath] = useState("");
  const [creating, setCreating] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const supabase = createClient();

  async function loadFiles() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("files")
      .select("id, path, name")
      .eq("user_id", user.id)
      .order("path");

    setFiles(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadFiles(); }, []);

  async function createFile(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newPath.trim();
    if (!trimmed) return;

    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const parts = trimmed.split("/");
    const name = parts[parts.length - 1];

    await supabase.from("files").upsert(
      { user_id: user.id, path: trimmed, name, content: "" },
      { onConflict: "user_id,path" }
    );

    setNewPath("");
    setShowInput(false);
    setCreating(false);
    await loadFiles();
    onSelect(trimmed);
    onFilesChange?.();
  }

  const tree = buildTree(files);

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
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="text-[11px] uppercase font-semibold tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          HypeOS
        </span>
        <button
          onClick={() => setShowInput(!showInput)}
          className="text-xs hover:opacity-100 transition-opacity"
          style={{ color: "var(--text-muted)", opacity: 0.6 }}
          title="New file"
        >
          +
        </button>
      </div>

      {/* New file input */}
      {showInput && (
        <form
          onSubmit={createFile}
          className="px-2 py-1.5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <input
            autoFocus
            type="text"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setShowInput(false)}
            placeholder="folder/file.md"
            className="w-full px-2 py-1 rounded text-xs outline-none"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--accent)",
              color: "var(--text-primary)",
            }}
            disabled={creating}
          />
        </form>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
            Loading...
          </div>
        ) : tree.length === 0 ? (
          <div className="px-3 py-4 text-xs text-center" style={{ color: "var(--text-muted)" }}>
            No files yet.
            <br />
            <button
              onClick={() => setShowInput(true)}
              className="mt-1 underline"
              style={{ color: "var(--accent)" }}
            >
              Create one
            </button>
          </div>
        ) : (
          tree.map((node) => (
            <FileItem
              key={node.type === "file" ? node.path : node.name}
              node={node}
              depth={0}
              selected={selected}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

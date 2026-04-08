"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import Editor from "@/components/editor/Editor";
import Chat from "@/components/chat/Chat";

export default function Home() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar selected={selectedPath} onSelect={setSelectedPath} />
      <Editor path={selectedPath} />
      <Chat />
    </div>
  );
}

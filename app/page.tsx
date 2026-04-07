"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import Editor from "@/components/editor/Editor";
import Chat from "@/components/chat/Chat";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar selected={selectedFile} onSelect={setSelectedFile} />
      <Editor file={selectedFile} />
      <Chat />
    </div>
  );
}

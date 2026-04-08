import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

const saveMemoryTool: Anthropic.Tool = {
  name: "save_memory",
  description: "Save a persistent memory about the user for future conversations.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "Short title for this memory (e.g. 'Prefers dark mode')",
      },
      type: {
        type: "string",
        enum: ["user", "feedback", "project", "reference"],
        description:
          "user = facts about who they are, feedback = preferences or corrections, project = ongoing work, reference = external resources",
      },
      body: {
        type: "string",
        description: "The memory content — 1-3 sentences max",
      },
    },
    required: ["name", "type", "body"],
  },
};

export async function POST(req: Request) {
  const { messages } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Only analyze the last user + assistant exchange
  const lastExchange = messages.slice(-2);
  if (lastExchange.length < 2) return new Response("ok");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system:
      "You are a memory extraction system. Given a single conversation exchange, decide if it reveals anything worth remembering about the user long-term — their goals, preferences, ongoing projects, or corrections. Only save genuinely persistent, useful facts. Skip small talk and one-off questions. If nothing is worth saving, do not call the tool.",
    messages: [
      {
        role: "user",
        content:
          "Here is the exchange:\n\n" +
          lastExchange
            .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
            .join("\n\n") +
          "\n\nShould anything be saved to memory?",
      },
    ],
    tools: [saveMemoryTool],
    tool_choice: { type: "auto" },
  });

  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === "save_memory") {
      const input = block.input as { name: string; type: string; body: string };
      await supabase.from("memories").insert({
        user_id: user.id,
        name: input.name,
        type: input.type,
        body: input.body,
      });
    }
  }

  return new Response("ok");
}

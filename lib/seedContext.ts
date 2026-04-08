import { SupabaseClient } from "@supabase/supabase-js";

function getQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function meFile(name: string, occupation: string, school: string, employer: string): string {
  const lines = [
    `# About ${name}`,
    "",
    `**Name:** ${name}`,
    occupation ? `**Role:** ${occupation.charAt(0).toUpperCase() + occupation.slice(1)}` : "",
    school ? `**School:** ${school}` : "",
    employer ? `**Employer:** ${employer}` : "",
    "",
    "## What I Do",
    "_Fill this in — one paragraph about what you do day to day._",
    "",
    "## Top Priority",
    "_What's the #1 thing everything else should support right now?_",
    "",
    "## Current Load",
    "- _Add your active responsibilities here_",
    "",
    "## Known Challenges",
    "- _What gets in your way? What habits do you want to change?_",
  ].filter((l) => l !== "");
  return lines.join("\n");
}

function goalsFile(occupation: string, useCases: string[], quarter: string): string {
  const sections: string[] = [
    "# Goals & Milestones",
    "",
    `*Update this file at the start of each quarter.*`,
    "",
    `## ${quarter} (Current)`,
    "",
  ];

  if (useCases.includes("school") || occupation === "student") {
    sections.push("**1. Academic**");
    sections.push("- _Add your academic goals for this semester_");
    sections.push("");
  }
  if (useCases.includes("work") || occupation === "professional") {
    sections.push("**2. Career / Work**");
    sections.push("- _Add your professional goals_");
    sections.push("");
  }
  if (useCases.includes("business") || occupation === "entrepreneur") {
    sections.push("**3. Business**");
    sections.push("- _Add your business milestones (e.g. revenue targets, first client)_");
    sections.push("");
  }
  if (useCases.includes("personal")) {
    sections.push("**4. Personal**");
    sections.push("- _Add your personal goals_");
    sections.push("");
  }

  if (sections.length <= 6) {
    sections.push("**1. _Add your top goal_**");
    sections.push("- _Break it into milestones here_");
    sections.push("");
  }

  return sections.join("\n");
}

function prioritiesFile(useCases: string[], date: string): string {
  const lines = [
    "# Current Priorities",
    "",
    `*Last updated: ${date}*`,
    "",
    "_List your priorities in order of urgency. Update this whenever your focus shifts._",
    "",
  ];

  let i = 1;
  if (useCases.includes("school")) {
    lines.push(`${i++}. **School** — _Add your most pressing academic deadline or task_`);
  }
  if (useCases.includes("work")) {
    lines.push(`${i++}. **Work** — _Add your top work priority_`);
  }
  if (useCases.includes("business")) {
    lines.push(`${i++}. **Business** — _Add your #1 business goal right now_`);
  }
  if (useCases.includes("personal")) {
    lines.push(`${i++}. **Personal** — _Add a personal priority_`);
  }
  if (i === 1) {
    lines.push("1. _Add your top priority here_");
    lines.push("2. _Add another priority_");
  }

  lines.push("");
  lines.push("---");
  lines.push("*Update this file whenever your focus shifts.*");

  return lines.join("\n");
}

function workFile(employer: string, occupation: string): string {
  const isEntrepreneur = occupation === "entrepreneur";
  return [
    isEntrepreneur ? "# My Business" : "# Work",
    "",
    employer ? `**Company:** ${employer}` : "**Company:** _Fill this in_",
    "",
    isEntrepreneur
      ? "## What We Do\n_Describe your business — what you sell, who you serve._"
      : "## My Role\n_Describe your role and responsibilities._",
    "",
    "## Current Focus",
    "- _What are you working on at work/in the business right now?_",
    "",
    "## Tools & Stack",
    "- _List the tools you use day to day_",
  ].join("\n");
}

export async function seedContextFiles(
  supabase: SupabaseClient,
  userId: string,
  {
    name,
    occupation,
    school,
    employer,
    useCases,
  }: {
    name: string;
    occupation: string;
    school: string;
    employer: string;
    useCases: string[];
  }
) {
  const quarter = getQuarter();
  const date = today();

  const files: { path: string; name: string; content: string }[] = [
    { path: "context/me.md", name: "me.md", content: meFile(name, occupation, school, employer) },
    { path: "context/goals.md", name: "goals.md", content: goalsFile(occupation, useCases, quarter) },
    { path: "context/current-priorities.md", name: "current-priorities.md", content: prioritiesFile(useCases, date) },
  ];

  const needsWork =
    employer ||
    occupation === "professional" ||
    occupation === "entrepreneur" ||
    useCases.includes("work") ||
    useCases.includes("business");

  if (needsWork) {
    files.push({ path: "context/work.md", name: "work.md", content: workFile(employer, occupation) });
  }

  for (const file of files) {
    await supabase
      .from("files")
      .upsert({ user_id: userId, ...file }, { onConflict: "user_id,path" });
  }
}

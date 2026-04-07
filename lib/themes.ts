export type Theme = {
  accent: string;
  accentHover: string;
  bgBase: string;
  bgSidebar: string;
  bgChat: string;
  bgTitlebar: string;
  border: string;
  label: string;
};

export const themes: Record<string, Theme> = {
  // Schools
  "university-of-houston": {
    label: "University of Houston",
    accent: "#CC0000",
    accentHover: "#a30000",
    bgBase: "#1a0a0a",
    bgSidebar: "#220d0d",
    bgChat: "#220d0d",
    bgTitlebar: "#2e1010",
    border: "#4a1a1a",
  },
  "ut-austin": {
    label: "UT Austin",
    accent: "#BF5700",
    accentHover: "#9e4700",
    bgBase: "#1a1008",
    bgSidebar: "#221508",
    bgChat: "#221508",
    bgTitlebar: "#2e1c0a",
    border: "#4a2e10",
  },
  "texas-am": {
    label: "Texas A&M",
    accent: "#500000",
    accentHover: "#3a0000",
    bgBase: "#120808",
    bgSidebar: "#1a0a0a",
    bgChat: "#1a0a0a",
    bgTitlebar: "#220d0d",
    border: "#3e1212",
  },

  // Companies
  "stewart-title": {
    label: "Stewart Title",
    accent: "#003087",
    accentHover: "#002266",
    bgBase: "#080e1a",
    bgSidebar: "#0a1222",
    bgChat: "#0a1222",
    bgTitlebar: "#0d172e",
    border: "#1a2e52",
  },
  "deloitte": {
    label: "Deloitte",
    accent: "#86BC25",
    accentHover: "#6a9a1c",
    bgBase: "#0f1a0a",
    bgSidebar: "#141f0d",
    bgChat: "#141f0d",
    bgTitlebar: "#192610",
    border: "#2e4a18",
  },
  "jpmorgan": {
    label: "JPMorgan Chase",
    accent: "#005EB8",
    accentHover: "#004a94",
    bgBase: "#080f1a",
    bgSidebar: "#0a1422",
    bgChat: "#0a1422",
    bgTitlebar: "#0d1a2e",
    border: "#1a2e4a",
  },

  // Defaults
  "default-student": {
    label: "Student",
    accent: "#6366f1",
    accentHover: "#4f52d4",
    bgBase: "#0f0f1a",
    bgSidebar: "#141422",
    bgChat: "#141422",
    bgTitlebar: "#1a1a2e",
    border: "#2e2e52",
  },
  "default-professional": {
    label: "Professional",
    accent: "#0078d4",
    accentHover: "#006abc",
    bgBase: "#0d0d0d",
    bgSidebar: "#141414",
    bgChat: "#141414",
    bgTitlebar: "#1e1e1e",
    border: "#2e2e2e",
  },
  "default-entrepreneur": {
    label: "Entrepreneur",
    accent: "#f59e0b",
    accentHover: "#d97706",
    bgBase: "#0f0d08",
    bgSidebar: "#16120a",
    bgChat: "#16120a",
    bgTitlebar: "#1e180e",
    border: "#3d2e10",
  },
};

export function getThemeForUser(school?: string, employer?: string, occupation?: string): string {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

  if (school) {
    const key = normalize(school);
    if (themes[key]) return key;
    // Fuzzy match common schools
    if (key.includes("houston")) return "university-of-houston";
    if (key.includes("texas-a") || key.includes("tamu") || key.includes("aggie")) return "texas-am";
    if (key.includes("ut-austin") || key.includes("longhorn")) return "ut-austin";
  }

  if (employer) {
    const key = normalize(employer);
    if (themes[key]) return key;
    if (key.includes("stewart")) return "stewart-title";
    if (key.includes("deloitte")) return "deloitte";
    if (key.includes("jpmorgan") || key.includes("chase")) return "jpmorgan";
  }

  if (occupation === "student") return "default-student";
  if (occupation === "entrepreneur") return "default-entrepreneur";
  return "default-professional";
}

export function applyTheme(themeKey: string) {
  const theme = themes[themeKey] ?? themes["default-professional"];
  const root = document.documentElement;
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-hover", theme.accentHover);
  root.style.setProperty("--bg-base", theme.bgBase);
  root.style.setProperty("--bg-sidebar", theme.bgSidebar);
  root.style.setProperty("--bg-chat", theme.bgChat);
  root.style.setProperty("--bg-titlebar", theme.bgTitlebar);
  root.style.setProperty("--border", theme.border);
}

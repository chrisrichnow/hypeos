"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getThemeForUser, applyTheme, themes } from "@/lib/themes";

type OccupationType = "student" | "professional" | "entrepreneur" | "other";

const STEPS = ["Who are you?", "Where?", "What for?", "Your HypeOS"];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [occupation, setOccupation] = useState<OccupationType | "">("");
  const [school, setSchool] = useState("");
  const [employer, setEmployer] = useState("");
  const [useCases, setUseCases] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const themeKey = getThemeForUser(school, employer, occupation || undefined);
  const theme = themes[themeKey];

  function toggleUseCase(val: string) {
    setUseCases((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  async function finish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({
      name,
      occupation,
      school: school || null,
      employer: employer || null,
      theme_preset: themeKey,
      use_cases: useCases,
      onboarding_done: true,
    }).eq("id", user.id);

    applyTheme(themeKey);
    router.push("/");
    router.refresh();
  }

  const canNext = [
    name.trim().length > 0 && occupation !== "",
    true, // school/employer optional
    useCases.length > 0,
    true,
  ][step];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{ background: i <= step ? "var(--accent)" : "var(--border)" }}
            />
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
      </div>

      <div className="w-full max-w-md">
        {/* Step 1 — Who are you? */}
        {step === 0 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-active)" }}>
                What should we call you?
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                This personalizes your workspace.
              </p>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 rounded-md text-sm outline-none"
              style={{
                background: "var(--bg-sidebar)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              placeholder="Your name"
              autoFocus
            />

            <div>
              <p className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>
                Which best describes you?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["student", "professional", "entrepreneur", "other"] as OccupationType[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setOccupation(opt)}
                    className="py-3 px-4 rounded-md text-sm font-medium text-left capitalize transition-all"
                    style={{
                      background: occupation === opt ? "var(--accent)" : "var(--bg-sidebar)",
                      border: `1px solid ${occupation === opt ? "var(--accent)" : "var(--border)"}`,
                      color: occupation === opt ? "white" : "var(--text-primary)",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Where? */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-active)" }}>
                Where do you operate?
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Used to theme your workspace. Skip anything that doesn't apply.
              </p>
            </div>

            {(occupation === "student" || occupation === "other") && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>School</label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="px-3 py-2 rounded-md text-sm outline-none"
                  style={{
                    background: "var(--bg-sidebar)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="e.g. University of Houston"
                />
              </div>
            )}

            {(occupation === "professional" || occupation === "entrepreneur" || occupation === "other") && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Employer / Company</label>
                <input
                  type="text"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  className="px-3 py-2 rounded-md text-sm outline-none"
                  style={{
                    background: "var(--bg-sidebar)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="e.g. Stewart Title"
                />
              </div>
            )}

            {occupation === "student" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Employer (optional)</label>
                <input
                  type="text"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  className="px-3 py-2 rounded-md text-sm outline-none"
                  style={{
                    background: "var(--bg-sidebar)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="e.g. Stewart Title"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3 — What for? */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-active)" }}>
                What will you use HypeOS for?
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Select all that apply. This sets up your file structure.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { val: "school", label: "School & coursework", desc: "Classes, assignments, exams, notes" },
                { val: "work", label: "Work & projects", desc: "Tasks, meetings, clients, deliverables" },
                { val: "personal", label: "Personal goals", desc: "Habits, finances, life planning" },
                { val: "business", label: "Running a business", desc: "Clients, revenue, outreach, ops" },
              ].map(({ val, label, desc }) => (
                <button
                  key={val}
                  onClick={() => toggleUseCase(val)}
                  className="py-3 px-4 rounded-md text-left transition-all"
                  style={{
                    background: useCases.includes(val) ? "rgba(var(--accent-rgb, 0, 120, 212), 0.15)" : "var(--bg-sidebar)",
                    border: `1px solid ${useCases.includes(val) ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "var(--text-active)" }}>{label}</span>
                    {useCases.includes(val) && <span style={{ color: "var(--accent)" }}>✓</span>}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4 — Preview */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-active)" }}>
                This is your HypeOS, {name}.
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Your workspace is ready. Here's what we set up for you.
              </p>
            </div>

            <div
              className="rounded-md p-4 flex flex-col gap-3"
              style={{ background: "var(--bg-sidebar)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: "var(--accent)" }}>
                  {name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-active)" }}>{name}</p>
                  <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                    {occupation}{school ? ` · ${school}` : ""}{employer ? ` · ${employer}` : ""}
                  </p>
                </div>
              </div>

              <div
                className="h-px w-full"
                style={{ background: "var(--border)" }}
              />

              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Theme</p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ background: theme?.accent }} />
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>{theme?.label}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Workspace sections</p>
                <div className="flex flex-wrap gap-1">
                  {useCases.map((uc) => (
                    <span key={uc} className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{ background: "var(--bg-titlebar)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                      {uc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-2 rounded-md text-sm font-medium"
              style={{
                background: "var(--bg-sidebar)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : finish()}
            disabled={!canNext || saving}
            className="flex-1 py-2 rounded-md text-sm font-medium transition-all"
            style={{
              background: canNext ? "var(--accent)" : "var(--bg-sidebar)",
              border: `1px solid ${canNext ? "var(--accent)" : "var(--border)"}`,
              color: canNext ? "white" : "var(--text-muted)",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Setting up..." : step < STEPS.length - 1 ? "Continue" : "Enter HypeOS"}
          </button>
        </div>
      </div>
    </div>
  );
}

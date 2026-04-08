"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getThemeForUser, applyTheme, themes } from "@/lib/themes";
import { seedContextFiles } from "@/lib/seedContext";

type OccupationType = "student" | "professional" | "entrepreneur" | "other";

const STEPS = ["Who are you?", "Where?", "What for?", "Right now", "This quarter", "Your HypeOS"];

export default function OnboardingPage() {
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [occupation, setOccupation] = useState<OccupationType | "">("");
  const [school, setSchool] = useState("");
  const [employer, setEmployer] = useState("");
  const [useCases, setUseCases] = useState<string[]>([]);
  const [topPriority, setTopPriority] = useState("");
  const [currentLoad, setCurrentLoad] = useState("");
  const [goals, setGoals] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const themeKey = getThemeForUser(school, employer, occupation || undefined);
  const theme = themes[themeKey];

  function toggleUseCase(val: string) {
    setUseCases((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  }

  async function finish() {
    setSaving(true);
    setSaveError("");

    // Get user — retry up to 3 times
    let user = null;
    for (let i = 0; i < 3; i++) {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) { user = data.user; break; }
      } catch { /* retry */ }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!user) {
      // Last resort: redirect anyway and let middleware sort it out
      window.location.href = "/";
      return;
    }

    // Save profile — retry up to 3 times, always continue regardless
    for (let i = 0; i < 3; i++) {
      try {
        const { error } = await supabase.from("profiles").update({
          name,
          occupation,
          school: school || null,
          employer: employer || null,
          theme_preset: themeKey,
          use_cases: useCases,
          onboarding_done: true,
        }).eq("id", user.id);
        if (!error) break;
      } catch { /* retry */ }
      await new Promise((r) => setTimeout(r, 500));
    }

    // Seed context files — fire and forget, never block the redirect
    seedContextFiles(supabase, user.id, {
      name, occupation, school, employer, useCases, topPriority, currentLoad, goals,
    }).catch(() => { /* non-critical, user can fill in files later */ });

    applyTheme(themeKey);
    window.location.href = "/";
  }

  const goalCategories = [
    useCases.includes("school") || occupation === "student" ? { key: "school", label: "Academic goal", placeholder: "e.g. Finish the semester with a 3.5 GPA, no late assignments" } : null,
    useCases.includes("work") || occupation === "professional" ? { key: "work", label: "Career / work goal", placeholder: "e.g. Land a promotion, finish the Q2 project on time" } : null,
    useCases.includes("business") || occupation === "entrepreneur" ? { key: "business", label: "Business goal", placeholder: "e.g. Land first paying client, hit $2k/month" } : null,
    useCases.includes("personal") ? { key: "personal", label: "Personal goal", placeholder: "e.g. Build a consistent workout routine" } : null,
  ].filter(Boolean) as { key: string; label: string; placeholder: string }[];

  const canNext = [
    name.trim().length > 0 && occupation !== "",
    true,
    useCases.length > 0,
    topPriority.trim().length > 0,
    true,
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

        {/* Step 4 — Right now */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-active)" }}>
                What's your #1 priority right now?
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                One sentence. What is everything else supporting?
              </p>
            </div>

            <input
              type="text"
              value={topPriority}
              onChange={(e) => setTopPriority(e.target.value)}
              className="px-3 py-2 rounded-md text-sm outline-none"
              style={{
                background: "var(--bg-sidebar)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              placeholder="e.g. Land a summer internship before the semester ends"
              autoFocus
            />

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-muted)" }}>
                What else are you currently juggling? (optional)
              </label>
              <textarea
                value={currentLoad}
                onChange={(e) => setCurrentLoad(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
                style={{
                  background: "var(--bg-sidebar)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                placeholder={"One item per line:\n5 active classes this semester\nBuilding a freelance client pipeline\nPrepping for technical interviews"}
              />
            </div>
          </div>
        )}

        {/* Step 5 — This quarter */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-active)" }}>
                What do you want to accomplish this quarter?
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                One goal per area. These become your milestones.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {goalCategories.map(({ key, label, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</label>
                  <input
                    type="text"
                    value={goals[key] ?? ""}
                    onChange={(e) => setGoals((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{
                      background: "var(--bg-sidebar)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              {goalCategories.length === 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Top goal this quarter</label>
                  <input
                    type="text"
                    value={goals["general"] ?? ""}
                    onChange={(e) => setGoals((prev) => ({ ...prev, general: e.target.value }))}
                    className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{
                      background: "var(--bg-sidebar)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="e.g. Ship the project I've been sitting on"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 6 — Preview */}
        {step === 5 && (
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
        {saveError && (
          <p className="text-xs px-3 py-2 rounded-md mt-6" style={{ background: "#3a0a0a", color: "#f87171" }}>
            {saveError}
          </p>
        )}
        <div className="flex gap-2 mt-4">
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

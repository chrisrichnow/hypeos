"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setConfirmed(true);
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-active)" }}>Check your email</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            We sent a confirmation link to <span style={{ color: "var(--text-primary)" }}>{email}</span>.
            Click it to activate your account and get started.
          </p>
          <p className="text-xs mt-6" style={{ color: "var(--text-muted)" }}>
            Already confirmed?{" "}
            <Link href="/auth/login" style={{ color: "var(--accent)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-active)" }}>HypeOS</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Create your workspace</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 rounded-md text-sm outline-none"
              style={{
                background: "var(--bg-sidebar)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 rounded-md text-sm outline-none"
              style={{
                background: "var(--bg-sidebar)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              placeholder="Min 8 characters"
            />
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-md" style={{ background: "#3a0a0a", color: "#f87171" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              background: "var(--accent)",
              color: "white",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "var(--accent)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

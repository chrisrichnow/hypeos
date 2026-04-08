"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { applyTheme } from "@/lib/themes";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function loadTheme() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("theme_preset")
        .eq("id", user.id)
        .single();

      if (profile?.theme_preset) {
        applyTheme(profile.theme_preset);
      }
    }
    loadTheme();
  }, []);

  return <>{children}</>;
}

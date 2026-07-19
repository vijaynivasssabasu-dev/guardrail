"use client";

import { useEffect, useState } from "react";
import { BotMessageSquare } from "lucide-react";
import { getWelcomeCopy, readUserProfile, sessionChangedEvent, type UserProfile } from "@/lib/session";

export function WelcomeGreeting() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    function refreshProfile() {
      setProfile(readUserProfile());
    }

    refreshProfile();
    window.addEventListener(sessionChangedEvent, refreshProfile);
    window.addEventListener("storage", refreshProfile);
    return () => {
      window.removeEventListener(sessionChangedEvent, refreshProfile);
      window.removeEventListener("storage", refreshProfile);
    };
  }, []);

  useEffect(() => {
    if (!profile) {
      setGreeting("");
      return;
    }

    const fallback = getWelcomeCopy(profile.language);
    const controller = new AbortController();
    setGreeting(`${fallback.greeting}, ${profile.name}. ${fallback.message}`);

    async function requestWelcome() {
      try {
        const response = await fetch("/api/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
          signal: controller.signal
        });
        const payload = (await response.json()) as { greeting?: string };
        if (response.ok && payload.greeting) {
          setGreeting(payload.greeting);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.warn("Humanic Code AI welcome is unavailable.", error);
        }
      }
    }

    void requestWelcome();
    return () => controller.abort();
  }, [profile]);

  if (!profile) {
    return null;
  }

  return (
    <section className="border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3" aria-live="polite">
      <div className="flex items-start gap-3">
        <BotMessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-800">Humanic Code Assistant</p>
          <p className="mt-1 text-lg font-bold text-emerald-950">{greeting}</p>
        </div>
      </div>
    </section>
  );
}


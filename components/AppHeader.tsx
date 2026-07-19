"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { clearUserProfile, readUserProfile, sessionChangedEvent, type UserProfile } from "@/lib/session";

export function AppHeader() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

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

  return (
    <header className="border-b border-line bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center">
          <img
            src="/guardrail-logo-header.png"
            alt="Guardrail"
            className="h-11 w-auto shrink-0 sm:h-12"
          />
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium">
          {profile ? (
            <>
              <Link className="rounded px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-ink" href="/">
                Review
              </Link>
              <Link className="rounded px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-ink" href="/history">
                History
              </Link>
              <span className="hidden max-w-28 truncate px-2 text-slate-500 sm:inline">{profile.name}</span>
              <button
                className="grid h-9 w-9 place-items-center rounded text-slate-600 hover:bg-slate-100 hover:text-ink"
                type="button"
                title="Sign out"
                aria-label="Sign out"
                onClick={clearUserProfile}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <Link className="grid h-9 w-9 place-items-center rounded text-slate-600 hover:bg-slate-100 hover:text-ink" href="/login" title="Sign in" aria-label="Sign in">
              <LogIn className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

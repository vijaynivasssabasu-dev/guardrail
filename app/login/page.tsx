"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Languages, ShieldCheck } from "lucide-react";
import { browserLanguage, languageOptions, readUserProfile, saveUserProfile, type PreferredLanguage } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<PreferredLanguage>("en");

  useEffect(() => {
    const profile = readUserProfile();
    if (profile) {
      router.replace("/");
      return;
    }

    setLanguage(browserLanguage());
  }, [router]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    saveUserProfile({ name: trimmedName.slice(0, 80), language });
    router.replace("/");
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl place-items-center px-4 py-8 sm:px-6 lg:px-8">
      <section className="w-full max-w-md border border-line bg-white p-6 shadow-soft sm:p-8">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-ink text-white">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-ink">Sign in to Guardrail</h1>
        <p className="mt-2 text-sm text-slate-600">Set your review profile to continue.</p>

        <form className="mt-6 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-semibold text-ink" htmlFor="name">
            Your name
            <input
              id="name"
              className="mt-2 w-full rounded border border-line bg-white px-3 py-2.5 text-ink outline-none focus:border-ink"
              value={name}
              maxLength={80}
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-semibold text-ink" htmlFor="language">
            Preferred language
            <span className="relative mt-2 block">
              <Languages className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
              <select
                id="language"
                className="w-full appearance-none rounded border border-line bg-white py-2.5 pl-9 pr-3 text-ink outline-none focus:border-ink"
                value={language}
                onChange={(event) => setLanguage(event.target.value as PreferredLanguage)}
              >
                {languageOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
              </select>
            </span>
          </label>

          <button className="inline-flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-2.5 text-sm font-semibold text-white" type="submit">
            Continue to review
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </section>
    </main>
  );
}

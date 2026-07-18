"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { readUserProfile, sessionChangedEvent } from "@/lib/session";

type SessionGateProps = {
  children: ReactNode;
};

export function SessionGate({ children }: SessionGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(pathname === "/login");

  useEffect(() => {
    const profile = readUserProfile();
    if (!profile && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    if (profile && pathname === "/login") {
      router.replace("/");
      return;
    }

    setReady(true);
  }, [pathname, router]);

  useEffect(() => {
    function handleSessionChange() {
      const profile = readUserProfile();
      if (!profile && pathname !== "/login") {
        router.replace("/login");
      }
      if (profile && pathname === "/login") {
        router.replace("/");
      }
    }

    window.addEventListener(sessionChangedEvent, handleSessionChange);
    window.addEventListener("storage", handleSessionChange);
    return () => {
      window.removeEventListener(sessionChangedEvent, handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
    };
  }, [pathname, router]);

  if (!ready && pathname !== "/login") {
    return <main className="mx-auto max-w-7xl px-4 py-8 text-sm font-medium text-slate-500 sm:px-6 lg:px-8">Opening your workspace...</main>;
  }

  return <>{children}</>;
}

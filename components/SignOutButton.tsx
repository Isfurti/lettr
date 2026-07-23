"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-ink-soft hover:text-ink px-3 py-2"
    >
      Sign out
    </button>
  );
}

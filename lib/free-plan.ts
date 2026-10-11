/**
 * The free plan's AI rewrite allowance: how many a new free account gets, for
 * life. One number for everything that mentions it - the limit itself
 * (lib/limits.ts), the builder's sign-up hint, the guest rewrite message, the
 * pricing page and the homepage FAQ - so they can never disagree again.
 *
 * Kept in its own file with no imports so browser components can use it too
 * (lib/limits.ts pulls in server-only code).
 */
export const FREE_AI_REWRITES = 3;

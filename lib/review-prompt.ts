/**
 * When to show the in-app "How's Lettr working for you?" pop-up. Kept apart
 * from the component so the rules are easy to test.
 *
 * Signed-in users only, on the app pages. It appears after a few visits to
 * the app or soon after a resume download, never on the first page they see,
 * and once answered it never comes back. "Not now" waits a week.
 */
export const PROMPT_KEY = "lettr_review_prompt";
export const VIEWS_BEFORE_ASK = 5;
export const SNOOZE_DAYS = 7;

export type PromptState = { views: number; snoozeUntil?: number; done?: boolean };

const APP_PATHS = [/^\/dashboard(\/|$)/, /^\/builder\//];

export function isAppPage(pathname: string): boolean {
  if (pathname.startsWith("/dashboard/feedback")) return false;
  return APP_PATHS.some((re) => re.test(pathname));
}

export function shouldAsk(state: PromptState, now: number, downloaded = false): boolean {
  if (state.done) return false;
  if (state.snoozeUntil && now < state.snoozeUntil) return false;
  return downloaded ? state.views >= 1 : state.views >= VIEWS_BEFORE_ASK;
}

export function snooze(state: PromptState, now: number): PromptState {
  return { ...state, snoozeUntil: now + SNOOZE_DAYS * 86_400_000, views: 0 };
}

/** One review in the existing format: the AI reads likes/dislikes from it. */
export function composeReview(rating: number, likes: string, improve: string): string {
  const parts: string[] = [];
  if (likes.trim()) parts.push(`What I like: ${likes.trim()}`);
  if (improve.trim()) parts.push(`What to improve: ${improve.trim()}`);
  return parts.length ? parts.join("\n\n") : `Rated Lettr ${rating} out of 5.`;
}

export function readState(): PromptState {
  try {
    const raw = window.localStorage.getItem(PROMPT_KEY);
    const s = raw ? JSON.parse(raw) : null;
    return s && typeof s.views === "number" ? s : { views: 0 };
  } catch {
    return { views: 0 };
  }
}

export function writeState(s: PromptState) {
  try {
    window.localStorage.setItem(PROMPT_KEY, JSON.stringify(s));
  } catch {
    // Private mode or full storage: the prompt just may ask again later.
  }
}

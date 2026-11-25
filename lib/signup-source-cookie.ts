import { cookies } from "next/headers";
import { SOURCE_COOKIE, parseSourceCookie, type SignupSource } from "./signup-source";

/**
 * The first-touch source the browser saved (components/SourceCapture.tsx), checked
 * again here because a cookie is visitor-controlled. Removes the cookie so one
 * browser does not stamp its first source onto a second account. No cookie, or
 * not in a request (tests, scripts), gives null.
 */
export async function takeSignupSource(): Promise<SignupSource | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(SOURCE_COOKIE)?.value;
    if (!raw) return null;
    const source = parseSourceCookie(raw);
    try {
      jar.delete({ name: SOURCE_COOKIE, path: "/" });
    } catch {
      // Not allowed in this context: harmless, the cookie just expires on its own.
    }
    return source;
  } catch {
    return null;
  }
}

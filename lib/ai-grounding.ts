/**
 * Catches AI text that names a tool, product, employer or other proper noun
 * the person never gave. lib/ai-honesty.ts blanks invented numbers and drops
 * claim words (awards, targets...), but it cannot see "Python" appearing in
 * a bullet about Excel. This does, in plain code with no AI.
 *
 * A word is checked when it looks like a name: Capitalised in the middle of a
 * sentence, an ALL-CAPS acronym, or written with + # . or digits (C++, Node.js,
 * EC2). A checked word must appear somewhere in the source text.
 *
 * shortcut: lowercase tools are checked only against the short LOWER_TOOLS
 * list, and a plain capitalised opening word is never checked. Grow the list
 * if real output slips through.
 */

const WORD = /[A-Za-z][A-Za-z0-9+#.\-']*/g;

function clean(token: string): string {
  return token.replace(/['’]s$/i, "").replace(/[.\-']+$/, "");
}

/** Tools people write in lower case; checked when they appear in output but not in the source. */
const LOWER_TOOLS = new Set(["python", "java", "javascript", "typescript", "sql", "excel", "react", "node", "docker", "kubernetes", "aws", "git", "github", "npm", "pandas", "numpy", "figma", "photoshop", "tableau", "flutter", "django", "flask", "mysql", "mongodb", "firebase", "linux", "html", "css", "php", "ruby", "swift", "kotlin", "golang", "rust"]);
/** Capitalised words that are not names. */
const NOT_NAMES = new Set(["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);

function looksLikeName(token: string): boolean {
  if (LOWER_TOOLS.has(token.toLowerCase())) return true;
  if (NOT_NAMES.has(token.toLowerCase())) return false;
  if (/^[a-z]+[A-Z]/.test(token)) return true; // iOS, jQuery, macOS
  if (/^[A-Z]{2,}$/.test(token)) return true; // SQL, CGPA
  if (/[+#]/.test(token) || /[A-Za-z]\.[A-Za-z]/.test(token)) return true; // C++, C#, Node.js
  if (/[A-Za-z]/.test(token) && /\d/.test(token)) return true; // EC2, B2B
  return /^[A-Z][a-z]/.test(token) || /^[A-Z][a-z]+[A-Z]/.test(token); // Python, GitHub
}

/** Lower-cased words of the source, with a trailing "s" and "'s" folded away so "Excel" matches "Excels". */
function sourceWords(source: string): Set<string> {
  const set = new Set<string>();
  for (const m of source.matchAll(WORD)) {
    const w = clean(m[0]).toLowerCase();
    set.add(w);
    if (w.endsWith("s")) set.add(w.slice(0, -1));
  }
  return set;
}

/** Names in `output` that do not appear in `source`. Empty means every name is the person's own. */
export function ungroundedTerms(output: string, source: string): string[] {
  const known = sourceWords(source);
  const found: string[] = [];
  const text = output.replace(/\[[^\]]*\]/g, " "); // [X] blanks are never names
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    let first = true;
    for (const m of sentence.matchAll(WORD)) {
      const raw = m[0];
      if (first) {
        first = false;
        if (/^[A-Z][a-z]+$/.test(raw)) continue; // a plain opening verb is capitalised whatever it is; "AWS" or "Python" is not
      }
      const token = clean(raw);
      if (token.length < 2 || !looksLikeName(token)) continue;
      const w = token.toLowerCase();
      if (known.has(w) || known.has(w.replace(/s$/, ""))) continue;
      found.push(token);
    }
  }
  return [...new Set(found)];
}

/** Keeps only options whose every name comes from the source. */
export function dropUngrounded(options: string[], source: string): { kept: string[]; dropped: string[] } {
  const kept: string[] = [];
  const dropped: string[] = [];
  for (const o of options) (ungroundedTerms(o, source).length ? dropped : kept).push(o);
  return { kept, dropped };
}

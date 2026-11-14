import { earlierRoles, earlierRoleLine } from "@/lib/resume-sections";
import type { ExperienceEntry } from "@/lib/types";

/** Earlier titles at the same company (promotions), under the current one. Matches EarlierRolesPdf. */
export function EarlierRoles({ exp }: { exp: ExperienceEntry }) {
  const roles = earlierRoles(exp);
  if (roles.length === 0) return null;
  return (
    <div className="text-xs text-ink-soft mt-0.5">
      {roles.map((r) => (
        <p key={r.id}>{earlierRoleLine(r)}</p>
      ))}
    </div>
  );
}

import { Text, View } from "@react-pdf/renderer";
import { earlierRoles, earlierRoleLine } from "@/lib/resume-sections";
import type { ExperienceEntry } from "@/lib/types";

/** Earlier titles at the same company (promotions), under the current one. Matches EarlierRoles. */
export function EarlierRolesPdf({ exp }: { exp: ExperienceEntry }) {
  const roles = earlierRoles(exp);
  if (roles.length === 0) return null;
  return (
    <View style={{ marginTop: 1, marginBottom: 1 }}>
      {roles.map((r) => (
        <Text key={r.id} style={{ fontSize: 8.5, color: "#5b6472" }}>
          {earlierRoleLine(r)}
        </Text>
      ))}
    </View>
  );
}

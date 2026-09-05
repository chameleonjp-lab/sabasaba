import { describe, expect, it } from "vitest";

import { UPGRADE_CATALOG } from "./types";
import { WEAPON_LIBRARY } from "./weaponCatalog";

describe("weapon library catalog", () => {
  it("keeps one library entry for every upgrade option", () => {
    expect(WEAPON_LIBRARY).toHaveLength(UPGRADE_CATALOG.length);
    expect(new Set(WEAPON_LIBRARY.map((entry) => entry.id)).size).toBe(UPGRADE_CATALOG.length);
  });

  it("exposes implementation notes for every selectable upgrade", () => {
    for (const entry of WEAPON_LIBRARY) {
      expect(entry.implementationNotes.length, entry.id).toBeGreaterThan(0);
      expect(entry.implementationNotes.join(" ")).toContain("実装");
    }
  });
});

import { describe, expect, it } from "vitest";

import { testAliasMarker } from "@/lib/test-alias-marker";

describe("Vitest path aliases", () => {
  it("resolves @ imports to the src directory", () => {
    expect(testAliasMarker).toBe("vitest-alias-marker");
  });
});

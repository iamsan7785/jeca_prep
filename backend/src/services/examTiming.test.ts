import { describe, expect, it } from "vitest";
import { isAttemptExpired } from "./examTiming.js";

describe("authoritative exam expiry", () => {
  const expiresAt = new Date("2026-09-04T12:00:00.000Z");

  it("allows requests before the expiry timestamp", () => {
    expect(isAttemptExpired(expiresAt, new Date("2026-09-04T11:59:59.999Z"))).toBe(false);
  });

  it("expires an attempt at the exact timestamp", () => {
    expect(isAttemptExpired(expiresAt, expiresAt)).toBe(true);
  });

  it("expires delayed requests after the timestamp", () => {
    expect(isAttemptExpired(expiresAt, new Date("2026-09-04T12:01:00.000Z"))).toBe(true);
  });
});
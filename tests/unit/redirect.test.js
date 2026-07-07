import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "@/lib/auth/redirect";

describe("safeRedirectPath (open-redirect guard for /auth/callback?next=)", () => {
  it("allows a plain same-origin relative path", () => {
    expect(safeRedirectPath("/dashboard/security")).toBe("/dashboard/security");
  });

  it("falls back to /dashboard when next is missing", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
  });

  it("rejects fully-qualified URLs", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
  });

  it("rejects the user@host trick (evil.com would become the actual host once concatenated onto origin)", () => {
    expect(safeRedirectPath("@evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("/legit@evil.com")).toBe("/dashboard");
  });

  it("rejects paths not starting with a single slash", () => {
    expect(safeRedirectPath("evil.com")).toBe("/dashboard");
    expect(safeRedirectPath(".evil.com")).toBe("/dashboard");
  });

  it("rejects backslash tricks", () => {
    expect(safeRedirectPath("/\\evil.com")).toBe("/dashboard");
  });
});

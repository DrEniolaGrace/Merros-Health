import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";

function keys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

function values(obj: unknown): string[] {
  if (typeof obj === "string") return [obj];
  if (obj === null || typeof obj !== "object") return [];
  return Object.values(obj as Record<string, unknown>).flatMap(values);
}

describe("translations", () => {
  it("Arabic and English have identical keys", () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });
  it("no empty strings", () => {
    for (const v of [...values(ar), ...values(en)]) expect(v.trim()).not.toBe("");
  });
  it("Arabic strings actually contain Arabic script", () => {
    const arabic = /[؀-ۿ]/;
    const missing = keys(ar).filter((k) => {
      const v = k.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], ar);
      return typeof v === "string" && !arabic.test(v);
    });
    expect(missing).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { handleFixesSubmit, parseFixesBody } from "../server/fixes";

describe("parseFixesBody", () => {
  it("requires name and problem", () => {
    expect(parseFixesBody({}).ok).toBe(false);
    expect(parseFixesBody({ firstName: "Ada", lastName: "Lovelace" }).ok).toBe(false);
    const ok = parseFixesBody({
      firstName: " Ada ",
      lastName: " Lovelace ",
      problem: " Scroll is empty on Genesis "
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.data.firstName).toBe("Ada");
      expect(ok.data.lastName).toBe("Lovelace");
      expect(ok.data.problem).toBe("Scroll is empty on Genesis");
      expect(ok.data.screenshot).toBeNull();
    }
  });

  it("accepts a small png screenshot", () => {
    const ok = parseFixesBody({
      firstName: "Ada",
      lastName: "Lovelace",
      problem: "Broken",
      screenshot: { mime: "image/png", base64: "aGVsbG8=" }
    });
    expect(ok.ok).toBe(true);
  });
});

describe("handleFixesSubmit local writer", () => {
  it("uses writeLocal when no GitHub token", async () => {
    const res = await handleFixesSubmit(
      { firstName: "Ada", lastName: "Lovelace", problem: "Need a wrench" },
      {
        writeLocal: () => ({ id: "test-id", path: "/tmp/x.json", screenshotPath: null })
      }
    );
    expect(res.status).toBe(200);
    expect(res.json.ok).toBe(true);
    expect(res.json.local).toBe(true);
    expect(res.json.id).toBe("test-id");
  });

  it("returns 503 when neither token nor local writer is set", async () => {
    const res = await handleFixesSubmit(
      { firstName: "Ada", lastName: "Lovelace", problem: "Need a wrench" },
      {}
    );
    expect(res.status).toBe(503);
  });

  it("stores in KV when provided", async () => {
    const saved: Record<string, string> = {};
    const res = await handleFixesSubmit(
      { firstName: "Ada", lastName: "Lovelace", problem: "Need a wrench" },
      {
        kv: {
          put: async (key, value) => {
            saved[key] = value;
          }
        }
      }
    );
    expect(res.status).toBe(200);
    expect(res.json.stored).toBe(true);
    expect(Object.keys(saved).some((k) => k.startsWith("fix:"))).toBe(true);
  });
});

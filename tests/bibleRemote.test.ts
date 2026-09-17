import { describe, expect, it } from "vitest";
import {
  handleBibleRemoteChapter,
  handleBibleRemoteFetch,
  isBibleRemotePath,
  parseBibleRemoteQuery
} from "../server/bibleRemote";

describe("bible remote proxy", () => {
  it("recognizes the remote path", () => {
    expect(isBibleRemotePath("/api/bible/remote")).toBe(true);
    expect(isBibleRemotePath("/api/bible/remote/")).toBe(true);
    expect(isBibleRemotePath("/api/bible/jo/1")).toBe(false);
  });

  it("validates bibleId and chapterId", () => {
    expect(parseBibleRemoteQuery("a556c5305ee15c3f-01", "JHN.1")).toEqual({
      ok: true,
      bibleId: "a556c5305ee15c3f-01",
      chapterId: "JHN.1"
    });
    expect(parseBibleRemoteQuery("a556c5305ee15c3f-01", "jhn.1").ok).toBe(true);
    expect(parseBibleRemoteQuery("../etc", "JHN.1").ok).toBe(false);
    expect(parseBibleRemoteQuery("a556c5305ee15c3f-01", "not-a-chapter").ok).toBe(false);
    expect(parseBibleRemoteQuery("", "JHN.1").ok).toBe(false);
  });

  it("returns 503 when the Worker secret is missing", async () => {
    const result = await handleBibleRemoteChapter("a556c5305ee15c3f-01", "JHN.1", {
      apiKey: undefined
    });
    expect(result.status).toBe(503);
    expect(String(result.json.error)).toMatch(/BIBLE_API_KEY/i);
  });

  it("returns 400 for bad query via fetch adapter", async () => {
    const res = await handleBibleRemoteFetch(
      new Request("https://example.test/api/bible/remote?bibleId=bad&chapterId=nope"),
      { BIBLE_API_KEY: "x", DONATE_PUBLIC_ORIGIN: "https://patrista.com" }
    );
    expect(res).not.toBeNull();
    expect(res!.status).toBe(400);
  });

  it("answers CORS preflight", async () => {
    const res = await handleBibleRemoteFetch(
      new Request("https://example.test/api/bible/remote", {
        method: "OPTIONS",
        headers: { Origin: "https://patrista.com" }
      }),
      { DONATE_PUBLIC_ORIGIN: "https://patrista.com" }
    );
    expect(res!.status).toBe(204);
    expect(res!.headers.get("Access-Control-Allow-Origin")).toBe("https://patrista.com");
  });
});

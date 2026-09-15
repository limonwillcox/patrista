import { describe, expect, it } from "vitest";
import {
  dollarsToCents,
  feeCoverCents,
  formatUsd,
  handleDonateCheckout,
  handleDonateFetch,
  isDonateCheckoutPath,
  parseDonateBody
} from "../server/donate";

describe("donate money helpers", () => {
  it("formats whole dollars without cents and $2.75 with cents", () => {
    expect(formatUsd(500)).toBe("$5");
    expect(formatUsd(275)).toBe("$2.75");
    expect(formatUsd(10000)).toBe("$100");
  });

  it("covers Stripe-like 2.9% + $0.30", () => {
    expect(feeCoverCents(5000)).toBe(175);
    expect(feeCoverCents(275)).toBe(38);
  });

  it("parses dollar strings into cents without float drift", () => {
    expect(dollarsToCents("2.75")).toBe(275);
    expect(dollarsToCents("50")).toBe(5000);
    expect(dollarsToCents("1.5")).toBe(150);
    expect(dollarsToCents("nope")).toBeNull();
  });
});

describe("parseDonateBody", () => {
  it("accepts a one-time gift", () => {
    expect(
      parseDonateBody({ amountCents: 500, interval: "once", feeCover: true })
    ).toEqual({
      ok: true,
      data: { amountCents: 500, interval: "once", feeCover: true }
    });
  });

  it("requires at least $1", () => {
    const r = parseDonateBody({ amountCents: 99, interval: "once", feeCover: false });
    expect(r.ok).toBe(false);
  });
});

describe("donate checkout handler", () => {
  it("recognizes the checkout path", () => {
    expect(isDonateCheckoutPath("/api/donate/checkout")).toBe(true);
    expect(isDonateCheckoutPath("/api/donate/checkout/")).toBe(true);
    expect(isDonateCheckoutPath("/api/catalog")).toBe(false);
  });

  it("returns 503 when Stripe is not configured instead of inventing a charge", async () => {
    const result = await handleDonateCheckout(
      { amountCents: 500, interval: "once", feeCover: false },
      { secretKey: undefined, publicOrigin: "http://127.0.0.1:5173" }
    );
    expect(result.status).toBe(503);
    expect(String(result.json.error)).toMatch(/not connected/i);
  });

  it("returns 400 for a missing amount", async () => {
    const result = await handleDonateCheckout(
      { interval: "once" },
      { secretKey: "sk_test_x", publicOrigin: "http://127.0.0.1:5173" }
    );
    expect(result.status).toBe(400);
  });

  it("answers CORS preflight on the Worker adapter", async () => {
    const res = await handleDonateFetch(
      new Request("https://patrista.com/api/donate/checkout", { method: "OPTIONS" }),
      { DONATE_PUBLIC_ORIGIN: "https://patrista.com" }
    );
    expect(res).not.toBeNull();
    expect(res?.status).toBe(204);
  });

  it("ignores non-donate Worker paths", async () => {
    const res = await handleDonateFetch(new Request("https://patrista.com/api/catalog"));
    expect(res).toBeNull();
  });
});

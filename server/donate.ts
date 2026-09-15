export type DonateInterval = "once" | "month" | "year";

export const DONATE_PRESETS_CENTS = [275, 500, 1000, 2000, 3000, 5000, 10000] as const;
export const DONATE_MIN_CENTS = 100;
export const DONATE_MAX_CENTS = 100_000_00;

export function isDonateCheckoutPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/api/donate/checkout";
}

/** Stripe US card blend: 2.9% + $0.30, rounded to the nearest cent. */
export function feeCoverCents(amountCents: number): number {
  return Math.round(amountCents * 0.029 + 30);
}

export function formatUsd(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  if (remainder === 0) return sign + "$" + dollars;
  return sign + "$" + dollars + "." + String(remainder).padStart(2, "0");
}

/** Parse a dollars string like "2.75" or "50" into cents. */
export function dollarsToCents(raw: string): number | null {
  const t = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const [d, c = ""] = t.split(".");
  return Number(d) * 100 + Number((c + "00").slice(0, 2));
}

export type DonateRequest = {
  amountCents: number;
  interval: DonateInterval;
  feeCover: boolean;
};

export type DonateHandlerResult = {
  status: number;
  json: Record<string, unknown>;
};

export function parseDonateBody(body: unknown): { ok: true; data: DonateRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Please select an amount" };
  const rec = body as Record<string, unknown>;
  const interval = rec.interval;
  if (interval !== "once" && interval !== "month" && interval !== "year") {
    return { ok: false, error: "Choose once, monthly, or yearly" };
  }
  const amountCents = rec.amountCents;
  if (typeof amountCents !== "number" || !Number.isInteger(amountCents)) {
    return { ok: false, error: "Please select an amount (minimum $1)" };
  }
  if (amountCents < DONATE_MIN_CENTS) return { ok: false, error: "Please select an amount (minimum $1)" };
  if (amountCents > DONATE_MAX_CENTS) {
    return { ok: false, error: "This form cannot take gifts larger than " + formatUsd(DONATE_MAX_CENTS) };
  }
  return {
    ok: true,
    data: {
      amountCents,
      interval,
      feeCover: rec.feeCover === true
    }
  };
}

export async function handleDonateCheckout(
  body: unknown,
  options: { secretKey: string | undefined; publicOrigin: string }
): Promise<DonateHandlerResult> {
  const parsed = parseDonateBody(body);
  if (!parsed.ok) return { status: 400, json: { error: parsed.error } };
  const secretKey = options.secretKey?.trim();
  if (!secretKey) {
    return {
      status: 503,
      json: { error: "Donations are not connected yet. Add STRIPE_SECRET_KEY on the donate API." }
    };
  }

  const total = parsed.data.feeCover
    ? parsed.data.amountCents + feeCoverCents(parsed.data.amountCents)
    : parsed.data.amountCents;

  try {
    const session = await createStripeCheckout({
      secretKey,
      publicOrigin: options.publicOrigin.replace(/\/+$/, ""),
      amountCents: total,
      interval: parsed.data.interval
    });
    if ("error" in session) return { status: 502, json: { error: session.error } };
    return { status: 200, json: { url: session.url } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: 502, json: { error: message || "Checkout failed" } };
  }
}

async function createStripeCheckout(opts: {
  secretKey: string;
  publicOrigin: string;
  amountCents: number;
  interval: DonateInterval;
}): Promise<{ url: string } | { error: string }> {
  const origin = opts.publicOrigin || "https://patrista.com";
  const params = new URLSearchParams();
  const once = opts.interval === "once";
  params.set("mode", once ? "payment" : "subscription");
  params.set("success_url", origin + "/give?thanks=1");
  params.set("cancel_url", origin + "/give?canceled=1");
  params.set("billing_address_collection", "auto");
  if (once) params.set("submit_type", "donate");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(opts.amountCents));
  params.set("line_items[0][price_data][product_data][name]", "Donation to Patrista");
  if (!once) {
    params.set("line_items[0][price_data][recurring][interval]", opts.interval);
  }
  params.set("metadata[source]", "patrista-give");
  params.set("metadata[interval]", opts.interval);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + opts.secretKey,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  const data = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok) {
    return { error: data.error?.message || "Stripe checkout failed" };
  }
  if (!data.url) return { error: "Stripe did not return a checkout URL" };
  return { url: data.url };
}

export function donateCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

export type DonateEnv = {
  STRIPE_SECRET_KEY?: string;
  DONATE_PUBLIC_ORIGIN?: string;
};

function publicOrigin(request: Request, env: DonateEnv): string {
  return env.DONATE_PUBLIC_ORIGIN || request.headers.get("origin") || "https://patrista.com";
}

/** Web Fetch adapter for Vite-adjacent tests and Cloudflare Workers. */
export async function handleDonateFetch(request: Request, env: DonateEnv = {}): Promise<Response | null> {
  const url = new URL(request.url);
  if (!isDonateCheckoutPath(url.pathname)) return null;
  const origin = publicOrigin(request, env);
  const cors = donateCorsHeaders(origin);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json; charset=utf-8", ...cors }
    });
  }
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const result = await handleDonateCheckout(body, {
    secretKey: env.STRIPE_SECRET_KEY,
    publicOrigin: origin
  });
  return new Response(JSON.stringify(result.json), {
    status: result.status,
    headers: { "content-type": "application/json; charset=utf-8", ...cors }
  });
}


export const AMAZON_DISCLOSURE = "As an Amazon Associate I earn from qualifying purchases.";
export const AMAZON_TAG = "patrista-20";

/** Clean Amazon product link with the Associates tag. */
export function amazonUrl(asin: string): string {
  return "https://www.amazon.com/dp/" + asin + "?tag=" + AMAZON_TAG;
}

/** Hardcover editions, keyed by work id. */
const ASINS: Record<string, string> = {
  confessions: "014044114X",
  "on-the-incarnation-of-the-word": "8397939008",
  "epistles-of-ignatius": "B0D123HLY7",
  "church-history": "0140445358",
  "first-apology": "B0DZVKC7XM",
  "second-apology": "B0DZVKC7XM",
  "epistle-to-the-philippians": "B0DK9W3VWW",
  "martyrdom-of-polycarp": "B0DK9W3VWW",
  didache: "B0C6W1HCNR"
};

export const PRINT_EDITIONS: Record<string, { url: string }> = Object.fromEntries(
  Object.entries(ASINS).map(([id, asin]) => [id, { url: amazonUrl(asin) }])
);

export const AMAZON_TAG = "patrista-20";

export const AMAZON_DISCLOSURE = "As an Amazon Associate I earn from qualifying purchases.";

export type PrintEdition = {
  asin: string;
  /** Short edition note shown under the box, when known. */
  label?: string;
};

/** Print editions for the Hardcover box, keyed by work id. */
export const PRINT_EDITIONS: Record<string, PrintEdition> = {
  confessions: { asin: "014044114X", label: "Penguin Classics" },
  "on-the-incarnation-of-the-word": { asin: "8397939008" },
  "epistles-of-ignatius": { asin: "B0D123HLY7", label: "English–Greek" },
  "church-history": { asin: "0140445358", label: "Penguin Classics" },
  "first-apology": { asin: "B0DZVKC7XM", label: "First and Second Apologies" },
  "second-apology": { asin: "B0DZVKC7XM", label: "First and Second Apologies" },
  "epistle-to-the-philippians": { asin: "B0DK9W3VWW", label: "English–Greek, with the Martyrdom" },
  "martyrdom-of-polycarp": { asin: "B0DK9W3VWW", label: "English–Greek, with the Epistle" },
  didache: { asin: "B0C6W1HCNR" }
};

export function amazonUrl(asin: string): string {
  return "https://www.amazon.com/dp/" + asin + "?tag=" + AMAZON_TAG;
}

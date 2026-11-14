/** Display helpers for a work's Clavis Clavium entry (see server/workClavis.ts). */

/** "CPL-251" → "CPL 251", the form scholars cite. */
export function formatClavisNumber(n: string): string {
  return n.replace(/^([A-Z]+)-/, "$1 ");
}

export function clavisUrl(id: string): string {
  return "https://clavis.brepols.net/clacla/OA/Details.aspx?id=" + id;
}

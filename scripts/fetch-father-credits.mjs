/**
 * Fill public/assets/fathers/credits.json with the Commons artist and license,
 * and write src/data/fatherSameAs.json when the file depicts a person who has
 * an English Wikipedia or Wikidata page.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CREDITS_PATH = join(ROOT, "public", "assets", "fathers", "credits.json");
const SAME_AS_PATH = join(ROOT, "src", "data", "fatherSameAs.json");
const UA = "Patrista/1.0 (https://patrista.com; father portrait credits)";

function commonsFileTitle(source) {
  let url = source;
  try {
    url = decodeURIComponent(source);
  } catch {
    url = source;
  }
  const thumb = url.match(/\/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/([^/]+)\//);
  if (thumb) return "File:" + thumb[1];
  const direct = url.match(/\/wikipedia\/commons\/[^/]+\/[^/]+\/([^/?#]+)$/);
  if (direct) return "File:" + direct[1];
  return null;
}

function collapseRepeat(value) {
  const text = value.trim();
  const mid = Math.floor(text.length / 2);
  if (mid > 3 && text.slice(0, mid).trim() === text.slice(mid).trim()) return text.slice(0, mid).trim();
  return text;
}

function htmlText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function metaValue(info, key) {
  const raw = info?.extmetadata?.[key]?.value;
  return raw ? htmlText(raw) : "";
}

function attributionRequired(license, flag) {
  if (flag === "true") return true;
  if (flag === "false") return false;
  if (/public domain|cc0|\bpd\b/i.test(license)) return false;
  return /CC BY|GFDL|attribution/i.test(license);
}

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(res.status + " " + url);
  return res.json();
}

function claimIds(entity, prop) {
  const claims = entity?.claims?.[prop] || entity?.statements?.[prop] || [];
  const ids = [];
  for (const claim of claims) {
    const value = claim?.mainsnak?.datavalue?.value;
    if (value && typeof value.id === "string") ids.push(value.id);
  }
  return ids;
}

async function main() {
  const credits = JSON.parse(readFileSync(CREDITS_PATH, "utf8"));
  const byTitle = new Map();
  for (const [id, row] of Object.entries(credits)) {
    const title = commonsFileTitle(row.source || "");
    if (!title) {
      console.log("[credits] no Commons file for " + id);
      continue;
    }
    byTitle.set(title, id);
  }

  const titles = [...byTitle.keys()];
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "imageinfo",
    iiprop: "extmetadata|url",
    titles: titles.join("|")
  });
  const query = await getJson("https://commons.wikimedia.org/w/api.php?" + params.toString());
  const pages = Object.values(query.query?.pages || {});
  const normalized = new Map();
  for (const item of query.query?.normalized || []) normalized.set(item.to, item.from);
  for (const page of pages) {
    const title = page.title;
    const requested = normalized.get(title) || title;
    const id = byTitle.get(requested) || byTitle.get(title);
    if (!id) {
      console.log("[credits] unmatched page " + title);
      continue;
    }
    const info = (page.imageinfo || [])[0] || {};
    const license = metaValue(info, "LicenseShortName") || metaValue(info, "License");
    const artist = metaValue(info, "Artist") || metaValue(info, "Credit");
    const licenseUrl = info.extmetadata?.LicenseUrl?.value || "";
    const flag = info.extmetadata?.AttributionRequired?.value || "";
    const row = credits[id];
    row.file = title;
    row.artist = collapseRepeat(artist);
    row.license = license;
    row.licenseUrl = htmlText(licenseUrl);
    row.attributionRequired = attributionRequired(license, flag);
    row.commonsPage = "https://commons.wikimedia.org/wiki/" + encodeURIComponent(title).replace(/%3A/g, ":");
    if (page.pageid) row.commonsEntity = "M" + page.pageid;
    console.log("[credits] " + id + " — " + (license || "no license") + (row.attributionRequired ? " (attribute)" : ""));
  }

  const entityIds = Object.values(credits)
    .map((row) => row.commonsEntity)
    .filter(Boolean);
  const entities = await getJson(
    "https://commons.wikimedia.org/w/api.php?" +
      new URLSearchParams({
        action: "wbgetentities",
        format: "json",
        ids: entityIds.join("|"),
        props: "claims"
      }).toString()
  );
  const depictedByAuthor = new Map();
  const qids = new Set();
  for (const [id, row] of Object.entries(credits)) {
    const entity = row.commonsEntity ? entities.entities?.[row.commonsEntity] : null;
    const ids = [...claimIds(entity, "P180"), ...claimIds(entity, "P921")];
    const unique = [...new Set(ids)];
    if (!unique.length) continue;
    depictedByAuthor.set(id, unique);
    for (const qid of unique) qids.add(qid);
  }

  async function loadEntities(ids) {
    const out = {};
    for (let i = 0; i < ids.length; i += 40) {
      const slice = ids.slice(i, i + 40);
      const wd = await getJson(
        "https://www.wikidata.org/w/api.php?" +
          new URLSearchParams({
            action: "wbgetentities",
            format: "json",
            ids: slice.join("|"),
            props: "claims|sitelinks",
            sitefilter: "enwiki"
          }).toString()
      );
      Object.assign(out, wd.entities || {});
    }
    return out;
  }

  let wdEntities = await loadEntities([...qids]);
  const secondHop = new Set();
  for (const entity of Object.values(wdEntities)) {
    if (claimIds(entity, "P31").includes("Q5")) continue;
    for (const prop of ["P180", "P921"]) {
      for (const qid of claimIds(entity, prop)) {
        if (!wdEntities[qid]) secondHop.add(qid);
      }
    }
  }
  if (secondHop.size) wdEntities = { ...wdEntities, ...(await loadEntities([...secondHop])) };

  function personFrom(qidsForFile) {
    const seen = new Set(qidsForFile);
    const queue = [...qidsForFile];
    while (queue.length) {
      const qid = queue.shift();
      const entity = wdEntities[qid];
      if (!entity) continue;
      if (claimIds(entity, "P31").includes("Q5")) return qid;
      for (const prop of ["P180", "P921"]) {
        for (const next of claimIds(entity, prop)) {
          if (seen.has(next)) continue;
          seen.add(next);
          queue.push(next);
        }
      }
    }
    return null;
  }

  const sameAs = {};
  for (const [id, depicted] of depictedByAuthor) {
    const person = personFrom(depicted);
    if (!person) continue;
    const entity = wdEntities[person];
    const urls = ["https://www.wikidata.org/wiki/" + person];
    const wiki = entity?.sitelinks?.enwiki?.title;
    if (wiki) urls.unshift("https://en.wikipedia.org/wiki/" + wiki.replace(/ /g, "_"));
    sameAs[id] = urls;
    console.log("[credits] sameAs " + id + " " + urls[0]);
  }

  for (const row of Object.values(credits)) delete row.commonsEntity;
  writeFileSync(CREDITS_PATH, JSON.stringify(credits, null, 2) + "\n");
  writeFileSync(SAME_AS_PATH, JSON.stringify(sameAs, null, 2) + "\n");
  console.log("[credits] wrote " + Object.keys(credits).length + " credits, " + Object.keys(sameAs).length + " sameAs");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

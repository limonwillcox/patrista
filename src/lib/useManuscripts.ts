import { useEffect, useState } from "react";

type Manuscripts = typeof import("../data/manuscripts");

let loaded: Manuscripts | null = null;
let loading: Promise<Manuscripts> | null = null;

/**
 * The manuscript pages we know of (src/data/manuscripts.ts), fetched apart from the page's own script:
 * the list is large and only decides whether a "See the manuscript" button shows. Null until it arrives.
 */
export function useManuscripts(): Manuscripts | null {
  const [data, setData] = useState(loaded);
  useEffect(() => {
    if (loaded) return;
    let gone = false;
    loading ??= import("../data/manuscripts");
    loading
      .then((m) => {
        loaded = m;
        if (!gone) setData(m);
      })
      .catch(() => {
        loading = null;
      });
    return () => {
      gone = true;
    };
  }, []);
  return data;
}

# Dictionary miss queue

When a reader looks up a word and Webster 1913 has no entry, the app POSTs
`/api/dictionary/miss`. That is the signal a bot should drain.

## Where the queue lives

- Local Vite: `data/dictionary/inbox/{word}.json` (gitignored). One file per
  headword. Repeat misses increment `count`.
- Production Worker: Cloudflare `FIXES_KV` keys `dict:miss:{word}` with the
  same JSON. `GET /api/dictionary/misses` lists open records, highest `count`
  first.

Each record:

```json
{
  "word": "resistest",
  "query": "resistest",
  "count": 3,
  "firstAt": "2026-10-13T00:00:00.000Z",
  "lastAt": "2026-10-13T12:00:00.000Z",
  "work": "confessions",
  "status": "open"
}
```

`count` is how often readers hit a gap. Use it as fill priority. `work` is the
last writing they were in.

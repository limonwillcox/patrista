---
name: ship
description: Ship the current work to patrista.com - check it, commit, merge to main, deploy, and confirm it is live. Use when the user says "ship", "ship it", or "commit merge deploy".
disable-model-invocation: true
---

# Ship to patrista.com

A merge to `main` is a production deploy: the "Deploy Cloudflare Pages" workflow builds the site and
uploads it. No CI checks a pull request first, so every check below runs here, before the merge.
Stop and report at the first failure. Do not merge something that failed a check.

Arguments, if given, are the commit message or a note on what to ship: `$ARGUMENTS`

## 1. Look

- `git status --short` and `git fetch origin`. Say in one line what is about to ship.
- Never stage `.claude/` (except `.claude/skills/`), `data/connections/typology/candidates.jsonl`,
  secrets, or anything from outside the repo (for example a Google client-secret JSON).
- If the working tree holds work that looks unfinished or unrelated to what the user asked to ship,
  name it and ask before including it.
- If on `main`, make a branch first.

## 2. Check (all must pass)

Run these in order. The build takes about four minutes; run it in the background.

1. `npx tsc --noEmit -p .`
2. `npx vitest run`
3. `npm run build`, then read the log for:
   - `[seo] ... 0 problems` (the build fails otherwise);
   - `find dist -type f | wc -l` under 20,000 after packing (Cloudflare Pages Free limit).
     Count only after a build that finished: a failed build leaves unpacked files.

If the change can be seen in a browser and has not been looked at yet, open the built site
(`npx vite preview`, port 4173) and check the pages it touches and the console.

## 3. Commit, merge, deploy

1. Stage and commit. The message says what changed for a reader, in plain words.
2. `git merge origin/main` if the branch is behind, then `git push origin <branch>`.
3. `gh pr create --base main` with a short body: what changes for a reader, how it was checked,
   what was not checked.
4. `gh pr merge <number> --merge`.
5. Find the run with `gh run list --workflow cloudflare-pages.yml --limit 1` and wait for it with
   `gh run watch <id> --exit-status` in the background. Do not poll.

## 4. The API worker (only if it changed)

If the commit touches `wrangler.toml`, `server/donate-worker.ts`, `server/account.ts` or another
file the worker imports, deploy the worker too. It lives in the account that holds patrista.com,
not the user's own:

```bash
CLOUDFLARE_ACCOUNT_ID=4f33d55620c0e7b82ab25b406b9221c5 npx --yes wrangler@4.158.0 deploy
```

A new D1 table needs its schema applied with `wrangler d1 execute <db> --remote --file=...` first.

## 5. Confirm it is live

- The run's conclusion is `success`.
- `curl` the pages the change touches on `https://patrista.com` and check for the change itself
  (a new page returns 200; new text or a new asset name is in the response).
- If the worker was deployed, call one of its routes.

## 6. Report

Say what is live, with the pull request link, what was checked on the live site, and what was not.
If something failed, say which step, show the output, and leave the site as it was.

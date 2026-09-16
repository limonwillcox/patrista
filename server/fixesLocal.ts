import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { extForMime, newFixId, type FixesRequest } from "./fixes";

export function writeLocalFix(
  root: string,
  data: FixesRequest
): { id: string; path: string; screenshotPath: string | null } {
  const id = newFixId();
  const inbox = join(root, "data", "fixes", "inbox");
  mkdirSync(inbox, { recursive: true });
  let screenshotPath: string | null = null;
  if (data.screenshot) {
    const ext = extForMime(data.screenshot.mime) || "png";
    const shots = join(root, "data", "fixes", "screenshots");
    mkdirSync(shots, { recursive: true });
    screenshotPath = join(shots, `${id}.${ext}`);
    writeFileSync(screenshotPath, Buffer.from(data.screenshot.base64, "base64"));
  }
  const path = join(inbox, `${id}.json`);
  writeFileSync(
    path,
    JSON.stringify(
      {
        id,
        createdAt: new Date().toISOString(),
        firstName: data.firstName,
        lastName: data.lastName,
        problem: data.problem,
        screenshotPath
      },
      null,
      2
    )
  );
  return { id, path, screenshotPath };
}

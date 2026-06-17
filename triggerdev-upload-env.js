
import { envvars } from "@trigger.dev/sdk";
import { readFileSync } from "fs";


const envContent = readFileSync("triggerdev.env", "utf-8");

// Parse KEY=VALUE manually
const parsed = Object.fromEntries(
  envContent
    .split("\n")
    .filter(line => line.trim() && !line.startsWith("#"))
    .map(line => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim()];
    })
);

// Keys that must be REMOVED from Trigger.dev if they exist.
// These are managed automatically by the ffmpeg() build extension at runtime —
// hardcoding them causes wrong paths in local dev on Windows.
const KEYS_TO_DELETE = ["FFMPEG_PATH", "FFPROBE_PATH"];

process.env.TRIGGER_SECRET_KEY = "tr_dev_dMMzkfTx0xLIhWcG2vzr";

// Delete stale keys then upload fresh vars — dev
for (const key of KEYS_TO_DELETE) {
  try {
    await envvars.delete("proj_ocrnikuwoeibypadxobk", "dev", key);
    console.log(`🗑  Deleted ${key} from dev`);
  } catch {
    // Key may not exist — that's fine
  }
}
await envvars.upload("proj_ocrnikuwoeibypadxobk", "dev", {
  variables: parsed,
  override: true,
});

process.env.TRIGGER_SECRET_KEY = "tr_prod_dJbF3mAjMycTma7QKZ0O";

// Delete stale keys then upload fresh vars — prod
for (const key of KEYS_TO_DELETE) {
  try {
    await envvars.delete("proj_ocrnikuwoeibypadxobk", "prod", key);
    console.log(`🗑  Deleted ${key} from prod`);
  } catch {
    // Key may not exist — that's fine
  }
}
await envvars.upload("proj_ocrnikuwoeibypadxobk", "prod", {
  variables: parsed,
  override: true,
});

console.log("✅ Done! Uploaded to dev and prod.");
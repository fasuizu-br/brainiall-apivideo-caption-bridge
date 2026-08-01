import { readFile } from "node:fs/promises";

const CAPTION_KEY = /^(?:vtt|webvtt|srt|caption|captions|subtitle|subtitles)$/i;
const CAPTION_MARKER = /(?:WEBVTT|\d{1,3}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{1,3}:\d{2}:\d{2}[,.]\d{3})/m;

function isCaptionText(value) {
  return typeof value === "string" && value.trim().length > 0 && CAPTION_MARKER.test(value);
}

function walk(value, path = [], seen = new Set()) {
  if (typeof value === "string" || value === null || typeof value !== "object") return null;
  if (seen.has(value)) return null;
  seen.add(value);

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = walk(value[index], [...path, String(index)], seen);
      if (found) return found;
    }
    return null;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = [...path, key];
    if (CAPTION_KEY.test(key) && isCaptionText(child)) {
      return { text: child.replace(/^\uFEFF/, ""), path: childPath };
    }
    const found = walk(child, childPath, seen);
    if (found) return found;
  }
  return null;
}

/**
 * Find one caption file embedded in a local Apify run export.
 * This intentionally performs no network request and never reads credentials.
 */
export function extractApifyCaptionExport(value) {
  const found = walk(value);
  if (!found) {
    throw new TypeError("No SRT/WebVTT caption text found in the local Apify export");
  }
  return found;
}

export async function extractApifyCaptionFile(inputPath) {
  if (typeof inputPath !== "string" || !inputPath.trim()) {
    throw new TypeError("inputPath is required");
  }
  const raw = await readFile(inputPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new TypeError(`Apify export must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return extractApifyCaptionExport(parsed);
}

import { readFile } from "node:fs/promises";

const CAPTION_KEY = /^(?:vtt|webvtt|srt|caption|captions|subtitle|subtitles)$/i;
const CAPTION_MARKER = /(?:WEBVTT|\d{1,3}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{1,3}:\d{2}:\d{2}[,.]\d{3})/m;

function isCaptionText(value) {
  return typeof value === "string" && value.trim().length > 0 && CAPTION_MARKER.test(value);
}

function cueTime(value) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    const milliseconds = Math.round(value * 1000);
    const hours = Math.floor(milliseconds / 3_600_000);
    const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
    const seconds = Math.floor((milliseconds % 60_000) / 1000);
    const millis = milliseconds % 1000;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
  }
  if (typeof value === "string" && /^(?:\d+:)?\d{2}:\d{2}[.,]\d{3}$/.test(value.trim())) {
    const parts = value.trim().replace(",", ".").split(":");
    if (parts.length === 2) parts.unshift("00");
    return parts.map((part, index) => (index === 0 ? part.padStart(2, "0") : part)).join(":");
  }
  return null;
}

function segmentsToWebVtt(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return null;
  const cues = [];
  for (const segment of segments) {
    const start = cueTime(segment?.start);
    const end = cueTime(segment?.end);
    const text = typeof segment?.text === "string" ? segment.text.trim() : "";
    if (!start || !end || !text || start >= end) return null;
    cues.push(`${start} --> ${end}\n${text}`);
  }
  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
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

  if (Array.isArray(value.segments)) {
    const converted = segmentsToWebVtt(value.segments);
    if (converted) return { text: converted, path: [...path, "segments"] };
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

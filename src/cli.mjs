#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { bridgeReviewedWebVtt } from "./bridge.mjs";

const [filePath, videoId, language = "pt-BR"] = process.argv.slice(2);
if (!filePath || !videoId) {
  console.error("Usage: brainiall-apivideo-caption <reviewed.vtt> <videoId> [language]");
  process.exitCode = 2;
} else {
  try {
    const webVttText = await readFile(filePath, "utf8");
    const result = await bridgeReviewedWebVtt({
      webVttText,
      videoId,
      language,
      apiKey: process.env.API_VIDEO_API_KEY,
    });
    console.log(JSON.stringify({ captionId: result.captionId ?? null, language: result.language ?? language }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

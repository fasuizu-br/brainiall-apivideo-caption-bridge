#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { extractApifyCaptionFile } from "./apify.mjs";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error("Usage: brainiall-apify-caption-extract <run-export.json> <captions.srt|captions.vtt>");
  process.exitCode = 2;
} else {
  try {
    const result = await extractApifyCaptionFile(inputPath);
    await writeFile(outputPath, result.text, { encoding: "utf8", mode: 0o600 });
    console.log(JSON.stringify({ outputPath, sourcePath: result.path.join(".") }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

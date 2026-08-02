#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { validateWebVtt } from "./bridge.mjs";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node src/qa-cli.mjs <reviewed.vtt>");
  process.exitCode = 2;
} else {
  try {
    const text = await readFile(filePath, "utf8");
    const valid = validateWebVtt(text);
    const cueCount = (valid.match(/(?:^|\n)(?:[^\n]+\n)?\d{2,}:\d{2}:\d{2}[.,]\d{3}\s+-->/gm) || []).length;
    console.log(JSON.stringify({ ok: true, format: "webvtt", bytes: Buffer.byteLength(valid, "utf8"), cueCount }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

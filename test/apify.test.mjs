import test from "node:test";
import assert from "node:assert/strict";
import { extractApifyCaptionExport } from "../src/apify.mjs";

test("extracts a nested WebVTT field without network access", () => {
  const result = extractApifyCaptionExport({
    actorRun: { id: "synthetic-run", files: { vtt: "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nHello\n" } },
  });
  assert.equal(result.path.join("."), "actorRun.files.vtt");
  assert.match(result.text, /^WEBVTT/);
});

test("accepts an SRT field and rejects unrelated output", () => {
  const result = extractApifyCaptionExport({ output: { srt: "1\n00:00:00,000 --> 00:00:01,000\nOlá\n" } });
  assert.equal(result.path.join("."), "output.srt");
  assert.throws(() => extractApifyCaptionExport({ output: { transcript: "plain text only" } }), /No SRT\/WebVTT/);
});

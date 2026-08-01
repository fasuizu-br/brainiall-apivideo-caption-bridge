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

test("converts timestamped transcript segments from a local Actor export to WebVTT", () => {
  const result = extractApifyCaptionExport({
    transcript: {
      language: "english",
      segments: [
        { start: "00:00:00.000", end: "00:00:01.250", text: "First segment" },
        { start: 1.25, end: 2.5, text: "Second segment" },
      ],
    },
  });
  assert.equal(result.path.join("."), "transcript.segments");
  assert.match(result.text, /WEBVTT/);
  assert.match(result.text, /00:00:01\.250 --> 00:00:02\.500/);
});

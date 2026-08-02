import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

test("qa cli validates without making a network request", async () => {
  const dir = await mkdtemp(join(tmpdir(), "caption-qa-"));
  const file = join(dir, "reviewed.vtt");
  await writeFile(file, "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nfixture\n");
  const { stdout } = await exec(process.execPath, ["src/qa-cli.mjs", file], { env: { ...process.env, API_VIDEO_API_KEY: "" } });
  const result = JSON.parse(stdout);
  assert.deepEqual(result.format, "webvtt");
  assert.equal(result.ok, true);
  assert.equal(result.cueCount, 1);
});

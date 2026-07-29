import assert from "node:assert/strict";
import test from "node:test";
import {
  bridgeReviewedWebVtt,
  createApiVideoAccessToken,
  uploadWebVttCaption,
  validateLanguage,
  validateVideoId,
  validateWebVtt,
} from "../src/bridge.mjs";

const VALID_VTT = "WEBVTT\n\n00:00:00.000 --> 00:00:02.500\nFalante 1: Bom dia.\n";

test("accepts a bounded WebVTT with a cue", () => {
  assert.equal(validateWebVtt(VALID_VTT), VALID_VTT.trim());
});

test("rejects empty, oversized, binary and malformed captions before fetch", async () => {
  for (const invalid of ["", "not vtt", "WEBVTT\n\nno cue", `WEBVTT\n\n${"x".repeat(10 * 1024 * 1024)}`]) {
    assert.throws(() => validateWebVtt(invalid));
  }
  let calls = 0;
  await assert.rejects(
    uploadWebVttCaption({
      webVttText: "not vtt",
      videoId: "vi123",
      accessToken: "token",
      fetchImpl: async () => { calls += 1; },
    }),
  );
  assert.equal(calls, 0);
});

test("validates identifiers before building a request", () => {
  assert.equal(validateVideoId("vi_123-A"), "vi_123-A");
  assert.equal(validateLanguage("pt-BR"), "pt-BR");
  assert.throws(() => validateVideoId("../secret"));
  assert.throws(() => validateLanguage("pt/BR"));
});

test("exchanges the API key without leaking it in the URL", async () => {
  const seen = [];
  const token = await createApiVideoAccessToken({
    apiKey: "private-test-key",
    fetchImpl: async (url, init) => {
      seen.push({ url: String(url), init });
      return new Response(JSON.stringify({ access_token: "short-lived-token" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.equal(token, "short-lived-token");
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, "https://ws.api.video/auth/api-key");
  assert.doesNotMatch(seen[0].url, /private-test-key/);
  assert.deepEqual(JSON.parse(seen[0].init.body), { apiKey: "private-test-key" });
});

test("uploads the reviewed caption exactly once with server-side bearer auth", async () => {
  const seen = [];
  const result = await uploadWebVttCaption({
    webVttText: VALID_VTT,
    videoId: "vi123",
    language: "pt-BR",
    accessToken: "short-lived-token",
    makeDefault: true,
    fetchImpl: async (url, init) => {
      seen.push({ url: String(url), init });
      return new Response(JSON.stringify({ captionId: "cap123", language: "pt-BR" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.deepEqual(result, { captionId: "cap123", language: "pt-BR" });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, "https://ws.api.video/videos/vi123/captions/pt-BR?default=true");
  assert.equal(seen[0].init.method, "POST");
  assert.equal(seen[0].init.headers.authorization, "Bearer short-lived-token");
  assert.ok(seen[0].init.body instanceof FormData);
});

test("bridge performs one auth call and one upload without retries", async () => {
  const calls = [];
  const result = await bridgeReviewedWebVtt({
    webVttText: VALID_VTT,
    videoId: "vi123",
    apiKey: "private-test-key",
    fetchImpl: async (url) => {
      calls.push(String(url));
      if (calls.length === 1) {
        return new Response(JSON.stringify({ access_token: "short-lived-token" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ captionId: "cap123" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.equal(result.captionId, "cap123");
  assert.deepEqual(calls, [
    "https://ws.api.video/auth/api-key",
    "https://ws.api.video/videos/vi123/captions/pt-BR?default=false",
  ]);
});

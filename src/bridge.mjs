const AUTH_URL = "https://ws.api.video/auth/api-key";
const API_BASE_URL = "https://ws.api.video";
const MAX_VTT_BYTES = 10 * 1024 * 1024;
const CUE_TIMING = /(?:^|\n)(?:[^\n]+\n)?\d{2,}:\d{2}:\d{2}[.,]\d{3}\s+-->\s+\d{2,}:\d{2}:\d{2}[.,]\d{3}(?:\s|$)/m;

function requiredString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${label} is required`);
  }
  return value.trim();
}

export function validateWebVtt(value) {
  const text = requiredString(value, "webVttText").replace(/^\uFEFF/, "");
  if (Buffer.byteLength(text, "utf8") > MAX_VTT_BYTES) {
    throw new RangeError("WebVTT exceeds the 10 MiB safety limit");
  }
  if (text.includes("\0")) {
    throw new TypeError("WebVTT contains a NUL byte");
  }
  if (!/^WEBVTT(?:[ \t].*)?(?:\r?\n|$)/.test(text)) {
    throw new TypeError("WebVTT must start with the WEBVTT header");
  }
  if (!CUE_TIMING.test(text.replace(/\r\n/g, "\n"))) {
    throw new TypeError("WebVTT must contain at least one valid cue timing line");
  }
  return text;
}

export function validateVideoId(value) {
  const videoId = requiredString(value, "videoId");
  if (!/^[A-Za-z0-9_-]{3,128}$/.test(videoId)) {
    throw new TypeError("videoId contains unsupported characters");
  }
  return videoId;
}

export function validateLanguage(value) {
  const language = requiredString(value, "language");
  if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(language)) {
    throw new TypeError("language must be a bounded BCP 47-style tag such as pt-BR");
  }
  return language;
}

export async function createApiVideoAccessToken({ apiKey, fetchImpl = fetch }) {
  const key = requiredString(apiKey, "apiKey");
  const response = await fetchImpl(AUTH_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ apiKey: key }),
  });
  if (!response.ok) {
    throw new Error(`api.video authentication failed with HTTP ${response.status}`);
  }
  const payload = await response.json();
  return requiredString(payload?.access_token, "api.video access_token");
}

export async function uploadWebVttCaption({
  webVttText,
  videoId,
  language = "pt-BR",
  accessToken,
  makeDefault = false,
  fetchImpl = fetch,
}) {
  const validText = validateWebVtt(webVttText);
  const validVideoId = validateVideoId(videoId);
  const validLanguage = validateLanguage(language);
  const token = requiredString(accessToken, "accessToken");
  const form = new FormData();
  form.append("file", new Blob([validText], { type: "text/vtt;charset=utf-8" }), "captions.vtt");

  const url = new URL(
    `/videos/${encodeURIComponent(validVideoId)}/captions/${encodeURIComponent(validLanguage)}`,
    API_BASE_URL,
  );
  url.searchParams.set("default", String(Boolean(makeDefault)));

  // Deliberately issue exactly one metered/mutating upload. The caller decides whether a failed
  // or ambiguous request is safe to repeat after checking api.video state.
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) {
    throw new Error(`api.video caption upload failed with HTTP ${response.status}`);
  }
  return response.json();
}

export async function bridgeReviewedWebVtt(options) {
  const accessToken = await createApiVideoAccessToken(options);
  return uploadWebVttCaption({ ...options, accessToken });
}

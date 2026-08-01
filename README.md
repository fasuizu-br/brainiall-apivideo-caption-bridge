# BRAINIALL api.video caption bridge

A small, dependency-free Node.js bridge that validates a reviewed WebVTT file, exchanges an api.video API key for a short-lived access token, and uploads the caption once to a video you control.

This repository does **not** download media, hide a retry, or claim that a lower listed transcription price means equivalent quality. It is designed for a bounded workflow:

1. Generate WebVTT from media you own or are authorized to process, for example with the [BRAINIALL transcription and diarization Actor](https://apify.com/vivid_astronaut/audio-video-transcription-diarization).
2. Review speaker labels, names, timing, encoding, and the complete caption track.
3. Run this bridge server-side to upload the reviewed file to your own api.video video.
4. Confirm that the caption appears and plays correctly before publishing.

## Existing Apify output, local handoff

If a transcription Actor already produced an SRT or WebVTT field, export that run result
locally and extract the caption file without calling the Apify API or sending the media to
BRAINIALL:

```bash
npx brainiall-apify-caption-extract run-export.json reviewed.vtt
npx brainiall-apivideo-caption reviewed.vtt vi123 pt-BR
```

The extractor searches only bounded fields named `vtt`, `webvtt`, `srt`, `caption(s)` or
`subtitle(s)`. It can also convert a timestamped `transcript.segments` array (the shape
used by some Actors) into WebVTT, but it still requires review of the complete output.
It is a local convenience for an authorized run export, not an Apify scraper, a
transcription service, or proof of Actor ownership, quality, usage, or revenue.

api.video documents an important edge case: a malformed WebVTT may receive HTTP 200 but not appear in the player. The bridge therefore rejects missing headers and cue timing before the upload. It still cannot prove semantic accuracy or full WebVTT conformance.

## Use

Requirements: Node.js 22 or later, an api.video API key, an authorized target video, and a reviewed `.vtt` file.

```bash
export API_VIDEO_API_KEY='set-this-in-your-secret-manager'
npx github:fasuizu-br/brainiall-apivideo-caption-bridge reviewed.vtt vi123 pt-BR
```

Keep `API_VIDEO_API_KEY` in a server-side environment or secret manager. Do not paste it into chat, a browser bundle, a command argument, source code, logs, or a committed file.

The upload request is deliberately attempted once. If the network result is ambiguous, inspect the caption state in api.video before deciding whether another upload is safe.

## Destination matrix (C70)

`src/destinations.mjs` is a credential-free planning helper for teams that move captions between a speech/transcript pipeline and a video platform. It records the public format, language, authorization boundary and post-upload status check for `api.video`, Cloudflare Stream and Brightcove. `planCaptionHandoff({ destination, language, reviewed })` returns a handoff plan and keeps `canUpload` false until the caller marks the file reviewed.

The helper does not contain a video id, media, token or API key, and it does not call any provider. Use the official destination documentation linked by each profile before operating a caller-owned account.

## LMS acceptance matrix (C71)

`src/lms.mjs` adds the same review-first boundary for Canvas, Moodle, Panopto and YuJa. `planLmsCaptionAcceptance({ lms, language, reviewed })` produces a provider-specific acceptance checklist without a course id, media bytes or account credential. It is a local planning primitive; it does not call an LMS or certify accessibility.

## Test

```bash
npm test
```

Tests use mocked HTTP responses. They make no paid call and upload no media.

## What this proves — and what it does not

- A passing test proves request construction, bounded validation, secret placement, and no automatic upload retry.
- A repository view, clone, owner test, or star is not an external user, buyer, or revenue.
- Revenue exists only after an independent buyer-linked payment is received, settled, and reconciled.

## Official references

- [api.video: add captions](https://docs.api.video/vod/add-captions)
- [api.video: captions API reference](https://docs.api.video/reference/api/Captions)
- [api.video pricing](https://api.video/pricing/)

BRAINIALL is independent and not affiliated with api.video or Apify. Each service has separate accounts, terms, support, and billing.

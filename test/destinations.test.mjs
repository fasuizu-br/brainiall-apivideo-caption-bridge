import assert from "node:assert/strict";
import test from "node:test";
import { destinationProfiles, getDestinationProfile, planCaptionHandoff } from "../src/destinations.mjs";

test("exposes three provider-neutral destination profiles without secrets", () => {
  assert.deepEqual(Object.keys(destinationProfiles), ["api.video", "cloudflare", "brightcove"]);
  for (const profile of Object.values(destinationProfiles)) {
    assert.match(profile.docsUrl, /^https:\/\//);
    assert.doesNotMatch(JSON.stringify(profile), /Bearer|api[_-]?key\s*[:=]|token\s*[:=]/i);
  }
});

test("requires human review before the plan can upload", () => {
  const pending = planCaptionHandoff({ destination: "cloudflare" });
  assert.equal(pending.canUpload, false);
  assert.equal(pending.language, "pt-BR");
  const reviewed = planCaptionHandoff({ destination: "brightcove", language: "en-US", reviewed: true });
  assert.equal(reviewed.canUpload, true);
  assert.equal(reviewed.acceptedFormat, "WebVTT sidecar text track");
  assert.throws(() => getDestinationProfile("unknown"));
  assert.throws(() => planCaptionHandoff({ destination: "api.video", language: "pt/BR" }));
});

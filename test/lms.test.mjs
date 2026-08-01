import assert from "node:assert/strict";
import test from "node:test";
import { getLmsDestinationProfile, lmsDestinationProfiles, planLmsCaptionAcceptance } from "../src/lms.mjs";

test("exposes LMS acceptance profiles without account data", () => {
  assert.deepEqual(Object.keys(lmsDestinationProfiles), ["canvas", "moodle", "panopto", "yuja"]);
  for (const profile of Object.values(lmsDestinationProfiles)) {
    assert.match(profile.docsUrl, /^https:\/\//);
    assert.doesNotMatch(JSON.stringify(profile), /Bearer|access[_-]?token\s*[:=]|course[_-]?id\s*[:=]/i);
  }
});

test("keeps handoff closed until a local review is complete", () => {
  const pending = planLmsCaptionAcceptance({ lms: "canvas" });
  assert.equal(pending.readyForHandoff, false);
  assert.equal(pending.language, "pt-BR");
  const reviewed = planLmsCaptionAcceptance({ lms: "yuja", language: "en-US", reviewed: true });
  assert.equal(reviewed.readyForHandoff, true);
  assert.equal(reviewed.acceptedFormat, "SRT or VTT caption file");
  assert.throws(() => getLmsDestinationProfile("unknown"));
  assert.throws(() => planLmsCaptionAcceptance({ lms: "moodle", language: "pt/BR" }));
});

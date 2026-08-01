const LMS_DESTINATIONS = Object.freeze({
  canvas: Object.freeze({
    id: "canvas",
    acceptedFormat: "WebVTT media track",
    authBoundary: "caller-owned Canvas OAuth2 token",
    acceptanceCheck: "read the media track response and confirm locale and content",
    docsUrl: "https://canvas.instructure.com/doc/api/all_resources.html",
  }),
  moodle: Object.freeze({
    id: "moodle",
    acceptedFormat: "WebVTT subtitle or caption file",
    authBoundary: "caller-owned Moodle editor permissions",
    acceptanceCheck: "open the saved media player and select the uploaded language",
    docsUrl: "https://docs.moodle.org/39/en/Video",
  }),
  panopto: Object.freeze({
    id: "panopto",
    acceptedFormat: "caption provider or imported caption track",
    authBoundary: "caller-owned Panopto OAuth/OpenID or portal permissions",
    acceptanceCheck: "confirm the caption track in the interactive player",
    docsUrl: "https://demo.hosted.panopto.com/Panopto/api/docs/index.html",
  }),
  yuja: Object.freeze({
    id: "yuja",
    acceptedFormat: "SRT or VTT caption file",
    authBoundary: "caller-owned YuJa content-owner permissions",
    acceptanceCheck: "confirm captions are enabled in the YuJa player",
    docsUrl: "https://support.yuja.com/hc/en-us/sections/360007057593-Captioning",
  }),
});

function requireLms(value) {
  if (typeof value !== "string" || !Object.hasOwn(LMS_DESTINATIONS, value)) {
    throw new TypeError("lms must be canvas, moodle, panopto or yuja");
  }
  return value;
}

export const lmsDestinationProfiles = LMS_DESTINATIONS;

export function getLmsDestinationProfile(lms) {
  return LMS_DESTINATIONS[requireLms(lms)];
}

/** Build a local acceptance checklist without credentials, course ids or media. */
export function planLmsCaptionAcceptance({ lms, language = "pt-BR", reviewed = false }) {
  const profile = getLmsDestinationProfile(lms);
  if (typeof language !== "string" || !/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(language)) {
    throw new TypeError("language must be a bounded BCP 47-style tag");
  }
  return {
    lms: profile.id,
    language,
    reviewed: Boolean(reviewed),
    readyForHandoff: Boolean(reviewed),
    acceptedFormat: profile.acceptedFormat,
    authBoundary: profile.authBoundary,
    acceptanceCheck: profile.acceptanceCheck,
    docsUrl: profile.docsUrl,
  };
}

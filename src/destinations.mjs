const DESTINATIONS = Object.freeze({
  "api.video": Object.freeze({
    id: "api.video",
    acceptedFormat: "WebVTT",
    languageRule: "IETF/BCP 47 language tag",
    authBoundary: "caller-owned api.video API key exchanged for a short-lived token",
    statusCheck: "confirm the caption in the destination player after the single upload",
    docsUrl: "https://docs.api.video/vod/add-captions",
  }),
  cloudflare: Object.freeze({
    id: "cloudflare",
    acceptedFormat: "WebVTT",
    languageRule: "BCP 47 language tag",
    authBoundary: "caller-owned Cloudflare API token or Stream binding",
    statusCheck: "read the caption status and fetch the destination VTT when ready",
    docsUrl: "https://developers.cloudflare.com/stream/edit-videos/adding-captions/",
  }),
  brightcove: Object.freeze({
    id: "brightcove",
    acceptedFormat: "WebVTT sidecar text track",
    languageRule: "destination text-track language and label",
    authBoundary: "caller-owned Brightcove OAuth2 credentials",
    statusCheck: "confirm the text track in the CMS or playback response",
    docsUrl: "https://apis.support.brightcove.com/dynamic-ingest/references/reference.html",
  }),
});

function requiredDestination(value) {
  if (typeof value !== "string" || !Object.hasOwn(DESTINATIONS, value)) {
    throw new TypeError("destination must be api.video, cloudflare or brightcove");
  }
  return value;
}

export const destinationProfiles = DESTINATIONS;

export function getDestinationProfile(destination) {
  return DESTINATIONS[requiredDestination(destination)];
}

/**
 * Return a review-first handoff plan. It deliberately carries no credential,
 * video id or media bytes; the caller supplies those only at the authorized
 * destination step.
 */
export function planCaptionHandoff({ destination, language = "pt-BR", reviewed = false }) {
  const profile = getDestinationProfile(destination);
  if (typeof language !== "string" || !/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(language)) {
    throw new TypeError("language must be a bounded BCP 47-style tag");
  }
  return {
    destination: profile.id,
    language,
    reviewed: Boolean(reviewed),
    canUpload: Boolean(reviewed),
    acceptedFormat: profile.acceptedFormat,
    languageRule: profile.languageRule,
    authBoundary: profile.authBoundary,
    statusCheck: profile.statusCheck,
    docsUrl: profile.docsUrl,
  };
}

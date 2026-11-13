/**
 * Feature flags for services that need Azure. Every flag defaults to the fallback that works
 * anywhere (Vercel, Docker, a laptop). Switching to Azure later is a matter of setting the flag
 * and the service's keys; no code changes.
 *
 * | Flag                  | Fallback (default)                         | Azure                          |
 * |-----------------------|--------------------------------------------|--------------------------------|
 * | FEATURE_VOICE         | browser  : Web Speech API                  | azure : Azure AI Speech        |
 * | FEATURE_VIDEO_CONSULT | simulated: the built in demo room          | acs   : Communication Services |
 * | FEATURE_VARIANT_WATCH | cron     : nightly HTTP job + manual button| job   : Container Apps job     |
 * | FEATURE_RESULT_VIDEO  | player   : Remotion Player in the browser  | render: server side rendering  |
 * | FEATURE_BEYOND_PANEL  | precomputed: stored persona results        | service: genomics container    |
 *
 * My Result Video and Risk Beyond the Panel are Phase 5 features; their flags exist so the
 * choice of fallback is already recorded, but nothing reads them yet.
 */
type Env = Record<string, string | undefined>;

const pick = <T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T => {
  const v = (value ?? "").trim().toLowerCase() as T;
  return allowed.includes(v) ? v : fallback;
};

export interface Features {
  voice: "browser" | "azure";
  videoConsult: "simulated" | "acs";
  variantWatch: "cron" | "job";
  resultVideo: "player" | "render";
  beyondPanel: "precomputed" | "service";
}

export function features(env: Env = process.env): Features {
  // Azure voice needs both the flag and a key; a flag without a key quietly stays on the fallback.
  const wantsAzureVoice = pick(env.FEATURE_VOICE, ["browser", "azure"] as const, env.AZURE_SPEECH_KEY ? "azure" : "browser") === "azure";
  return {
    voice: wantsAzureVoice && !!env.AZURE_SPEECH_KEY?.trim() ? "azure" : "browser",
    videoConsult: pick(env.FEATURE_VIDEO_CONSULT, ["simulated", "acs"] as const, "simulated") === "acs" && !!env.ACS_CONNECTION_STRING?.trim() ? "acs" : "simulated",
    variantWatch: pick(env.FEATURE_VARIANT_WATCH, ["cron", "job"] as const, "cron"),
    resultVideo: pick(env.FEATURE_RESULT_VIDEO, ["player", "render"] as const, "player"),
    beyondPanel: pick(env.FEATURE_BEYOND_PANEL, ["precomputed", "service"] as const, "precomputed") === "service" && !!env.GENOMICS_SERVICE_URL?.trim() ? "service" : "precomputed",
  };
}

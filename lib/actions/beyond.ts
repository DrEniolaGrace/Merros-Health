"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { releaseBeyond, syncBeyondPanel } from "@/lib/services/beyond";
import { setConsent } from "./patient";

/**
 * A partner agrees to (or withdraws from) Risk Beyond the Panel. This consent is separate from
 * every other one because the analysis can reveal relatedness. Nothing runs until both agree.
 */
export async function setBeyondConsent(on: boolean): Promise<{ analysisReady: boolean }> {
  const user = await requireUser(["patient"]);
  await setConsent("beyond_panel", on);
  const analysisReady = await syncBeyondPanel(user.id);
  revalidatePath("/[locale]", "layout");
  return { analysisReady };
}

/** Counsellor only: release the summary to the couple after talking it through with them. */
export async function releaseBeyondPanel(analysisId: string) {
  const me = await requireUser(["counsellor"]);
  await releaseBeyond(analysisId, me.id);
  revalidatePath("/[locale]", "layout");
}

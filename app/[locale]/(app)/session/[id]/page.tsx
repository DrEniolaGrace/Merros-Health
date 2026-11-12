import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";
import { Monogram } from "@/components/ui/avatar";
import { BackLink } from "@/components/ui/back-link";
import { LiveBadge } from "@/components/ui/accents";
import { SafetyPill } from "@/components/ui/pill";
import { CallControls } from "./call-controls";

/**
 * Video session room (SPEC 4.11). SIMULATED in this phase: the real call uses Azure
 * Communication Services, which arrives with the Azure deployment. Only the two participants
 * of the appointment can open this page.
 */
export default async function SessionPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const me = await requireUser(["patient", "counsellor"]);
  const t = await getTranslations("session");
  const appt = await prisma.appointment.findUnique({ where: { id }, include: { patient: true, clinician: true } });
  const allowed = appt && (appt.patientId === me.id || appt.clinician.userId === me.id);
  if (!appt || !allowed) notFound();
  const ar = locale === "ar";
  const patient = ar ? appt.patient.displayNameAr : appt.patient.displayNameEn;
  const clinician = ar ? appt.clinician.nameAr : appt.clinician.nameEn;
  const iAmPatient = appt.patientId === me.id;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={iAmPatient ? "/support" : `/counsellor/case/${appt.patientId}`} label={t("back")} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-gradient text-3xl font-semibold">{t("title")}</h1>
        <LiveBadge tone="gold">{t("simulated")}</LiveBadge>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { name: iAmPatient ? clinician : patient, sub: iAmPatient ? (ar ? appt.clinician.credentialsAr : appt.clinician.credentialsEn) : t("patient") },
          { name: iAmPatient ? patient : clinician, sub: t("you") },
        ].map((p, i) => (
          <GlassCard key={i} hero className="relative flex aspect-video flex-col items-center justify-center gap-3 overflow-hidden">
            <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--burgundy-glow)_25%,transparent),transparent_65%)]" />
            <Monogram name={p.name} size={88} />
            <p className="text-lg font-medium text-ink">{p.name}</p>
            <p className="max-w-64 text-center text-sm text-muted">{p.sub}</p>
          </GlassCard>
        ))}
      </div>
      <CallControls labels={{ mic: t("mic"), camera: t("camera"), leave: t("leave"), on: t("on"), off: t("off") }} leaveHref={iAmPatient ? "/support" : `/counsellor/case/${appt.patientId}`} />
      <p className="measure text-sm text-muted">{t("note")}</p>
      <SafetyPill kind="clinical_advice" label={t("adviceNote")} className="self-start" />
    </div>
  );
}

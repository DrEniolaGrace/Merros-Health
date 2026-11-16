import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { redirect } from "@/i18n/navigation";

/** Demo shortcut for the Judge Tour: opens a synthetic persona's case brief directly. */
export default async function OpenCase({ params }: { params: Promise<{ locale: string; persona: string }> }) {
  const { locale, persona } = await params;
  await requireUser(["counsellor"]);
  if (env().DEMO_MODE !== "true") notFound();
  const patient = await prisma.user.findUnique({ where: { personaKey: persona } });
  if (!patient || patient.role !== "patient") notFound();
  redirect({ href: `/counsellor/case/${patient.id}`, locale });
}

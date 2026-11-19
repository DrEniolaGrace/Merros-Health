"use client";

import { useTransition } from "react";
import { ArrowRight, Compass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { tourGo } from "@/lib/actions/auth";
import { setTour } from "@/components/tour/presenter";

/** Signs in as Mariam, opens her first screen, and starts the Judge Tour on its welcome card. */
export function StartTour({ label }: { label: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="lg"
      variant="gold"
      icon={<Compass size={20} />}
      iconEnd={<ArrowRight size={20} />}
      pending={pending}
      data-start-tour
      onClick={() =>
        start(async () => {
          setTour("1");
          window.location.assign(await tourGo("mariam", "/onboarding"));
        })
      }
    >
      {label}
    </Button>
  );
}

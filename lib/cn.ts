import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shared motion constants (DESIGN.md section 6). */
export const EASE_CALM = [0.22, 1, 0.36, 1] as const;
export const STAGGER = 0.05;

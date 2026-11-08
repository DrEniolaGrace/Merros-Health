/**
 * Exact rational arithmetic so risk numbers never drift through floating point
 * (for example 7/16 is shown as exactly 43.75%).
 */
export interface Fraction {
  num: number;
  den: number;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function frac(num: number, den = 1): Fraction {
  if (!Number.isInteger(num) || !Number.isInteger(den) || den <= 0) {
    throw new Error(`Invalid fraction ${num}/${den}`);
  }
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

export const ZERO = frac(0);
export const ONE = frac(1);
export const HALF = frac(1, 2);

export const add = (a: Fraction, b: Fraction) => frac(a.num * b.den + b.num * a.den, a.den * b.den);
export const sub = (a: Fraction, b: Fraction) => frac(a.num * b.den - b.num * a.den, a.den * b.den);
export const mul = (a: Fraction, b: Fraction) => frac(a.num * b.num, a.den * b.den);
export const eq = (a: Fraction, b: Fraction) => a.num * b.den === b.num * a.den;
export const toNumber = (a: Fraction) => a.num / a.den;

/** Percentage with up to 2 decimals, trailing zeros removed: 1/4 -> "25", 7/16 -> "43.75". */
export function toPercentString(a: Fraction): string {
  return (Math.round((a.num / a.den) * 10000) / 100).toString();
}

/** "1 in 4" style, only when the numerator is 1. */
export function toOneIn(a: Fraction): number | null {
  return a.num === 1 ? a.den : null;
}

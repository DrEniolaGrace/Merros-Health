/**
 * Blind Couple Match: ECDH based Private Set Intersection over ristretto255 (SPEC 6.1).
 *
 * Each partner's device:
 *   1. hashes each carrier gene to a curve point H(g) and blinds it with its own secret scalar:
 *      round 1 = shuffle({ H(g)^a } + random dummy points up to PSI_SET_SIZE)
 *   2. raises the partner's round 1 points to its own secret, keeping their order: round 2
 *   3. compares the partner's round 2 of its own points, H(g)^(ab), with its own computation of
 *      the partner's points, H(h)^(ba). Equal points mean the same gene.
 *
 * The relay (the Merros server) only ever handles opaque 32 byte points. Padding to a fixed size
 * hides how many carrier genes each partner has. Runs in the browser and in Node (tests).
 */
import { ed25519, ristretto255, ristretto255_hasher } from "@noble/curves/ed25519";
import { bytesToHex, randomBytes, utf8ToBytes } from "@noble/hashes/utils";
import { verifyBundle } from "@/lib/fhir/sign";
import { parseBundle } from "@/lib/fhir/bundle";
import { summarisePerson } from "@/lib/risk/engine";

export const PSI_SET_SIZE = 8;
const DST = "MERROS-PSI-v1-ristretto255";
const ORDER = ed25519.CURVE.n;
const Point = ristretto255.Point;
type RPoint = InstanceType<typeof Point>;

export class PsiError extends Error {}

/** A fresh secret scalar (hex). It never leaves the device. */
export function newSecret(): string {
  let k = 0n;
  while (k === 0n) k = BigInt("0x" + bytesToHex(randomBytes(64))) % ORDER;
  return k.toString(16).padStart(64, "0");
}

function scalar(secretHex: string): bigint {
  if (!/^[0-9a-f]{64}$/.test(secretHex)) throw new PsiError("Invalid secret");
  const k = BigInt("0x" + secretHex);
  if (k === 0n || k >= ORDER) throw new PsiError("Invalid secret");
  return k;
}

export function hashItem(item: string): RPoint {
  return ristretto255_hasher.hashToCurve(utf8ToBytes(`gene:${item}`), { DST }) as RPoint;
}

/** Decodes and validates a set of points as received from the relay. */
export function decodePointSet(hexes: unknown): RPoint[] {
  if (!Array.isArray(hexes) || hexes.length !== PSI_SET_SIZE) throw new PsiError(`Expected exactly ${PSI_SET_SIZE} points`);
  const seen = new Set<string>();
  return hexes.map((h) => {
    if (typeof h !== "string" || !/^[0-9a-f]{64}$/.test(h)) throw new PsiError("Malformed point");
    if (seen.has(h)) throw new PsiError("Duplicate point");
    seen.add(h);
    let p: RPoint;
    try {
      p = Point.fromHex(h);
    } catch {
      throw new PsiError("Invalid point encoding");
    }
    if (p.is0()) throw new PsiError("Identity point");
    return p;
  });
}

/** True when the value is a well formed PSI point set. Used by the relay; needs no secrets. */
export function isValidPointSet(hexes: unknown): hexes is string[] {
  try {
    decodePointSet(hexes);
    return true;
  } catch {
    return false;
  }
}

export interface Round1 {
  /** Sent to the partner through the relay. */
  blinded: string[];
  /** Kept on the device: which of my items sits at each position (null = dummy). */
  order: (string | null)[];
}

export function round1(items: string[], secretHex: string): Round1 {
  const unique = [...new Set(items)];
  if (unique.length > PSI_SET_SIZE) throw new PsiError(`At most ${PSI_SET_SIZE} items are supported`);
  const k = scalar(secretHex);
  const slots: { item: string | null; point: RPoint }[] = unique.map((item) => ({ item, point: hashItem(item).multiply(k) }));
  while (slots.length < PSI_SET_SIZE) slots.push({ item: null, point: Point.BASE.multiply(scalar(newSecret())) });
  // Fisher Yates shuffle with cryptographic randomness.
  for (let i = slots.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  return { blinded: slots.map((s) => s.point.toHex()), order: slots.map((s) => s.item) };
}

/** Raises the partner's round 1 points to my secret, preserving their order. */
export function round2(partnerRound1: unknown, secretHex: string): string[] {
  const k = scalar(secretHex);
  return decodePointSet(partnerRound1).map((p) => p.multiply(k).toHex());
}

/** My items that the partner also holds. Nothing else about the partner's set is learned. */
export function intersect(order: (string | null)[], partnerRound2OfMine: unknown, partnerRound1: unknown, secretHex: string): string[] {
  if (order.length !== PSI_SET_SIZE) throw new PsiError("Order does not match set size");
  const theirs = new Set(round2(partnerRound1, secretHex));
  const mine = decodePointSet(partnerRound2OfMine).map((p) => p.toHex());
  const shared: string[] = [];
  mine.forEach((h, i) => {
    const item = order[i];
    if (item !== null && theirs.has(h)) shared.push(item);
  });
  return shared.sort();
}

/**
 * Input integrity (SPEC 6.1): PSI items may only come from a lab signed result. Verifies the
 * signature on the device, then returns the genes where the person is a straightforward carrier.
 * Throws for unsigned or altered results.
 */
export function psiItemsFromSignedResult(bundle: unknown, signatureHex: string, labPublicKeyHex: string): string[] {
  if (!verifyBundle(bundle, signatureHex, labPublicKeyHex)) throw new PsiError("Result is not signed by the lab");
  const { variants } = parseBundle(bundle);
  return summarisePerson(variants)
    .genes.filter((g) => g.status.kind === "carrier")
    .map((g) => g.gene)
    .sort();
}

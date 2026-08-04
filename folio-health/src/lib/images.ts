/**
 * Curated, hand-reviewed Unsplash photo pool for Folio Health EMR.
 *
 * Every id below was downloaded and visually inspected (not just checked for a
 * 200 response) before being assigned a category, so callers can trust the
 * subject matter matches the module it's used in. Do not add new ids here
 * without the same verification — an unverified id can silently 404 or show
 * unrelated content.
 *
 * Usage: unsplash(MEDICAL_IMAGES.surgery[0], { w: 1200, q: 70 })
 */

type UnsplashParams = {
  w?: number
  h?: number
  q?: number
  fit?: "crop" | "clip" | "fill" | "max" | "min" | "scale"
}

export function unsplash(id: string, params: UnsplashParams = {}): string {
  const { w = 1200, q = 70, h, fit = "crop" } = params
  const search = new URLSearchParams({
    q: String(q),
    w: String(w),
    auto: "format",
    fit,
  })
  if (h) search.set("h", String(h))
  return `https://images.unsplash.com/photo-${id}?${search.toString()}`
}

export const MEDICAL_IMAGES = {
  /** Building exteriors, wide establishing shots */
  buildings: ["1626315869436-d6781ba69d6e"],
  /** Wards, beds, ICU rooms, admissions */
  wards: [
    "1512678080530-7760d81faba6",
    "1538108149393-fbbd81895907",
    "1580281657702-257584239a55",
  ],
  /** Operating theatre / surgery */
  surgery: [
    "1579684385127-1ef15d508118",
    "1550831107-1553da8c8464",
    "1551190822-a9333d879b1f",
    "1551601651-2a8555f1a136",
    "1551076805-e1869033e561",
  ],
  /** Doctor-patient consultation, clinical interaction */
  consultation: [
    "1631217868264-e5b90bb7e133",
    "1576091160399-112ba8d25d1d",
    "1631815589968-fdb09a223b1e",
    "1638202993928-7267aad84c31",
  ],
  /** Radiology / imaging */
  radiology: ["1666214280391-8ff5bd3c0bf0"],
  /** Laboratory / pathology */
  laboratory: ["1584036561566-baf8f5f1b144"],
  /** Pharmacy / medication */
  pharmacy: ["1587854692152-cbe660dbde88", "1471864190281-a93a3070b6de"],
  /** Supplies / inventory / PPE */
  supplies: ["1584744982491-665216d95f8b"],
  /** Compassionate care / patient portal */
  care: ["1584515933487-779824d29309"],
  /** Generic office / HR / non-clinical staff */
  office: ["1522202176988-66273c2fd55f", "1607990281513-2c110a25bd8c"],
  /** Clean clinical flat-lays for decorative panels (login, empty states) */
  flatlay: ["1584982751601-97dcc096659c"],
  /** Staff reviewing a screen together — used for AI Assistant / digital tooling */
  assistant: ["1531482615713-2afd69097998"],
  /** Individual staff portraits, safe to use as "photo" avatars in featured cards */
  staffPortraits: [
    "1559839734-2b71ea197ec2",
    "1622253692010-333f2da6031d",
    "1622902046580-2b47f47f5471",
    "1594824476967-48c8b964273f",
    "1582750433449-648ed127bb54",
  ],
} as const

/**
 * Deterministic initials-avatar (DiceBear) — used for the hundreds of mock
 * staff/patient records where a real headshot isn't necessary or available.
 * Same seed always renders the same avatar, so mock data stays stable across
 * re-renders without persisting image URLs anywhere.
 */
export function avatarUrl(seed: string, backgroundColor = "2563eb") {
  const search = new URLSearchParams({
    seed,
    backgroundType: "solid",
    backgroundColor,
    fontFamily: "Inter",
    fontWeight: "600",
  })
  return `https://api.dicebear.com/9.x/initials/svg?${search.toString()}`
}

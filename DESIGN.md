# MEROS DESIGN SYSTEM

Read this before building or changing any screen. It replaces the design tokens in SPEC.md section 12. If my reference images arrive later, they refine this system; they do not replace the principles.

---

## 1. The feeling

**"Bioluminescent calm."** Meros should feel like a glimpse of the future of medicine: alive, luminous, three dimensional and precise, but never cold or frightening. People open this app on one of the most emotional days of their lives. The design must feel like a calm, intelligent, private space that glows gently around them.

Three words to test every screen against: **Alive. Calm. Precise.**

* **Alive:** subtle motion everywhere, light that responds to touch, 3D depth in key moments, nothing static or flat.
* **Calm:** generous space, slow easing, soft light, one main action per screen, no alarm colours, no clutter.
* **Precise:** perfect alignment, a strict spacing scale, crisp typography, data shown beautifully and exactly.

---

## 2. What "not vibe coded" means (hard rules)

Never do any of these:
* Default shadcn or Tailwind look left unstyled (grey cards, default borders, default shadows).
* Purple to pink gradients, rainbow gradients, neon, or generic "AI" glow on everything.
* Emoji as icons. Stock illustrations of smiling doctors.
* Inter or system fonts as the only typeface.
* Random spacing values, inconsistent corner radii, more than one style of card.
* Walls of text, centred paragraphs, tiny grey text with poor contrast.
* Spinners. Use skeleton loaders and smooth content reveals instead.
* Empty states that just say "No data". Every empty state gets a designed illustration and a helpful next action.
* Animations that are fast, bouncy or cartoonish.

Always do these:
* Every interactive element has hover, press, focus and disabled states.
* Every screen has a designed loading state, empty state and error state.
* Every number and chart is formatted with care (aligned digits, units, clear labels).
* Everything works in Arabic (RTL) as beautifully as in English, including mirrored layouts and motion direction.

---

## 3. Colour

The signature palette is **burgundy and gold**: deep, classy and warm, with luminous rose light for the "alive" feeling. Two modes. **Night** is the signature mode (immersive, futuristic). **Pearl** is the light mode for daytime and accessibility.

### Night mode
| Token | Value | Use |
|---|---|---|
| --bg-deep | #0B0608 | App background (near black with a wine undertone) |
| --bg-raised | #160C10 | Panels |
| --glass | rgba(255,240,244,0.06) | Glass surfaces |
| --glass-border | rgba(255,220,230,0.12) | Hairline borders |
| --text-primary | #F5EEF0 | Main text |
| --text-secondary | #B7A3A9 | Supporting text |
| --burgundy | #7D1A35 | Brand colour: primary buttons, key surfaces, gradients |
| --burgundy-glow | #C2415F | Luminous burgundy: glows, active states, 3D light |
| --rose-light | #F0A6B8 | Soft highlights, particles, hover light |
| --pearl-gold | #E2C98F | Premium accent for precious moments (consent, reveal, shared gene) |
| --data-cyan | #7FD6E0 | Charts and data only, so numbers stay easy to read |

### Pearl mode
| Token | Value |
|---|---|
| --bg-deep | #F7F1EE |
| --bg-raised | #FFFFFF |
| --glass | rgba(255,255,255,0.7) |
| --text-primary | #1E0E14 |
| --text-secondary | #6B5A60 |
| --burgundy | #7A1630 |
| --burgundy-glow | #A3294A |
| --pearl-gold | #B08A3E |
| --data-cyan | #1C8C9C |

Rules:
* Burgundy is the brand colour, never a warning colour. Risk is never shown in red or alarming tones; risk information uses calm neutral and data tones, with gold for important moments.
* Backgrounds use soft, slow moving burgundy to near black aurora gradients, never flat colour.
* The 3D helix and particles glow in burgundy and rose light, with gold particles for special moments.
* All text must meet WCAG AA contrast in both modes.

## 4. Typography

* **Display (Latin):** Sora. Large, confident headings with tight letter spacing.
* **Body and UI (Arabic and Latin):** Readex Pro. Designed for both scripts, so Arabic and English look like one family.
* **Numbers in data:** tabular figures.
* Type scale (rem): 0.75, 0.875, 1, 1.125, 1.375, 1.75, 2.25, 3, 4. Nothing in between.
* Line length 60 to 75 characters for reading text. Arabic gets slightly larger size and line height.

---

## 5. Space, shape and depth

* Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 only.
* Radius: 12 for controls, 20 for cards, 28 for hero panels, full for pills.
* **Depth system:** three layers. Background (3D scene or soft aurora gradient field), glass layer (frosted panels with backdrop blur 20 to 30px, hairline border, inner highlight on the top edge), and floating layer (primary actions and sheets with soft coloured glow shadows, not grey drop shadows).
* Subtle grain texture overlay (2 to 3% opacity) on backgrounds to avoid flat digital look.

---

## 6. Motion

Use the Motion library (Framer Motion) for UI and React Three Fiber for 3D.

* Easing: smooth and slow, for example cubic-bezier(0.22, 1, 0.36, 1). Durations 300 to 700ms for UI, longer for 3D.
* Screen transitions: content rises gently and fades in, staggered by 40 to 60ms per element.
* Micro interactions: buttons gently brighten and lift on hover, compress slightly on press; cards tilt very subtly toward the pointer (max 4 degrees) with a moving light reflection.
* Numbers count up smoothly when they appear.
* Respect "reduce motion" settings: replace 3D and motion with still, elegant versions.
* Never animate anything that delivers difficult news abruptly. Reveals are slow and gentle.

---

## 7. Signature 3D moments (these make the app feel alive)

Build with React Three Fiber, drei and postprocessing (soft bloom). Lazy load every 3D scene, keep each under 60fps budget on a mid range phone, and provide a static fallback image.

1. **Living Helix (welcome and home):** a slowly rotating DNA double helix made of burgundy and rose light particles, reacting gently to pointer and scroll. Behind the glass interface.
2. **The Reveal (result screen):** the helix unwinds and the particles reform into the user's own carrier result, then settle into the 4 square inheritance grid. Slow, calm, beautiful.
3. **Blind Couple Match:** two luminous orbs, one for each partner, each sealed with a light "lock". When both press their Dual Key, the orbs drift together, and only the shared gene glows gold between them while everything else stays sealed. This visualises the cryptography so judges instantly understand it.
4. **Family Constellation (Family Risk Engine):** relatives appear as stars in a 3D constellation connected by lines of light; brightness shows carrier probability; no names, only relationship labels.
5. **Living Results pulse:** when a variant is reclassified, a soft ripple travels through the user's helix.
6. **Population Signals Dashboard:** an elegant dark map of Abu Dhabi, Al Ain and Al Dhafra with softly glowing regions and animated data flows, plus crisp charts.
7. **Copilot presence:** a small breathing orb of light that pulses with the voice when the Genetic Copilot speaks or listens.

---

## 8. Components

* **Glass Card** (one card style for the whole app), **Primary Button** (luminous, glowing edge), **Secondary Button** (glass), **Ghost Button**, **Pill tags** for the Education / Decision Support / Clinical Advice labels, each with its own subtle colour and icon.
* **Bottom sheet** on mobile for actions; **command palette** on desktop.
* **Charts:** custom styled (Recharts or visx) with thin lines, soft gradients under curves, no default chart styling.
* **Icons:** Phosphor Icons (duotone or light weight), consistently one weight.
* **Avatars** for clinicians: elegant monogram circles, not stock photos.
* **Inputs:** large, glass, floating labels, clear focus glow.

---

## 9. Layout

* Mobile first at 375px, then tablet and desktop. On desktop, a calm left navigation rail and wide content with generous margins.
* One main action per screen, placed where the thumb reaches on mobile.
* Use progressive disclosure: show the essential first, details on request.

---

## 10. Quality bar and process

1. Before building UI, create a `/design-system` page in the app that shows every token, typeface, component and state. Build and refine it first; every screen must use only these components.
2. After each screen, take screenshots at 375px and 1440px in both Night and Pearl and in both Arabic and English, review them against this file, and fix anything that breaks a rule before moving on.
3. Run Lighthouse; keep accessibility above 95 and performance strong despite 3D (lazy loading, compressed assets).
4. Ask yourself on every screen: would this look at home in a premium health product launched by a world class design team? If not, refine it.

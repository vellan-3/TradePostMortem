# ScrollFeatures — Implementation Guide
### Scroll-pinned sticky section replacing the three `.sl-feature-row` blocks

---

## What this does

The outer container is `300vh` tall — three viewport heights. The inner content is `position: sticky; top: 0; height: 100vh` so it pins to the viewport while the outer container scrolls behind it.

A scroll listener maps how far the user has scrolled through the outer container (0–100%) into three equal thirds. Each third corresponds to one feature. When the threshold crosses, the left text animates out and in with the new content. The right mockup image crossfades.

When the user scrolls back up, the same logic runs in reverse — crossing back from third 2 to third 1 shows Verdict again.

---

## Step 1 — Add the file

```bash
# Copy the ScrollFeatures.tsx file into your components folder
cp ScrollFeatures.tsx components/ScrollFeatures.tsx
```

---

## Step 2 — Update LandingPage.tsx

Find this block in `LandingPage.tsx` (lines 281–353):

```tsx
{/* FEATURE ROWS */}
<section className="sl-features">

  {/* VERDICT */}
  <div className="sl-feature-row" id="verdict">
    ...
  </div>

  {/* MIRROR */}
  <div className="sl-feature-row" id="mirror">
    ...
  </div>

  {/* PAYSLIP */}
  <div className="sl-feature-row" id="payslip">
    ...
  </div>

</section>
```

**Delete the entire `<section className="sl-features">` block** and replace it with:

```tsx
import ScrollFeatures from '@/components/ScrollFeatures';

{/* FEATURE ROWS — scroll-pinned */}
<ScrollFeatures />
```

That's the only change to LandingPage.tsx.

---

## Step 3 — Verify your images exist

The component references three images:

```
/public/Verdict.png
/public/Mirror.png
/public/Payslip.png
```

These match what's already in your LandingPage — you're using the same paths. No change needed if the images are already there.

The background grid pattern:

```
/public/background-pattern.svg
```

Also already used in your `.sl-features::before`. Same path.

---

## Step 4 — Check that sl-badge classes are reachable

The `ScrollFeatures` component uses `sl-badge`, `sl-badge-v`, `sl-badge-m`, `sl-badge-p` and `sl-mockup`, `sl-mockup-dots`, `sl-dot`, `sl-mockup-img`, `sl-mockup-img-v/m/p` — all classes defined in your `LandingPage.tsx` CSS string.

Because `ScrollFeatures` is rendered inside `LandingPage`, and the `<style>` tag from LandingPage is injected into the document, these classes will be available to `ScrollFeatures` children. Nothing to change.

---

## Step 5 — How the scroll math works

```
Outer container: height = 300vh

When scrolled:
  p = 0.00 – 0.33  →  active = 0  (VERDICT)
  p = 0.33 – 0.66  →  active = 1  (MIRROR)
  p = 0.66 – 1.00  →  active = 2  (PAYSLIP)

p is calculated as:
  scrolled = -(outerEl.getBoundingClientRect().top)
  scrollable = outerEl.height - window.innerHeight
  p = scrolled / scrollable   (clamped 0–1)
```

When `p` crosses a threshold, there's a 180ms delay before switching `active`. During that 180ms, the image is in its `out` state (opacity 0, scale 0.97). After the switch, image transitions to `in` (opacity 1, scale 1) and the text re-mounts with CSS animations.

---

## Step 6 — The text animation system

The left text column re-mounts when the feature changes by changing `key={textKey}`. This causes React to destroy and recreate the DOM node, which re-triggers the CSS `@keyframe` animations from the start.

Stagger sequence on each feature change:
- Badge: `sf-badge-in` at 0ms
- Title: `sf-title-in` at 40ms delay
- Line 1: `sf-line-in` at 80ms delay
- Line 2: `sf-line-in` at 150ms delay
- Line 3: `sf-line-in` at 220ms delay

Each element slides up 10–14px from below and fades in. The title also has a `blur(4px) → blur(0)` transition which gives it extra weight.

---

## Step 7 — The scroll hint

At the bottom of the sticky area there's a "Scroll to explore" label with a down arrow. It fades out 2 seconds after appearing via CSS animation. It's positioned at `bottom: calc(100vh - 40px)` which puts it at the bottom of the first viewport — visible when the user first lands on the section.

---

## What the user experiences

**Scrolling down:**

1. User scrolls past the "How it works" section
2. The features section outer container begins scrolling into view
3. The sticky inner pins — VERDICT content is visible
4. User continues scrolling — nothing moves for one full viewport height. The scroll hint fades
5. At 33% through the section, VERDICT fades out of the text, MIRROR content fades in with staggered animation. The mockup image crossfades
6. User continues scrolling — another full viewport height with MIRROR pinned
7. At 66%, PAYSLIP content replaces MIRROR
8. At 100%, the outer container leaves the viewport and the section below scrolls up as normal

**Scrolling back up:**

Everything runs in reverse. The same threshold logic applies — crossing back from PAYSLIP to MIRROR to VERDICT shows the correct content each time.

---

## Mobile behavior

On screens below 900px:

- `sf-outer` drops `height: 300vh` (overridden to `auto`)
- `sf-sticky` drops `position: sticky` (overridden to `relative`)
- The three features render stacked vertically, one below another, at full width
- No scroll pinning, no JS interaction
- The CSS animations still fire on mount for each feature block

This is the right trade-off — scroll pinning on a narrow touch screen is a frustrating experience.

---

## If the section is not sticking

Check that `.sl-page` (the parent in LandingPage) does not have `overflow: hidden` or `overflow: auto`. Sticky positioning only works when no ancestor between the sticky element and the scroll container has `overflow` set to anything other than `visible`.

Your current `.sl-page` has no overflow rule, so this should work as-is. If you've added any overflow rules elsewhere, remove them from the ancestors of `ScrollFeatures`.

---

## Adjusting the scroll speed (how long each feature holds)

The section is `300vh`. Each feature gets exactly `100vh` of scroll distance. To make features hold longer, increase the total height:

```tsx
// In ScrollFeatures.tsx, STYLES:
.sf-outer {
  height: 400vh;  // 4vh total → each feature gets ~133vh
}
```

The math self-adjusts — `p` is always calculated from the actual scrollable distance.

---

*ScrollFeatures.tsx — drop-in replacement for the three sl-feature-row blocks*
*No external dependencies beyond React*


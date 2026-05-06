# SLIP Design System

## Purpose
This file is the source of truth for SLIP's landing-page UI system.

It is based on:
- the current SLIP landing page implementation
- every `.html`, `.css`, and `.md` reference inside `Design Html md`
- the existing SLIP feature model: `VERDICT`, `MIRROR`, `PAYSLIP`

This document is not a redesign from scratch. It is a consolidation of what SLIP already is, with implementation rules that keep the system coherent as the product grows.

---

## Reference Audit
The design references consistently point to the same high-level patterns:

- `Framer`, `Linear`, `Runway`, `Warp`, `Cursor`, `Raycast`
  - strong display typography
  - cinematic rhythm
  - dark premium surfaces
  - product mockups framed as hero objects

- `Miro`, `Intercom`, `Cal.com`, `Cohere`
  - clear product explanation
  - generous content spacing
  - readable information hierarchy
  - simple, obvious interaction surfaces

- `Supabase`, `ClickHouse`, `Spotify`, `Ollama`, `Lovable`
  - brand-first color discipline
  - card-driven presentation
  - tight component systems
  - repeatable spacing and radius scales

Across all of them, the repeated lesson is:
- one dominant atmosphere
- one clear display font voice
- one UI font voice
- one spacing system
- one card system
- very limited accent colors

That matches SLIP best when treated as:
- black cinematic canvas
- electric blue as the primary brand action
- red, blue, and purple as product-state accents
- oversized editorial hero typography
- framed product screenshots
- minimal but deliberate glass and glow

---

## SLIP Brand Direction

### Brand Personality
SLIP should feel like:
- forensic
- premium
- confrontational but clean
- emotionally sharp, not noisy
- modern Solana-native without looking like generic crypto UI

### Product Narrative
The landing page is structured around a time-based intelligence arc:

1. `VERDICT`
   Before the trade
2. `MIRROR`
   During the trade
3. `PAYSLIP`
   After the trade

That sequence is the backbone of the design system. The UI should always reinforce those three stages instead of behaving like unrelated sections.

---

## Core Visual Rules

### 1. Atmosphere
- Base canvas is true black or near-black.
- White text is the dominant foreground.
- Blue is the only primary action color.
- Red and purple are reserved for product-role accents, not generic decoration.
- Background effects must feel atmospheric, not busy.

### 2. Typography Split
- `Syne` is the brand and display voice.
- `Instrument Sans` is the system and reading voice.
- `Space Mono` is the utility and signal voice.

Use them with discipline:
- `Syne`: hero lines, major numeric emphasis, wordmarks, strong CTA labels where needed
- `Instrument Sans`: nav, descriptions, labels, card copy, section headings where clarity matters
- `Space Mono`: small pills, metadata, brows, signal text

### 3. Shape Language
- rounded cards, never sharp-cornered enterprise boxes
- pill controls for navigation and compact filters
- large framed product windows
- glows and gradients only where they support focus

### 4. Density
- hero and section headlines are oversized and compressed
- body copy stays narrow and readable
- sections should breathe vertically
- cards should feel intentional, not crowded

---

## Color System

### Primary Tokens
- `--slip-bg`: `#000000`
- `--slip-fg`: `#FFFFFF`
- `--slip-fg-muted`: `rgba(255,255,255,0.70)`
- `--slip-fg-soft`: `rgba(255,255,255,0.60)`
- `--slip-divider`: `rgba(255,255,255,0.25)`

### Brand
- `--slip-blue`: `#3B82F6`
- `--slip-blue-dark`: `#234C90`

### Product Accents
- `--slip-verdict`: `#FF3232`
- `--slip-verdict-bg`: `rgba(255, 50, 50, 0.20)`
- `--slip-mirror`: `#3B82F6`
- `--slip-mirror-bg`: `rgba(59, 130, 246, 0.25)`
- `--slip-payslip`: `#8B5CF6`
- `--slip-payslip-bg`: `rgba(139, 92, 246, 0.25)`

### Surfaces
- `--slip-surface-0`: `#000000`
- `--slip-surface-1`: `#111111`
- `--slip-surface-2`: `#1A1A1A`
- `--slip-surface-glass`: `rgba(255,255,255,0.05)`
- `--slip-surface-stroke`: `rgba(255,255,255,0.10)`

### Effects
- CTA gradient:
  - `linear-gradient(180deg, #3B82F6 20%, #234C90 80%)`
- mockup background:
  - `linear-gradient(180deg, #000000 10%, #1A1A1A 100%)`
- footer glow colors:
  - blue, red, purple only

### Color Usage Rules
- Blue is for action.
- Red is for `VERDICT`, danger, caution, negative tension.
- Purple is for `PAYSLIP`, reflection, post-trade intelligence.
- Never add extra accent families unless they map to a real product meaning.

---

## Typography System

### Display
- Font: `Syne`
- Weight: `800`
- Use for:
  - hero headline
  - major numeric stats
  - wordmark
  - occasional high-emphasis CTA text

Recommended scale:
- Hero XL: `128px–144px`
- Hero L: `96px–112px`
- Stat: `52px`
- Wordmark XXL: `200px–550px`

Display rules:
- tight line-height
- negative tracking
- very short line stacks

### UI / Reading
- Font: `Instrument Sans`
- Weight range: `400–700`
- Use for:
  - section titles
  - paragraphs
  - nav text
  - CTA body labels
  - footer links

Recommended scale:
- Section title: `48px–52px`
- Feature title: `52px`
- Body L: `20px`
- Body M: `16px`
- Nav: `14px`
- Micro label: `10px–12px`

### Signal / Utility
- Font: `Space Mono`
- Use for:
  - eyebrow text
  - pills
  - categorization labels
  - scroll hints

Rules:
- uppercase
- letter-spaced
- low-frequency usage

---

## Spacing System

Base rhythm should stay on an 8px logic.

### Core Scale
- `4`
- `8`
- `12`
- `16`
- `24`
- `32`
- `40`
- `48`
- `64`
- `80`
- `96`
- `120`

### Section Rhythm
- page stack gap: `80px`
- major section padding: `80px–144px`
- card interior padding: `24px–72px`
- mockup-to-copy gap: `64px–128px`

### Layout Rule
If a section feels off, fix it by returning it to the spacing system, not by adding random one-off pixel nudges.

---

## Radius System
- micro: `8px`
- card: `20px–26px`
- button: `18px–24px`
- pill: `999px`

Rules:
- product windows should feel rounded but substantial
- buttons can be softer than cards
- pills should always read as pills, not rounded rectangles pretending to be pills

---

## Component System

### 1. Top Navigation
Purpose:
- anchor the three-stage product model
- give a single wallet action
- stay visually lightweight over the hero

Rules:
- centered shell
- glass backdrop only when scrolled
- nav items grouped as a pill family
- wallet button is the only hard action
- avoid mixing too many visual treatments inside the nav

### 2. Hero
Purpose:
- instantly explain SLIP's emotional promise

Required structure:
- logo and nav over image frame
- eyebrow
- two-line or split-line display statement
- short explanatory body
- one primary CTA

Rules:
- headline is the focal point, not the CTA
- body copy should stay narrow
- background image should feel cinematic, not illustrative

### 3. How-It-Works Intro
Purpose:
- bridge hero into the product model

Rules:
- simple pill + statement
- no extra visual noise
- acts as a pacing break before the product sequence

### 4. Feature Sequence
Purpose:
- explain `VERDICT`, `MIRROR`, `PAYSLIP` as a continuous system

Rules:
- each state gets:
  - badge
  - title
  - 2–3 lines of explanation
  - framed screenshot
- screenshots should be aligned as a family
- copy widths should remain consistent across all three

### 5. “What Sets SLIP Apart”
Purpose:
- contrast SLIP against generic transaction tools

Rules:
- two-card comparison system
- one problem card
- one solution card
- both cards share the same geometry and spacing

### 6. Stats Strip
Purpose:
- fast credibility layer

Rules:
- numbers in `Syne`
- labels in `Instrument Sans`
- equal spacing across all stat items

### 7. CTA Block
Purpose:
- close the story and point into the app

Rules:
- simple message
- one dominant action
- minimal secondary content

### 8. Footer
Purpose:
- brand closure, not utility overload

Rules:
- oversized wordmark
- sparse grouped links
- glow kept soft and wide

---

## Motion Principles
SLIP should move with intent, not decoration.

### Motion Style
- smooth
- slightly heavy
- minimal bounce
- fades and crossfades over flashy transforms

### Recommended Usage
- hero content fade/settle
- card reveal
- section transition
- screenshot crossfade
- nav backdrop appearance on scroll

### Avoid
- overly springy movement
- playful hover gimmicks
- constant floating animations
- too many simultaneous glows or parallax layers

---

## Landing Page Implementation Rules
This is the part that fixes the current implementation direction without changing the product identity.

### 1. Single Source of Truth
Content for:
- nav items
- feature stages
- stats
- footer groups

should live in shared data structures, not duplicated across multiple components.

### 2. Shared Tokens
The landing page should use one token layer for:
- colors
- type roles
- spacing
- radii
- shadows

Do not hardcode the same values repeatedly across unrelated sections.

### 3. Shared Section Primitives
Landing sections should be built from repeatable primitives:
- shell / container
- heading block
- badge
- framed mockup
- card
- stat item

### 4. Limit Inline Styling
Inline styles should be reserved for:
- rare computed values
- dynamic states that truly need runtime styling

They should not be the primary styling system for structural layout.

### 5. Consistent Screenshot Framing
All feature mockups should use:
- one frame treatment
- one border logic
- one shadow logic
- one internal crop logic

The screenshots can differ, but the containers should feel like one family.

### 6. Product-Stage Semantics
The three feature sections must always preserve this identity:
- `VERDICT` = red / before
- `MIRROR` = blue / during
- `PAYSLIP` = purple / after

This mapping should be treated as a product rule, not just a visual choice.

---

## What to Keep From the Current Landing
These parts are already directionally correct and should remain the base:
- black cinematic canvas
- `Syne` for major hero emphasis
- electric blue primary CTA
- framed hero background
- three-stage product storytelling
- large screenshot cards
- footer glow treatment

---

## What to Fix in Future UI Work
When implementing or refactoring the landing page later, the target is:
- fewer one-off layout values
- fewer duplicated strings between sections
- fewer mixed visual strategies in the same area
- stronger token reuse
- clearer component primitives
- one consistent design-language source of truth

The design itself does not need a total reinvention.
The implementation needs to become systemized.

---

## Final SLIP UI Position
SLIP should sit at the intersection of:
- Framer's theatrical dark presentation
- Linear's precision and restraint
- Warp's atmosphere
- Cursor's editorial clarity
- Miro and Intercom's explanatory structure

But the final identity should still feel unmistakably SLIP:
- harshly honest
- premium
- readable
- dark
- product-first
- Solana-native without meme clutter

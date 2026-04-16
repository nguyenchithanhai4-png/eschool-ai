```markdown
# Design System Document

## 1. Overview & Creative North Star
**The Creative North Star: "The Intelligent Canvas"**

This design system moves beyond the rigid, utilitarian nature of traditional EdTech platforms to create an experience that feels like a premium digital concierge. We are not just building an interface; we are crafting an "Intelligent Canvas"—a space where information breathes, and hierarchy is felt through tonal depth rather than structural constraints.

By blending the friendly, accessible DNA of Google’s visual language with a sophisticated editorial layout, we create a "High-End Editorial" experience. We break the standard "box-in-a-box" template by utilizing intentional asymmetry, overlapping layers, and high-contrast typography scales. The result is a platform that feels authoritative yet approachable, professional yet vibrant.

---

## 2. Colors & Surface Philosophy

### The Palette
We utilize a sophisticated Material 3-inspired palette that grounds the vibrant brand colors in a range of functional neutrals.
- **Primary (`#0058bd`):** Our core brand blue, used for high-importance actions and brand presence.
- **Secondary (`#006e2c`):** Used for progress, success states, and growth-oriented features.
- **Tertiary (`#b51b15`):** Reserved for critical focus points and accents.
- **Background (`#f7fafd`):** A cool-tinted white that reduces eye strain compared to pure `#FFFFFF`.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To achieve a premium, seamless look, boundaries must be defined solely through background color shifts or tonal transitions.
- Instead of a `1px` border, place a `surface-container-low` section against the main `surface` background.
- Use whitespace as a structural element to define the start and end of content blocks.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine, matte paper.
- **Level 1 (Base):** `surface` (`#f7fafd`)
- **Level 2 (In-page Containers):** `surface-container-low` (`#f1f4f7`)
- **Level 3 (Interactive Cards):** `surface-container-lowest` (`#ffffff`)
- **Level 4 (Floating Elements):** `surface-container-high` (`#e5e8ec`)

### The "Glass & Gradient" Rule
To escape the "flat" look, use glassmorphism for floating elements (like navigation bars or hovering menus). Use `surface` colors at 80% opacity with a `20px` backdrop-blur. 
**Signature Textures:** For Hero sections and primary CTAs, use a subtle linear gradient from `primary` (`#0058bd`) to `primary-container` (`#2771df`) to add "soul" and depth.

---

## 3. Typography
Our typography pairing balances the geometric authority of **Plus Jakarta Sans** with the highly readable, functional nature of **Inter**.

*   **Display & Headlines (Plus Jakarta Sans):** Used for large-scale storytelling and page titles. The generous x-height and modern curves feel "EdTech forward."
    *   *Display-LG (3.5rem):* For hero statements only.
    *   *Headline-MD (1.75rem):* For section titles.
*   **Body & Titles (Inter):** Used for all functional reading and UI labels. Inter provides the "Trustworthy" pillar of the system.
    *   *Title-MD (1.125rem):* For sub-headings and card titles.
    *   *Body-LG (1rem):* Standard reading text.
    *   *Label-SM (0.6875rem):* Used for micro-copy and metadata.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved by "stacking" the surface-container tiers. For example, a `surface-container-lowest` (pure white) card sitting on a `surface-container-low` section creates a soft, natural lift without the clutter of a stroke.

### Ambient Shadows
Shadows must be "felt, not seen." 
- **Specification:** Use extra-diffused blur values (20px to 40px) with low opacity (4%–8%). 
- **Tinting:** The shadow color should never be pure black. Use a tinted version of `on-surface` (`#181c1f`) to mimic natural ambient light.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., in a high-density data table), use a "Ghost Border": the `outline-variant` token (`#c2c6d5`) at 15% opacity. **100% opaque, high-contrast borders are strictly forbidden.**

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), `full` roundedness. No shadow.
- **Secondary:** `surface-container-highest` background with `on-surface` text.
- **Tertiary:** Text-only with an `on-primary-fixed-variant` color. 

### Cards & Lists
- **The Rule of Zero Lines:** Forbid divider lines. Separate list items using `8px` of vertical whitespace or a 1-step background color shift on hover.
- **Interactive Cards:** Use `xl` (1.5rem) corner radius. On hover, shift from `surface-container-lowest` to `surface-bright` with an ambient shadow.

### Input Fields
- **Styling:** Use `surface-container-low` as the field background.
- **States:** No border in default state. On focus, use a `2px` "Ghost Border" of the `primary` color and a subtle `surface-tint` glow.

### Additional EdTech Components
- **Progress Halo:** Use the `secondary` green for a circular progress indicator with a `surface-variant` track.
- **The Mentor Badge:** A small, floating glassmorphic tag using `primary-fixed` background to highlight expert-led content.

---

## 6. Do's and Don'ts

### Do
- **Use Intentional Asymmetry:** Align text to the left but allow imagery to bleed off the right edge of the grid to create a "custom editorial" feel.
- **Embrace Whitespace:** If a layout feels "busy," increase the spacing between sections by two increments on the scale.
- **Nesting:** Always place lighter containers on darker backgrounds to simulate light hitting a surface.

### Don't
- **Don't use 1px Dividers:** Use background shifts or space.
- **Don't use pure Black (#000):** Use `on-surface` (`#181c1f`) for text to maintain a premium, soft-contrast look.
- **Don't use sharp corners:** Every interactive element must have at least a `md` (0.75rem) radius.
- **Don't crowd the content:** Ensure a "breathing room" margin of at least `32px` around critical text blocks.

---
*This design system is a living framework. It is intended to guide the creation of intuitive, beautiful, and educationally impactful experiences.*```
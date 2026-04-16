# Design System Document

## 1. Overview & Creative North Star

This design system is anchored by the Creative North Star: **"The Synthesized Void."** 

Unlike traditional "Dark Mode" interfaces that simply invert a white layout, this system treats the screen as a limitless, high-fidelity vacuum where intelligence is manifested through light and precision. It moves away from the "boxed-in" nature of standard web templates, favoring a bespoke, editorial feel that emphasizes AI-driven fluidity. 

The aesthetic is defined by intentional asymmetry, expansive negative space, and a rhythmic dot-grid texture that suggests a digital canvas for creation. We break the rigid grid by allowing elements to breathe, overlap, and transition through tonal depth rather than structural borders. Every pixel must feel intentional, premium, and sophisticated.

---

## 2. Colors

The color palette is built on a foundation of deep, obsidian neutrals punctuated by stark, high-contrast whites and refined grays.

### Tonal Strategy
*   **Primary (#ffffff):** Not just a color, but a source of light. Use sparingly for high-impact typography and primary actions.
*   **Surface Foundation (#121318):** The base "Void." All layouts begin here.
*   **Neutral Accents (#c4c7ca, #8e9192):** Used for secondary information and supporting metadata to maintain a clear hierarchy.

### The "No-Line" Rule
**Strict Prohibition:** Designers are prohibited from using 1px solid borders to define sections or containers. Boundary definition must be achieved exclusively through:
1.  **Background Shifts:** Transitioning from `surface` to `surface_container_low`.
2.  **Vertical Spacing:** Using generous white space to imply grouping.
3.  **Tonal Transitions:** A subtle change in surface depth to indicate a new functional area.

### The Glass & Gradient Rule
To achieve a "signature" feel, floating elements (modals, dropdowns, or hovering toolbars) should employ **Glassmorphism**. Use `surface_container` with a 60-80% opacity and a high `backdrop-blur` (20px+). 
Main CTAs or hero elements may utilize a subtle linear gradient from `primary` to `secondary_fixed_dim` to add "soul" and a sense of metallic precision that flat hex codes cannot provide.

---

## 3. Typography

The typography utilizes **Inter** to convey a clean, technical, yet authoritative voice. 

*   **Display Scales (`display-lg` to `display-sm`):** Reserved for core value propositions. These should feature tight letter-spacing (-0.02em) to feel cohesive and "impactful."
*   **Headline & Title Scales:** Used to anchor sections. These provide the editorial "voice" of the interface.
*   **Body Scales:** Optimized for readability. Use `body-lg` (1rem) for primary descriptions with generous line-height (1.6) to ensure the layout feels premium and unhurried.
*   **Label Scales:** The "Technical" layer. Use these for AI metadata, micro-copy, and status indicators.

Hierarchy is maintained through massive scale shifts. A `display-lg` headline should often be paired with a `label-md` sub-header to create a sophisticated, high-contrast visual tension.

---

## 4. Elevation & Depth

In this system, depth is a product of light and layering, not artificial construction.

### The Layering Principle
Depth is achieved by stacking the `surface-container` tiers. 
*   **Base:** `surface` (#121318)
*   **Sectioning:** `surface_container_low` (#1a1b20)
*   **Interaction Containers:** `surface_container_high` (#292a2f)

By placing a higher-tier container on a lower-tier background, you create a natural "lift" that mimics physical layers of fine paper.

### Ambient Shadows
For floating elements, shadows must be "Atmospheric." 
*   **Blur:** Large (32px to 64px).
*   **Opacity:** Ultra-low (4% to 8%).
*   **Tint:** Use the `on_surface` color (#e3e2e9) for the shadow tint rather than pure black, ensuring the shadow feels like a natural light occlusion in a dark environment.

### The "Ghost Border" Fallback
If accessibility requirements demand a container boundary, use a **Ghost Border**. Apply the `outline_variant` token at **15% opacity**. 100% opaque borders are strictly forbidden as they interrupt the fluidity of "The Void."

---

## 5. Components

### Buttons
*   **Primary:** Pill-shaped (`rounded-full`). Background: `primary` (#ffffff). Text: `on_primary` (#2f3131). 
*   **Secondary:** Pill-shaped. Background: `secondary_container` (#44474a). Text: `on_secondary` (#2d3133).
*   **Tertiary (Ghost):** No background. Text: `primary`. Subtle hover state using `surface_bright` at 10% opacity.

### Input Fields
*   **Styling:** Use `surface_container_high` for the field background. 
*   **Rounding:** `rounded-md` (1.5rem) or `rounded-lg` (2rem) to match the "soft-modern" aesthetic.
*   **Interaction:** Focus states should use the "Ghost Border" at 40% opacity rather than a heavy solid line.

### Cards & Lists
*   **Rule:** Divider lines are prohibited. 
*   **Separation:** Use a shift from `surface_container_low` to `surface_container_highest` to distinguish list items or cards.
*   **Contextual Action Bar:** As seen in the reference, floating action bars should use `rounded-full` and a glassmorphism effect to feel "detached" from the grid.

### AI Prompt Bar
A signature component. This should be a large, `rounded-xl` (3rem) container using `surface_container_lowest`. It houses pill-shaped toggles and a minimalist text input, creating a centralized "Command Center" feel.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use the dot grid pattern as a subtle background texture to provide scale and "grit."
*   **Do** embrace extreme asymmetry; center-align a headline while left-aligning the body text to create editorial interest.
*   **Do** prioritize "Breathing Room." If you think there is enough margin, double it.
*   **Do** use `rounded-full` for all interactive triggers to maintain the "pill" language of the brand.

### Don't:
*   **Don't** use pure black (#000000). Always use the `surface` token (#121318) to keep the dark tones sophisticated and "ink-like."
*   **Don't** use 1px dividers or solid borders. They shatter the illusion of a seamless digital void.
*   **Don't** crowd elements. This system is designed for "High-End AI," which requires a feeling of effortless power.
*   **Don't** use standard "drop shadows." Use the Ambient Shadow guidelines to maintain the premium, soft-focus aesthetic.
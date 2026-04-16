# Design System Specification: The Academic Curator

## 1. Overview & Creative North Star
The "Academic Curator" is a design system built to transcend the utilitarian clutter typically found in educational software. Our Creative North Star is **"Sophisticated Clarity."** We treat school data not as a series of spreadsheets, but as a premium editorial experience.

By moving away from traditional rigid tables and boxy containers, we embrace a "Bento-Grid" philosophy that prioritizes intentional asymmetry and rhythmic white space. The goal is to make school administrators feel like they are navigating a high-end publication rather than a database. We achieve this through tonal layering, glassmorphism, and the total elimination of structural "lines" in favor of environmental depth.

---

## 2. Color & Surface Philosophy
The palette is rooted in a "High-Value Light Mode" aesthetic. We utilize a range of tonal whites and slates to create a sense of calm authority.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Boundaries must be established through:
1.  **Background Shifts:** Transitioning from `surface` (#f7f9fb) to `surface-container-low` (#f2f4f6).
2.  **Tonal Nesting:** Placing a `surface-container-lowest` (#ffffff) card on a `surface-container` (#eceef0) background.

### Surface Hierarchy & Layering
Treat the UI as a series of physical layers of fine stationery and frosted glass.
*   **Base Layer:** `background` (#f7f9fb) – The canvas.
*   **Section Layer:** `surface-container-low` (#f2f4f6) – To group related bento-blocks.
*   **Object Layer:** `surface-container-lowest` (#ffffff) – Used for primary content cards and data modules.
*   **Accent Layer:** `primary-container` (#2771df) – Used sparingly for active states or "Hero" data points.

### The "Glass & Gradient" Rule
To elevate the "E-School AI" brand, floating navigation elements and modal overlays must utilize **Glassmorphism**.
*   **Token:** `surface-container-lowest` at 80% opacity.
*   **Effect:** `backdrop-blur: 20px`.
*   **Signature Texture:** Primary CTAs should use a subtle linear gradient from `primary` (#0058bd) to `primary-container` (#2771df) at a 135-degree angle to add "soul" and depth.

---

## 3. Typography: Editorial Authority
We use **Inter** exclusively. The system relies on a high-contrast scale to ensure a clear hierarchy in data-heavy environments.

*   **Display (lg/md):** Used for "At-a-Glance" metrics (e.g., total enrollment numbers). Set to `font-weight: 700` with `-0.02em` letter spacing to feel "tight" and professional.
*   **Headline (sm/md):** Used for section titles. These should always sit on `surface` backgrounds to act as anchors.
*   **Body (md/lg):** The workhorse. Use `on-surface-variant` (#424753) for secondary body text to reduce visual vibration and eye strain during long-winded administrative tasks.
*   **Labels:** Always uppercase with `+0.05em` letter spacing when used for metadata or category tags to distinguish them from interactive text.

---

## 4. Elevation & Depth
In this system, depth is a functional tool, not a decoration.

*   **Tonal Layering:** Avoid shadows for static cards. Instead, use the difference between `#ffffff` (card) and `#f2f4f6` (background).
*   **Ambient Shadows:** For "floating" elements (modals, dropdowns), use a custom shadow: `0px 20px 40px rgba(0, 88, 189, 0.06)`. Note the blue tint in the shadow—this connects the element to the brand's primary color, mimicking natural refraction.
*   **The Ghost Border:** If high-contrast environments require containment (e.g., a white card on a white background in a print view), use `outline-variant` (#c2c6d5) at **15% opacity**.

---

## 5. Components

### The Bento-Cards
*   **Shape:** Use `rounded-xl` (1.5rem) for main dashboard modules.
*   **Spacing:** Content within cards should follow a generous `2rem` (32px) padding to allow data to "breathe."
*   **Interaction:** On hover, a card should shift from `surface-container-lowest` to a subtle 4% opacity shadow. No scale-up; keep it stable and premium.

### Buttons
*   **Primary:** Gradient of `primary` to `primary-container`. `rounded-md` (0.75rem). No border.
*   **Secondary:** `surface-container-high` background with `on-surface` text. This feels integrated into the layout.
*   **Tertiary:** Ghost style. `on-primary-fixed-variant` text.

### Input Fields
*   **Style:** Minimalist. `surface-container-highest` background. No border.
*   **Focus State:** A 2px "Ghost Border" of `primary` at 40% opacity.
*   **Error State:** `error` (#ba1a1a) text with a `error-container` (#ffdad6) background shift.

### Lists & Data Tables
*   **Rule:** Forbid 1px horizontal dividers.
*   **Separation:** Use alternating row colors (`surface` and `surface-container-low`) or 8px vertical spacing between transparent row containers.
*   **Leading Elements:** Use `primary-fixed` (#d8e2ff) circular backgrounds for icons to create soft focal points.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts. A large bento-box next to two smaller stacked ones creates a "Custom Editorial" feel.
*   **Do** use `tertiary` (#8f4a00) for "Attention Required" states—it feels more sophisticated than a standard orange or yellow.
*   **Do** leverage `surface-bright` for the main sidebar to distinguish navigation from the content canvas.

### Don't
*   **Don't** use black (#000000) for text. Always use `on-surface` or `slate-900` to maintain the premium "ink-on-paper" look.
*   **Don't** use standard 4px or 8px corners. Lean into the `lg` (1rem) and `xl` (1.5rem) tokens to maintain the "soft" brand personality.
*   **Don't** clutter a single view. If a dashboard feels "data-rich but cluttered," increase the padding between bento-blocks to `1.5rem` and remove one level of hierarchy.
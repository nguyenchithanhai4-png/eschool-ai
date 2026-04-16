# Design System Specification: The Ethereal Intelligence

## 1. Overview & Creative North Star
**The Creative North Star: "The Digital Luminary"**

This design system moves away from the rigid, boxed-in layouts of traditional EdTech to create an environment that feels like a high-performance command center. We are not building a digital textbook; we are building an intelligent co-pilot. 

The aesthetic strategy leverages **Atmospheric Depth**. By combining high-contrast typography with deep, tonal layering and glassmorphism, we create an interface that feels infinite yet focused. We break the "template" look by utilizing intentional asymmetry—where large display type creates a focal point, and overlapping glass containers suggest a multi-dimensional workspace. The interface doesn't just sit on the screen; it glows within it.

---

## 2. Colors & Surface Logic

Our palette is rooted in the deep void of space, punctuated by neon-infused intelligence.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be achieved through **Background Color Shifts**. For example, a `surface-container-low` module should sit atop a `background` floor. If separation is needed, use white space or a subtle transition in tonal value.

### Surface Hierarchy & Nesting
Depth is built through a "Stack of Glass" philosophy. Instead of flat grids, use the `surface-container` tiers to define importance:
*   **Base Layer:** `surface` (#060e20)
*   **Secondary Sectioning:** `surface-container-low` (#091328)
*   **Primary Interactive Cards:** `surface-container` (#0f1930)
*   **High-Impact Overlays:** `surface-container-highest` (#192540)

### The "Glass & Gradient" Rule
Floating elements (modals, dropdowns, navigation) must utilize **Glassmorphism**. 
*   **Formula:** `surface-variant` at 60% opacity + `backdrop-blur: 24px`.
*   **Signature Texture:** Use a linear gradient for primary actions: `primary` (#8ff5ff) to `primary-container` (#00eefc) at a 135° angle. This adds a "lithic" glow that flat colors cannot replicate.

---

## 3. Typography

The type system balances the technical precision of *Inter* with the architectural character of *Space Grotesk*.

| Level | Token | Font Family | Size | Weight / Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Space Grotesk | 3.5rem | Bold; Editorial headlines, Hero sections. |
| **Headline** | `headline-md` | Space Grotesk | 1.75rem | Medium; Module titles, Dashboard widgets. |
| **Title** | `title-lg` | Inter | 1.375rem | Semi-bold; Card headings, Modal titles. |
| **Body** | `body-lg` | Inter | 1rem | Regular; Primary reading text. |
| **Label** | `label-md` | Inter | 0.75rem | Medium; Metadata, micro-copy. |

**Editorial Intent:** Use `display-lg` with tight letter-spacing (-0.02em) to create an authoritative, "cutting-edge" feel. Contrast this with generous line-height (1.6) in `body-lg` for maximum readability in learning contexts.

---

## 4. Elevation & Depth

### The Layering Principle
Forget drop shadows for standard UI elements. Achieve lift by stacking:
1.  **Level 0:** `surface` (The Floor)
2.  **Level 1:** `surface-container-low` (The Foundation)
3.  **Level 2:** `surface-container` (The Content Card)

### Ambient Shadows
When an element must float (e.g., a floating action button or active modal), use **Ambient Shadows**:
*   **Color:** Use a 10% opacity version of `primary` (#8ff5ff) rather than black.
*   **Blur:** 40px to 60px.
*   **Spread:** -5px. This creates a soft, colored "aura" rather than a harsh shadow.

### The "Ghost Border" Fallback
Where accessibility requires a border, use a **Ghost Border**: `outline-variant` (#40485d) at **15% opacity**. It should be barely perceptible, acting more like a "light catch" on the edge of a glass pane.

---

## 5. Components

### Buttons (High-Performance Triggers)
*   **Primary:** Gradient from `primary` to `primary-dim`. Large radius (`xl`: 3rem). Internal glow: 1px inner-shadow using `on-primary` at 20% opacity.
*   **Secondary:** `surface-container-highest` background with a `primary` Ghost Border.
*   **Hover State:** Scale element by 1.02% and increase the intensity of the gradient or blur.

### Adaptive Cards
*   **Constraint:** No dividers. Use `spacing-md` (1.5rem) to separate internal groups.
*   **Visuals:** Large rounded corners (`lg`: 2rem). Use a 3D-like icon in the top-right corner with a soft `secondary` (#ac8aff) glow.

### Input Fields
*   **Default:** `surface-container-low` background. No border.
*   **Active:** Transition background to `surface-container-high`. Add a "Glow Border" using the `primary` token at 30% opacity.
*   **Typography:** Labels use `label-md` in `on-surface-variant`.

### Learning Progress Indicators
*   Instead of standard bars, use **Concentric Rings** or **Glow-Lines**. A glow-line uses a 2px stroke of `tertiary` (#ec63ff) with a 10px blur of the same color underneath it to simulate a neon fiber-optic thread.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. Let a headline hang off the left grid edge slightly to create a sense of motion.
*   **Do** use `backdrop-blur` generously on any element that overlaps another.
*   **Do** use `tertiary` (#ec63ff) sparingly as a "Discovery" color—for AI insights or new features.

### Don't
*   **Don't** use 100% opaque borders or dividers. They shatter the "Digital Luminary" immersion.
*   **Don't** use pure black (#000000) for backgrounds. Stick to the deep navy of `background` (#060e20) to maintain depth.
*   **Don't** use standard "system" icons. Use 3D-styled or multi-tone SVG icons that utilize the `secondary` and `primary` palettes.

### Accessibility Note
While we are chasing a futuristic aesthetic, ensure `on-surface` (#dee5ff) is used for all primary body text to maintain a high contrast ratio against the dark backgrounds. Ghost Borders should never be the *only* indicator of a hit area.
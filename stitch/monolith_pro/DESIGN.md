# Design System Specification: The Architectural Workspace

## 1. Overview & Creative North Star
**Creative North Star: "The Disciplined Canvas"**

This design system moves beyond the generic "SaaS dashboard" by treating data as architecture. It is designed for high-performing developers who value precision, density, and speed. We reject the "boxed-in" aesthetic of traditional web apps. Instead, we embrace **The Disciplined Canvas**—an editorial approach where whitespace is a functional tool, and hierarchy is defined by tonal shifts rather than heavy lines. 

The experience must feel like a high-end IDE or a well-typeset technical journal: intentional, calm, and hyper-efficient. We achieve "premium" not through decorative fluff, but through the obsessive calibration of spacing, type-scale, and subtle layering.

---

## 2. Color Strategy & Tonal Depth
We utilize a high-contrast structural split: a monolithic dark sidebar for navigation and a light, expansive content area for deep work.

### Palette & Roles
*   **Primary Accent:** `primary (#004ac6)` — Used sparingly for critical actions and focus states.
*   **Surface Hierarchy:**
    *   **Sidebar:** `inverse_surface (#213145)` with `on_surface_variant (#434655)` text.
    *   **Main Background:** `surface (#f8f9ff)`.
    *   **Lowered Content Area:** `surface_container_low (#eff4ff)`.
*   **Semantic Category Tokens:**
    *   **Deep Work:** `primary_container (#2563eb)`
    *   **Shallow Work:** `secondary_container (#fea619)`
    *   **Interruptions:** `error (#ba1a1a)`
    *   **Personal/Misc:** `tertiary_container (#7d4ce7)`

### The "No-Line" Rule
Prohibit 1px solid borders for sectioning large layout blocks. To separate a list from a detail view, transition from `surface` to `surface_container_low`. Boundaries must be felt, not seen. 

### Surface Nesting
Treat the UI as physical layers. A "Card" is not a box with a border; it is a `surface_container_lowest (#ffffff)` element sitting atop a `surface_container (#e5eeff)` canvas. This "stacked paper" effect creates depth without the visual noise of shadows or outlines.

---

## 3. Typography: Editorial Precision
The system uses **Inter** to bridge the gap between UI clarity and editorial character.

| Level | Size | Token | Usage |
| :--- | :--- | :--- | :--- |
| **Display-MD** | 2.75rem | `display-md` | Large metric highlights (e.g., "42h Focused") |
| **Headline-SM** | 1.5rem | `headline-sm` | Page titles and primary section headers |
| **Title-SM** | 1.0rem | `title-sm` | Card headings and modal titles |
| **Body-MD** | 0.875rem | `body-md` | Primary content, descriptions, and data tables |
| **Label-SM** | 0.6875rem | `label-sm` | Metadata, timestamps, and micro-labels |

**The Hierarchy Rule:** Never use bold for body text. Use `on_surface` for high emphasis and `on_surface_variant` for secondary information. Contrast is your primary tool for information density.

---

## 4. Elevation & Depth
We reject traditional drop shadows in favor of **Tonal Layering**.

*   **The Layering Principle:** 
    *   Level 0: `surface` (The base floor)
    *   Level 1: `surface_container_low` (Sunken areas, like a code block or secondary list)
    *   Level 2: `surface_container_lowest` (Raised areas, like a card or active modal)
*   **The Ghost Border:** If a boundary is required for accessibility (e.g., in a data-heavy grid), use the `outline_variant (#c3c6d7)` token at **15% opacity**. It should be a "ghost" of a border—visible only when looked for.
*   **Ambient Shadows:** For floating elements (menus/popovers), use a shadow color tinted with the primary hue: `rgba(0, 74, 198, 0.06)` with a 32px blur and 0px offset.

---

## 5. Components

### Buttons & Interaction
*   **Primary:** `rounded-md`, `primary (#004ac6)` background, `on_primary (#ffffff)` text. No gradients.
*   **Ghost/Tertiary:** `on_surface_variant` text. On hover, apply `surface_container_high` background.
*   **Signature Interaction:** Active states should utilize a 1px `surface_tint` focus ring with a 2px offset.

### Cards & Containers
*   **Card Style:** `rounded-lg`, background `surface_container_lowest (#ffffff)`. 
*   **No Dividers:** Forbid `<hr />` tags. Separate content using the Spacing Scale (e.g., `8 (1.75rem)` gap) or by nesting a `surface_container_low` block within the card.

### Input Fields
*   **Default:** `rounded-md`, background `surface_container_lowest`, border `outline_variant` at 20% opacity.
*   **Focus:** Border becomes `primary` at 100% opacity. Transition should be a swift 150ms ease-in-out.

### Data Visualization (Recharts)
*   **Line/Area:** Use `primary` for the main trend. Fill area with a 5% opacity of the same color.
*   **Grids:** Hide vertical grid lines. Horizontal grid lines must use `outline_variant` at 10% opacity.
*   **Interaction:** Tooltips must use `inverse_surface` backgrounds with `inverse_on_surface` text for maximum contrast against the light content area.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `2.5 (0.5rem)` or `3 (0.6rem)` spacing for tight data groupings.
*   **Do** use Lucide icons at a consistent `1.25rem` size for navigation.
*   **Do** let typography breathe. A `title-sm` header should have significant `12 (2.75rem)` bottom margin before a data table.
*   **Do** use color only to signify category or status. If everything is colored, nothing is important.

### Don't
*   **Don't** use pure black `#000000`. It breaks the tonal depth of the Zinc/Slate base.
*   **Don't** use standard shadows. If a card needs to pop, change the background color of the canvas behind it.
*   **Don't** use icons without labels in primary navigation. This system prioritizes clarity over "minimalist" guessing games.
*   **Don't** use center-alignment for data. Everything is left-aligned (text/labels) or right-aligned (monospaced numbers) to maintain a rigid, developer-centric grid.
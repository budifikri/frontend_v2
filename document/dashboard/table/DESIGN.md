# Design System Specification

## 1. Overview & Creative North Star
This design system is engineered for high-stakes enterprise environments where procurement logic meets financial precision. Moving away from the cluttered, line-heavy interfaces of legacy ERP software, this system adopts a Creative North Star titled **"The Architectural Ledger."**

The goal is to treat data not as a series of rows, but as a structured landscape. By leveraging intentional asymmetry, high-contrast typography, and a "depth-first" layout philosophy, we transform dense inventory management into a curated, editorial experience. We replace rigid grids with breathing room and tactile layering, ensuring that even the most complex purchase order feels intuitive and premium.

---

## 2. Colors & Tonal Depth
The palette is rooted in a "Trustworthy Professionalism" ethos, utilizing deep midnight blues (`primary`) and cool, atmospheric grays.

### The "No-Line" Rule
To achieve a high-end editorial feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined through background color shifts. For example, a main content area should sit on `surface`, while a sidebar or secondary utility panel uses `surface-container-low`.

### Surface Hierarchy & Nesting
This design system uses a "Nesting" approach to define hierarchy. Treat the UI as physical layers of fine paper:
- **Base Level:** `surface` (#f7f9fb)
- **Recessed Areas:** `surface-container-low` (#f2f4f6) for background groupings.
- **Elevated Interactive Cards:** `surface-container-lowest` (#ffffff) to provide maximum "pop" against the background.

### The "Glass & Gradient" Rule
Standard flat colors can feel "static." To provide visual soul:
- **CTAs:** Use a subtle linear gradient on primary buttons, transitioning from `primary` (#003358) to `primary_container` (#004a7c) at a 135-degree angle.
- **Overlays:** Use Glassmorphism for floating modals or dropdowns. Apply `surface_container_lowest` at 85% opacity with a `24px` backdrop-blur to allow underlying data to softly bleed through.

---

## 3. Typography
We utilize a dual-font strategy to balance character with functional density.

*   **Manrope (Display & Headlines):** An authoritative, modern geometric sans-serif. Use this for financial totals (`headline-md`) and section titles (`title-lg`). Its wide apertures ensure that large figures in procurement look significant and clean.
*   **Inter (Body & Labels):** The workhorse for data. Use Inter for all PO numbers, item descriptions, and status labels. Its high x-height maintains legibility at the `body-sm` (0.75rem) level, critical for dense inventory lists.

**Signature Styling:** All financial figures (e.g., Grand Totals) should use `headline-md` with `on_surface` coloring and a slightly tighter letter-spacing (-0.02em) to command attention.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** rather than structural lines.

- **The Layering Principle:** Instead of a border, place a `surface-container-lowest` card on top of a `surface-container` section. The subtle shift from #eceef0 to #ffffff creates a sophisticated edge that feels natural.
- **Ambient Shadows:** For floating elements (like an active "Print" button or a Modal), use an extra-diffused shadow: `0px 12px 32px rgba(25, 28, 30, 0.06)`. This mimics natural ambient light rather than a harsh digital drop shadow.
- **The "Ghost Border" Fallback:** If containment is required for accessibility, use the `outline_variant` token (#c1c7d0) at **15% opacity**. This creates a "Ghost Border" that guides the eye without cluttering the canvas.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), `on_primary` text, `xl` roundedness. 
- **Secondary:** `secondary_container` background with `on_secondary_container` text. No border.
- **Interactive States:** On hover, primary buttons should increase their shadow spread slightly rather than changing color, maintaining the "elevated" feel.

### Input Fields & Search
- **Container:** Use `surface_container_highest` (#e0e3e5) for the input background. This creates a "recessed" look that suggests an area to be filled.
- **Focus State:** Transition the background to `surface_container_lowest` (#ffffff) and apply a 1px `surface_tint` (#296195) soft outer glow (4px spread).

### Cards & Data Lists
- **Rule:** Forbid the use of divider lines between rows.
- **Separation:** Use `8px` or `12px` of vertical white space from the Spacing Scale to separate line items.
- **Active State:** When an item is selected in a list, change its background to `secondary_fixed` (#d8e3fa) rather than adding a border.

### Chips (Status Tags)
- **Draft/Pending:** Use `secondary_container` with `on_secondary_container` text.
- **High Alert/Error:** Use `error_container` (#ffdad6) with `on_error_container` (#93000a) text.
- **Shape:** Use `full` (9999px) roundedness for a pill-shaped "tag" look that contrasts with the `lg` roundedness of cards.

---

## 6. Do's and Don'ts

### Do
- **Do** use `display-sm` for large monetary sums to emphasize the scale of a procurement order.
- **Do** use `surface-container-high` for "Table Headers" to create a distinct but borderless anchor for data columns.
- **Do** utilize `on_surface_variant` for helper text and secondary labels to create a clear visual hierarchy against the primary data.

### Don't
- **Don't** use 1px solid black or dark gray borders. If you feel a border is needed, use a tonal shift instead.
- **Don't** use sharp corners. Every interactive element must have at least a `md` (0.375rem) corner radius to feel approachable and modern.
- **Don't** use pure black (#000000) for text. Always use `on_background` (#191c1e) to maintain a soft, premium contrast.
- **Don't** use "Dotted" or "Dashed" lines for separation (as seen in legacy systems); they create visual noise that distracts from the data.
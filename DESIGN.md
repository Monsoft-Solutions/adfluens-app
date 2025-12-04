# Adfluens Design System: The Digital Prism

**Version 1.0**

## 1. Design Philosophy

### Brand Foundation

**Adfluens** (from "Ad" + "fluens" - Latin for flowing) is a social media marketing platform that helps marketers track their brand across multiple platforms and create content. The brand identity reflects **intelligence**, **fluidity**, **trust**, and **energy**.

### Brand Voice

- Professional yet approachable
- Data-driven without being cold
- Action-oriented and results-focused
- Modern and forward-thinking

Adfluens is not just another SaaS dashboard; it is a command center for the modern creator economy. Our aesthetic, **"The Digital Prism"**, reflects the platform's core function: taking a brand's singular identity and refracting it perfectly across the spectrum of social platforms.

### Core Principles

- **Opinionated Minimalism**: We remove noise, not features. Every line and pixel serves a purpose. We avoid the generic "soft shadow on white card" aesthetic in favor of structural clarity.
- **Editorial Precision**: The interface should feel like a high-end magazine layout—dense with information but governed by strict hierarchy and typography.
- **Tactile Digitalism**: Controls should feel mechanical and responsive. We use distinct borders and high-contrast states rather than vague glows.

---

## 2. Typography

We avoid the ubiquity of Inter/Roboto to establish a distinct voice. Our type pairing combines quirkiness with high-performance legibility.

### Display: Bricolage Grotesque

Used for Headlines (H1-H3), Hero sections, and key data points.

- **Why**: It has personality, variable weight/width, and feels human yet digital.
- **Usage**: Tight tracking (-0.02em) for larger headings.
- **Source**: [Google Fonts](https://fonts.google.com/specimen/Bricolage+Grotesque)

### Body: Instrument Sans

Used for UI text, paragraphs, labels, and tables.

- **Why**: A modern geometric sans that is highly legible at small sizes but has more character than Inter.
- **Usage**: Normal tracking for body text.
- **Source**: [Google Fonts](https://fonts.google.com/specimen/Instrument+Sans)

### Monospace: JetBrains Mono

Used for code snippets, analytics data values, and technical identifiers.

---

## 3. Color Palette

Our palette is high-contrast and bold. We avoid "safe" pastel purples and blues.

### Theme Variables (Tailwind / CSS)

#### Light Mode ("Paper & Ink")

| Role          | Color Name             | Hex       | CSS Variable   |
| :------------ | :--------------------- | :-------- | :------------- |
| **Canvas**    | `Alabaster`            | `#FDFDFC` | `--background` |
| **Surface**   | `White`                | `#FFFFFF` | `--card`       |
| **Ink**       | `Carbon`               | `#0A0A0A` | `--foreground` |
| **Primary**   | `International Orange` | `#FF4F00` | `--primary`    |
| **Secondary** | `Deep Forest`          | `#004D40` | `--secondary`  |
| **Accent**    | `Lime Acid`            | `#CCFF00` | `--accent`     |
| **Border**    | `Smoke`                | `#E5E5E5` | `--border`     |

#### Dark Mode ("Obsidian & Neon")

| Role          | Color Name             | Hex       | CSS Variable   |
| :------------ | :--------------------- | :-------- | :------------- |
| **Canvas**    | `Obsidian`             | `#050505` | `--background` |
| **Surface**   | `Charcoal`             | `#121212` | `--card`       |
| **Ink**       | `Mist`                 | `#EDEDED` | `--foreground` |
| **Primary**   | `International Orange` | `#FF4F00` | `--primary`    |
| **Secondary** | `Emerald`              | `#10B981` | `--secondary`  |
| **Accent**    | `Lime Acid`            | `#CCFF00` | `--accent`     |
| **Border**    | `Graphite`             | `#262626` | `--border`     |

### Usage Rules

- **Primary (Orange)**: Use sparingly for the _single_ most important action on a screen (Submit, Create, Deploy).
- **Accent (Lime)**: Use for "delight" moments—active states, cursors, selection highlights, or successful data trends.
- **Secondary (Forest/Emerald)**: Use for supportive data visualizations and secondary buttons.

---

## 4. Visual Language: "Soft Brutalism"

We merge the usability of modern SaaS with the edge of brutalism.

### Borders & Radius

- **Borders**: All structural elements (cards, sidebars, inputs) have a `1px` solid border.
- **Radius**: Small, tight radii.
  - `--radius-sm`: `2px` (Checkboxes, tags)
  - `--radius-md`: `4px` (Buttons, Inputs)
  - `--radius-lg`: `8px` (Modals, Cards)
- **No Drop Shadows**: We strictly avoid blurred drop shadows for depth.
  - _Instead_: Use a hard "offset" border or a high-contrast outline on hover.

### Texture

- Use a subtle **noise texture** overlay (opacity 2-3%) on the background to reduce the "digital sterility" of flat colors.

---

## 5. Motion & Interaction

Animations should be crisp (ease-out-quart) and meaningful, not floaty.

### The "Staggered Reveal"

When a page loads, content should not appear all at once.

1.  **Layout** (Sidebar/Header): Instant.
2.  **Hero/Title**: Fade in + Slide Up (50ms delay).
3.  **Primary Content**: Fade in + Slide Up (100ms delay).
4.  **Secondary Content**: Fade in + Slide Up (150ms delay).

### Micro-interactions

- **Buttons**: On hover, do NOT just change opacity.
  - _Action_: Shift the background color slightly or translate the button `1px` up and right with a hard shadow appearing.
- **Inputs**: On focus, the border color changes to `Carbon` (Light) or `White` (Dark) with a thick `2px` width. No fuzzy "ring".

---

## 6. Implementation Guide

### HTML Head (Fonts)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

### Tailwind Config Updates (v4 Theme)

```css
@theme {
  /* Fonts */
  --font-sans: "Instrument Sans", sans-serif;
  --font-display: "Bricolage Grotesque", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Colors */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: #ffffff;
  --color-accent: var(--accent);
  --color-accent-foreground: #000000;

  /* Animations */
  --animate-reveal: reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @keyframes reveal {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

### Component Styles (Examples)

#### Primary Button

```tsx
// Sharp, high contrast, minimal radius
<button className="font-sans font-medium text-sm px-4 py-2 rounded-[4px] bg-[var(--primary)] text-white hover:translate-y-[-1px] transition-transform border border-transparent shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[0px] active:shadow-none">
  Create Campaign
</button>
```

#### Card

```tsx
// Flat border, no shadow, distinct separation
<div className="border border-[var(--border)] bg-[var(--card)] p-6 rounded-[8px]">
  <h3 className="font-display font-semibold text-xl mb-2">Performance</h3>
  ...
</div>
```

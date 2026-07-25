---
name: Executive Editorial
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#44474d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777e'
  outline-variant: '#c5c6ce'
  surface-tint: '#4f5e7e'
  primary: '#041632'
  on-primary: '#ffffff'
  primary-container: '#1b2b48'
  on-primary-container: '#8393b5'
  inverse-primary: '#b7c7eb'
  secondary: '#7b5800'
  on-secondary: '#ffffff'
  secondary-container: '#fecd6e'
  on-secondary-container: '#775600'
  tertiary: '#171712'
  on-tertiary: '#ffffff'
  tertiary-container: '#2b2b26'
  on-tertiary-container: '#94928b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#b7c7eb'
  on-primary-fixed: '#091b37'
  on-primary-fixed-variant: '#374765'
  secondary-fixed: '#ffdea4'
  secondary-fixed-dim: '#efc062'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4200'
  tertiary-fixed: '#e5e2db'
  tertiary-fixed-dim: '#c9c6bf'
  on-tertiary-fixed: '#1c1c17'
  on-tertiary-fixed-variant: '#474741'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  button:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 120px
---

## Brand & Style
The brand personality is authoritative yet encouraging, mirroring the confidence of a well-crafted resume. It targets mid-to-senior level professionals who value precision, clarity, and a sophisticated aesthetic. 

The design style is **Modern Editorial**. It leverages high-contrast typography and a restrained, premium color palette to evoke the feeling of a high-end physical publication. This approach builds trust through "digital craftsmanship"—prioritizing legibility, structural alignment, and generous whitespace over flashy decorative elements. The interface should feel like a premium stationary tool rather than a standard SaaS dashboard.

## Colors
The palette is rooted in a "Paper and Ink" philosophy. 

- **Primary (Navy):** Used for headlines, primary navigation, and high-emphasis buttons. It provides the foundational weight and professional authority.
- **Secondary (Gold-Brown):** Reserved for primary calls to action and success states. It adds warmth and a sense of "premium achievement."
- **Tertiary (Cream):** The primary background color. It is softer on the eyes than pure white and reinforces the editorial/stationary feel.
- **Neutral (Slate):** Used for body text and secondary information, ensuring high legibility without the harshness of pure black.

Success, warning, and error states should use muted versions of emerald and crimson, tinted to match the warmth of the cream background.

## Typography
The typography system uses a classic serif/sans-serif pairing to create visual hierarchy and professional contrast.

**Source Serif 4** is utilized for all editorial elements, including headlines and page titles. Its sturdy, balanced character evokes the feeling of a traditional resume or high-end news publication. 

**Manrope** is used for functional elements—body copy, form fields, and labels. Its modern, geometric construction ensures that dense information (like bullet points or keyword lists) remains highly legible and clean. 

Special attention is paid to the `label-caps` style, which uses wide tracking to provide clear section signifiers without competing with the primary headlines.

## Layout & Spacing
This design system utilizes a **Fixed Grid** model on desktop to maintain the integrity of "the page" as a metaphor. 

- **Desktop:** A 12-column grid with a 1280px max-width. Large 120px gaps between vertical sections create an airy, premium feel.
- **Content Density:** In the resume builder interface, use a split-pane layout. The editor (left) should have high-density spacing (16-24px), while the preview (right) should maintain "Paper" margins (48-64px) to simulate a physical document.
- **Rhythm:** All spacing is based on a 4px/8px baseline shift to ensure consistent alignment across text-heavy layouts.

## Elevation & Depth
To maintain the professional aesthetic, depth is conveyed through **Tonal Layers** and extremely subtle **Ambient Shadows**.

1.  **Level 0 (Base):** The Cream (`#F9F6EE`) surface.
2.  **Level 1 (Cards/Paper):** Pure white surfaces with a soft, 15% opacity Navy shadow (Blur: 20px, Offset: 4px). This makes the resume preview appear as if it is floating slightly above the desk.
3.  **Insets:** For input fields and editor zones, use a 1px solid stroke in a lightened Navy (10% opacity) rather than shadows. 

Avoid heavy blurs or glassmorphism; the focus should remain on "material" stability rather than digital transparency.

## Shapes
The shape language is **Soft** but disciplined. 

- **Standard Elements:** Buttons and input fields use a `4px` (0.25rem) radius to feel modern but structured.
- **Cards & Containers:** Large containers use an `8px` (0.5rem) radius.
- **Exceptions:** Chips for skills/keywords use a full "pill" radius to distinguish them from actionable buttons and provide a softer visual counterpoint to the sharp serifs in the typography.

## Components

### Buttons
- **Primary:** Navy background, White text. No border. On hover, darken slightly.
- **Secondary (Action):** Gold-Brown background, White text. Used for "Download" or "Build Resume."
- **Ghost:** Transparent background, Navy 1px stroke. For secondary navigation.

### Input Fields
- **Editorial Style:** Inputs should use the Cream background with a bottom-only border (1px Slate) to feel like "filling in the blanks" on a document. When focused, the border transitions to Navy.

### Chips (Skills/Keywords)
- Soft Gold background (`#F9F1E0`) with Gold-Brown text. Used for ATS keyword matches.

### The Resume Preview
- The central component of the system. It must strictly adhere to a 1:1.414 (A4) aspect ratio, using white backgrounds and the Primary Navy for its internal typography to ensure a professional "printed" appearance.

### Progress Gauges
- Circular stroke-based gauges (as seen in the score indicator) using the Gold-Brown for the value and a light cream for the track.
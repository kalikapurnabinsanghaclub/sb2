# Accessibility + SEO Layer

## Canvas/WebGL accessibility

A `<canvas>` is a single opaque pixel buffer to every assistive technology. Treat it exactly like an image:

```html
<div class="scene-container" role="img" aria-label="Rotating 3D model of the product in matte black finish">
  <canvas id="webgl-canvas"></canvas>
</div>
```

If the 3D scene is purely decorative (ambient background, no informational content), mark it as such so it's skipped entirely:

```html
<div class="scene-container" aria-hidden="true">
  <canvas id="webgl-canvas"></canvas>
</div>
```

If the scene is interactive (user can rotate/zoom a product), also expose keyboard controls and announce state changes for anything that matters (e.g. a color swatch selection that changes the 3D model) via an `aria-live="polite"` region — don't rely on the visual change alone.

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
```

Mirror this in JS for anything driven by `requestAnimationFrame` rather than CSS (camera moves, auto-rotate, scroll-linked 3D) — check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and branch to a static frame.

## Structured data (schema.org JSON-LD)

Add this regardless of whether the page has 3D content — it's what makes the page's real subject machine-readable to search engines independent of any visual layer:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product name",
  "description": "Plain description of what this page is about.",
  "image": "https://example.com/poster-image.jpg"
}
</script>
```

Pick the right `@type` for the subject: `Product`, `Organization`, `Event`, `Article`, `LocalBusiness`, etc. — never leave it generic when a more specific type applies.

## Meta essentials

```html
<title>Specific, human page title — not just the brand name</title>
<meta name="description" content="One or two sentences describing the page's actual content.">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="https://example.com/poster.jpg"> <!-- static image, not a canvas screenshot dependency -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

The `og:image` must be a real static asset — social platforms cannot render your WebGL scene, so ship a poster/screenshot for link previews.

## Performance as an accessibility issue

Slow, janky pages are an accessibility barrier for users on low-end devices or slower connections. For 3D pages specifically:
- Cap device pixel ratio (see `threejs-3d.md`).
- Lazy-load the Three.js module and defer scene construction until the container is near the viewport (`IntersectionObserver` with a root margin), rather than blocking initial page render.
- Compress and use appropriately-sized textures (power-of-two dimensions, `.ktx2`/Basis compression for production, not raw 4K PNGs).

## Final combined checklist

- [ ] Canvas/3D content has a text equivalent (`role="img"` + `aria-label`, or `aria-hidden="true"` if purely decorative)
- [ ] `prefers-reduced-motion` respected in both CSS and JS-driven animation
- [ ] JSON-LD structured data present with the correct `@type`
- [ ] `og:image` is a static poster, not reliant on canvas
- [ ] Page content survives with JavaScript disabled (core text/structure, even if the 3D scene doesn't render)
- [ ] Lighthouse accessibility score checked, not assumed

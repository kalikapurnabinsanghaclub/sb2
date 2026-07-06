# Semantic HTML Reference

## Landmark structure (every page)

```html
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header>
    <nav aria-label="Primary">...</nav>
  </header>
  <main id="main">
    <section aria-labelledby="section-1-heading">
      <h2 id="section-1-heading">...</h2>
    </section>
  </main>
  <footer>...</footer>
</body>
```

Rules:
- Exactly one `<main>`, one `<h1>` per page.
- Heading levels never skip (`h1` → `h2` → `h3`, not `h1` → `h3`).
- `<section>` requires an accessible name (`aria-labelledby` pointing at a heading, or `aria-label`) — a `<section>` with no name is invisible to landmark navigation and should probably be a `<div>` instead.
- Use `<article>` for a self-contained, independently distributable piece of content (a blog post, a card that could be syndicated) — not for generic layout boxes.
- Use `<nav>` only for major navigation blocks, not every list of links (a footer's link list of legal pages typically isn't a `<nav>`).
- Use `<button>` for anything that performs an action in the page; use `<a href>` for anything that navigates. Never a `<div>`/`<span>` with a click handler — it breaks keyboard access and screen reader semantics.

## Skip link (required whenever there's a nav before main content)

```css
.skip-link {
  position: absolute;
  left: -999px;
  top: 0;
  background: #000;
  color: #fff;
  padding: 0.75rem 1rem;
  z-index: 100;
}
.skip-link:focus {
  left: 0;
}
```

## Forms

- Every input has a `<label for="id">`, never a placeholder standing in for a label.
- Group related fields with `<fieldset>` + `<legend>`.
- Error text is linked via `aria-describedby`, not color alone.

## Images and non-text content

- Every `<img>` has `alt`. Decorative images use `alt=""` (empty, not omitted).
- Canvas/SVG/WebGL content that conveys meaning gets a text equivalent: wrap in `role="img"` with `aria-label`, or provide adjacent visually-hidden text via a `.sr-only` class:

```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}
```

## Focus and keyboard

- Never remove focus outlines without replacing them: `:focus-visible { outline: 2px solid <accent>; outline-offset: 2px; }`.
- Tab order should follow visual/reading order — avoid `tabindex` values above 0.
- Anything interactive (custom dropdowns, modals, carousels) needs keyboard handling (Enter/Space to activate, Escape to close, arrow keys where the pattern calls for it) — check the ARIA Authoring Practices Guide pattern for that widget type rather than improvising.

## Quick audit checklist before calling a page "semantic"

- [ ] One `h1`, no skipped heading levels
- [ ] All landmarks present and named (`header`, `nav`, `main`, `footer`, named `section`s)
- [ ] Skip link present and functional
- [ ] All interactive elements are real `button`/`a`/form controls
- [ ] All images/canvas/SVG have text equivalents
- [ ] Color contrast meets WCAG AA (4.5:1 body text, 3:1 large text/UI)
- [ ] Visible focus state on every interactive element
- [ ] Page still communicates its core content with JavaScript disabled

---
name: 3d-semantic-webpage
description: Build web pages that combine real 3D graphics (Three.js/WebGL) with fully semantic, accessible HTML5 markup. Use whenever the user asks for a "3D website," "3D landing page," "WebGL page," "interactive 3D scene," "semantic webpage," or "accessible landing page," or any page needing good search ranking and screen-reader support alongside 3D visuals, hero scenes, product viewers, particle backgrounds, or scroll-driven 3D animation. Also trigger for "semantic" page requests (heading structure, landmarks, ARIA, schema.org data) with no 3D component, or for pure 3D scenes with no semantic ask — this skill covers both independently and combined. Consult before writing HTML/CSS/JS for any marketing site, portfolio, product showcase, or event page mentioning "3D," "immersive," "WebGL," "Three.js," or "SEO-friendly"/"semantic HTML," even with casual wording or typos (e.g. "3d and semantic web page").
license: Complete terms in LICENSE.txt
---

# 3D + Semantic Webpage

Build pages that are simultaneously: (1) genuinely three-dimensional — real WebGL scenes via Three.js, not flat CSS pretending to be 3D — and (2) genuinely semantic — markup a screen reader, a search crawler, and a browser's reader mode all parse correctly. These two goals are usually treated as opposites (3D demos are typically a single `<div id="app">` with no structure; semantic sites are typically flat and static). This skill is about not trading one for the other.

## When to use which half

- **Pure 3D ask** ("add a rotating product model", "particle hero background", "interactive globe") → apply the `references/threejs-3d.md` section, skip semantic overhead but still land the canvas inside a real document structure (never a bare `<div>` soup).
- **Pure semantic ask** ("make this page semantic", "fix heading structure", "make this accessible/SEO-friendly") → apply `references/semantic-html.md` and `references/accessibility-seo.md`, no 3D needed.
- **Combined ask** ("3D and semantic webpage", "immersive landing page", any page-creation request without an explicit exclusion) → do both. This is the common case and the default assumption when a user says "3D webpage" without qualifiers, since a page with no structure at all is a worse deliverable than one with both.

## Core principle: the canvas is a citizen, not the whole document

A WebGL canvas is visual decoration or a genuine content object (a product viewer, a data visualization) — either way, it sits inside normal document flow, not instead of it. The wrong pattern (common in 3D demos and in Antigravity/AI-generated scaffolds) is:

```html
<body>
  <div id="root"></div>
  <script src="app.js"></script>
</body>
```

The right pattern nests the 3D layer inside a semantic shell:

```html
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header>...</header>
  <main id="main">
    <section aria-labelledby="hero-heading">
      <h1 id="hero-heading">Actual visible headline text</h1>
      <div class="scene-container" role="img" aria-label="Description of what the 3D scene depicts">
        <canvas id="webgl-canvas"></canvas>
      </div>
    </section>
    ...
  </main>
  <footer>...</footer>
</body>
```

The canvas is opaque to assistive tech and crawlers — it MUST have a text equivalent (`aria-label` on a wrapping `role="img"`, or adjacent visually-hidden text) describing what it shows, exactly like an `<img alt="">` would.

## Workflow

1. **Confirm the subject and the job of the 3D element.** Don't default to a generic rotating torus/sphere. Ask (or infer from the brief): is the 3D piece a hero centerpiece, a product viewer, a data visualization, or ambient atmosphere? This determines the Three.js pattern (see reference) and how much of the design-lead process from `frontend-design` should run first — for any client-facing/distinctive page, run that skill's brainstorm-plan-critique process before writing code; this skill supplements it with 3D- and semantics-specific technical constraints.
2. **Write the semantic skeleton first**, empty of any 3D content: landmarks (`header`, `nav`, `main`, `section`, `aside`, `footer`), one `h1`, logical heading order, real `<button>`/`<a>` elements (never `<div onclick>`). See `references/semantic-html.md`.
3. **Layer in the 3D scene** inside its designated container using the patterns in `references/threejs-3d.md`: scene/camera/renderer setup, resize handling, a disposal/cleanup path, and performance guardrails (capped pixel ratio, paused render loop when off-screen or tab hidden).
4. **Add the accessibility and SEO layer**: `references/accessibility-seo.md` covers ARIA roles for canvas content, reduced-motion handling for any camera/scroll animation, focus management, and structured data (schema.org JSON-LD) so the page's real content is machine-readable independent of the 3D layer.
5. **Verify degradation paths**: what renders if WebGL is unavailable (older browser, disabled GPU, `prefers-reduced-motion`)? There must always be a non-3D fallback — a static image or plain gradient — never a blank screen. Check this explicitly before considering the page done.
6. **Respect `prefers-reduced-motion`** for any camera movement, auto-rotation, or scroll-linked 3D animation — provide a static frame instead of disabling the feature outright.

## Building this as an Antigravity / Claude Code / Codex skill+plugin

This SKILL.md is portable: the same file works unmodified in Claude Code (`.claude/skills/`), Codex (`.codex/skills/`), and Antigravity, which reads project skills from `.antigravity/skills/<skill-name>/SKILL.md` in a repo root, or globally from `~/.gemini/skills/`. To distribute it as an installable **plugin** rather than a manually-copied folder, package it with a marketplace manifest — see `references/antigravity-plugin-packaging.md` for the exact `.claude-plugin/plugin.json` / `marketplace.json` shape and the Antigravity-specific install locations.

## Output expectations

- Deliver a single self-contained HTML file (inline CSS/JS, Three.js via CDN import) unless the user's project structure calls for split files.
- Every 3D scene ships with: resize handling, visibility-based render pausing, capped device pixel ratio (`Math.min(devicePixelRatio, 2)`), and a `dispose()` path for geometries/materials/textures on teardown.
- Every page ships with: one `h1`, a skip link, landmark regions, visible focus states, and alt-text-equivalent descriptions for anything rendered only in canvas/WebGL.
- Never ship a page where removing the JavaScript makes the content vanish entirely — meaningful text content belongs in the HTML, not generated purely by the 3D layer.

# Three.js 3D Web Patterns

Load Three.js from a CDN for single-file pages:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/"
  }
}
</script>
<script type="module">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  // ...
</script>
```

## Minimum viable, well-behaved scene

Every scene needs: sized-to-container renderer, capped pixel ratio, resize handling, a render-pause when off-screen or tab hidden, and disposal on teardown. Skipping any of these is the most common cause of a 3D page that's laggy on mobile or leaks memory on a long-lived SPA route.

```js
const container = document.querySelector('.scene-container');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#webgl-canvas'), antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap DPR, uncapped tanks mobile GPUs
renderer.setSize(container.clientWidth, container.clientHeight);

// Resize
const resizeObserver = new ResizeObserver(entries => {
  const { width, height } = entries[0].contentRect;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});
resizeObserver.observe(container);

// Pause when off-screen (IntersectionObserver) and when tab hidden
let isVisible = true;
new IntersectionObserver(([entry]) => { isVisible = entry.isIntersecting; }, { threshold: 0.01 }).observe(container);
document.addEventListener('visibilitychange', () => { isVisible = isVisible && !document.hidden; });

let rafId;
function animate() {
  rafId = requestAnimationFrame(animate);
  if (!isVisible) return;
  // update scene here
  renderer.render(scene, camera);
}
animate();

// Cleanup (call on route change / component unmount)
function dispose() {
  cancelAnimationFrame(rafId);
  resizeObserver.disconnect();
  scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach(m => { Object.values(m).forEach(v => v?.isTexture && v.dispose()); m.dispose(); });
    }
  });
  renderer.dispose();
}
```

## Common scene archetypes

- **Hero centerpiece** (a single striking object — abstract shape, product, wordmark extrusion): light with 2–3 sources (key, fill, rim), subtle idle rotation (`obj.rotation.y += delta * 0.15`), orbit controls disabled or heavily damped unless the user is meant to spin it themselves.
- **Product viewer**: `OrbitControls` with `enableDamping`, `minDistance`/`maxDistance` clamps, `autoRotate` when idle, environment map (`RGBELoader` + `PMREMGenerator`) for realistic reflections on any metal/glass material.
- **Particle/ambient background**: `THREE.Points` with a `BufferGeometry`, keep particle count reasonable (a few thousand, not hundreds of thousands) and animate via a vertex shader or per-frame position updates only if the count is small — for large counts, do the motion in a shader, not JS loops.
- **Scroll-driven 3D**: tie camera position/rotation or object transforms to scroll progress (`IntersectionObserver` + a normalized 0–1 scroll fraction, or a library like GSAP ScrollTrigger). Always provide a `prefers-reduced-motion` branch that snaps to a static end-state instead of animating.

## Materials quick reference

- `MeshStandardMaterial` / `MeshPhysicalMaterial` — physically based, react to lights, the default choice for anything meant to look "real."
- `MeshBasicMaterial` — unlit, flat color/texture, good for stylized/flat-shaded looks or performance-constrained scenes.
- Always add at least one light (`AmbientLight` + `DirectionalLight` minimum) when using standard/physical materials — a common bug is an all-black object because a lit material has no light source.

## Fallback for no-WebGL / reduced-motion

```js
function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) { return false; }
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!webglAvailable()) {
  container.classList.add('static-fallback'); // CSS-only gradient or a static poster image
} else if (prefersReducedMotion) {
  // build the scene but skip auto-rotation / camera animation, render one static frame
}
```

Never leave the container empty in the fallback case — style `.static-fallback` with a gradient or `<img>` poster that conveys the same content the 3D scene would have shown.


  (function() {
    const container = document.querySelector('.scene-container');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      container.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)';
    } else {
      const scene = new THREE.Scene();
      // Light bright background
      scene.background = new THREE.Color(0xf8fafc);
      scene.fog = new THREE.FogExp2(0xf8fafc, 0.003);

      const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 1, 1000);
      camera.position.set(0, 30, 100);

      const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#webgl-canvas'), antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);

      // Cinematic Wave (PlaneGeometry)
      const geometry = new THREE.PlaneGeometry(400, 200, 40, 20);
      geometry.rotateX(-Math.PI / 2); // Lay flat
      
      const material = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        wireframe: true,
        transparent: true,
        opacity: 0.4
      });

      const waveMesh = new THREE.Mesh(geometry, material);
      waveMesh.position.y = -15;
      scene.add(waveMesh);

      // Lighting for the cinematic feel
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);
      
      const pointLight = new THREE.PointLight(0x10b981, 2, 200);
      pointLight.position.set(0, 20, 0);
      scene.add(pointLight);
      
      const pointLight2 = new THREE.PointLight(0xf59e0b, 2, 200);
      pointLight2.position.set(50, 20, -50);
      scene.add(pointLight2);

      // Floating Particles
      const particlesGeo = new THREE.BufferGeometry();
      const vertices = [];
      for (let i = 0; i < 500; i++) {
        vertices.push((Math.random() - 0.5) * 400, Math.random() * 100, (Math.random() - 0.5) * 400);
      }
      particlesGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      const particlesMat = new THREE.PointsMaterial({ color: 0x3b82f6, size: 2, transparent: true, opacity: 0.5 });
      const particles = new THREE.Points(particlesGeo, particlesMat);
      scene.add(particles);

      // Resize Handling
      window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      });

      // Optimization: Pause when off-screen
      let isVisible = true;
      if (window.IntersectionObserver) {
        new IntersectionObserver(([entry]) => { isVisible = entry.isIntersecting; }, { threshold: 0.01 }).observe(container);
      }
      document.addEventListener('visibilitychange', () => { isVisible = isVisible && !document.hidden; });

      // Interactive parallax on hover/touch
      let mouseX = 0;
      let mouseY = 0;
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      document.addEventListener('pointermove', (e) => {
        mouseX = (e.clientX - windowHalfX) * 0.05;
        mouseY = (e.clientY - windowHalfY) * 0.05;
      });

      let clock = new THREE.Clock();
      let rafId;

      function animate() {
        rafId = requestAnimationFrame(animate);
        if (!isVisible) return;

        const time = clock.getElapsedTime();

        // Animate the wave vertices
        const positionAttribute = geometry.getAttribute('position');
        const vertex = new THREE.Vector3();
        for (let i = 0; i < positionAttribute.count; i++) {
          vertex.fromBufferAttribute(positionAttribute, i);
          // Create sweeping wave effect based on x and z position
          vertex.y = Math.sin(vertex.x * 0.05 + time) * 5 + Math.cos(vertex.z * 0.05 + time * 0.8) * 5;
          positionAttribute.setY(i, vertex.y);
        }
        positionAttribute.needsUpdate = true;

        // Gentle rotation and parallax
        camera.position.x += (mouseX - camera.position.x) * 0.02;
        camera.position.y += (30 - mouseY - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        particles.rotation.y = time * 0.05;
        
        // Move lights dynamically
        pointLight.position.x = Math.sin(time * 0.5) * 50;
        pointLight.position.z = Math.cos(time * 0.5) * 50;

        renderer.render(scene, camera);
      }
      animate();
    }
  })();

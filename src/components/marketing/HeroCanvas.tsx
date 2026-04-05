'use client';

/**
 * Three.js 3D Hero — Translucent brass-tinted geometric city skyline
 * Slowly rotates, floats up/down, responds to mouse position.
 * Hidden on mobile (<768px) — replaced with CSS gradient in HeroSection.
 */

import { useEffect, useRef } from 'react';

export function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Dynamically import Three.js to keep bundle light
    let disposed = false;

    async function init() {
      const THREE = await import('three');
      if (disposed) return;

      // Scene
      const scene = new THREE.Scene();

      // Camera
      const camera = new THREE.PerspectiveCamera(
        45,
        container!.clientWidth / container!.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 2, 12);
      camera.lookAt(0, 0, 0);

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setSize(container!.clientWidth, container!.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio * 0.7, 1.5));
      renderer.setClearColor(0x000000, 0);
      container!.appendChild(renderer.domElement);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);

      const pointLight1 = new THREE.PointLight(0xc9a96e, 1.2, 50);
      pointLight1.position.set(5, 8, 5);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0xc9a96e, 0.6, 50);
      pointLight2.position.set(-5, 4, -3);
      scene.add(pointLight2);

      // Building group
      const buildingGroup = new THREE.Group();

      // Create translucent building-like prisms at varying heights
      const buildingData = [
        { x: -3, z: -1, w: 0.6, h: 3.5, d: 0.6 },
        { x: -2.2, z: 0, w: 0.5, h: 2.8, d: 0.5 },
        { x: -1.5, z: -0.5, w: 0.7, h: 4.2, d: 0.7 },
        { x: -0.8, z: 0.3, w: 0.5, h: 3.0, d: 0.5 },
        { x: -0.2, z: -0.8, w: 0.8, h: 5.0, d: 0.8 },
        { x: 0.5, z: 0.5, w: 0.6, h: 4.5, d: 0.6 },
        { x: 1.2, z: -0.3, w: 0.7, h: 3.8, d: 0.7 },
        { x: 1.8, z: 0.2, w: 0.5, h: 2.5, d: 0.5 },
        { x: 2.5, z: -0.6, w: 0.6, h: 3.2, d: 0.6 },
        { x: 3.2, z: 0.1, w: 0.5, h: 2.0, d: 0.5 },
        { x: -2.8, z: 0.8, w: 0.4, h: 1.8, d: 0.4 },
        { x: 0, z: 0.7, w: 0.4, h: 2.2, d: 0.4 },
        { x: 2.8, z: 0.7, w: 0.4, h: 1.5, d: 0.4 },
      ];

      const material = new THREE.MeshPhysicalMaterial({
        color: 0xc9a96e,
        transmission: 0.6,
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });

      for (const b of buildingData) {
        const geometry = new THREE.BoxGeometry(b.w, b.h, b.d);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(b.x, b.h / 2 - 1, b.z);
        buildingGroup.add(mesh);
      }

      scene.add(buildingGroup);

      // Mouse tracking
      function onMouseMove(e: MouseEvent) {
        mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      }
      window.addEventListener('mousemove', onMouseMove);

      // Resize
      function onResize() {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
      window.addEventListener('resize', onResize);

      // Animation loop — capped at ~30fps
      let lastFrame = 0;
      const frameInterval = 1000 / 30;

      function animate(time: number) {
        if (disposed) return;
        requestAnimationFrame(animate);

        if (time - lastFrame < frameInterval) return;
        lastFrame = time;

        // Slow Y rotation
        buildingGroup.rotation.y += 0.001;

        // Gentle floating (sine wave, amplitude ~5px = 0.05 in world units, period 4s)
        buildingGroup.position.y = Math.sin(time * 0.0015) * 0.05;

        // Mouse-reactive rotation (max ±5 degrees = ±0.087 radians)
        const targetRotX = mouseRef.current.y * 0.087;
        const targetRotZ = mouseRef.current.x * -0.087;
        buildingGroup.rotation.x += (targetRotX - buildingGroup.rotation.x) * 0.05;
        buildingGroup.rotation.z += (targetRotZ - buildingGroup.rotation.z) * 0.05;

        renderer.render(scene, camera);
      }
      requestAnimationFrame(animate);

      // Cleanup
      return () => {
        disposed = true;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        if (container && renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    }

    let cleanup: (() => void) | undefined;
    init().then((c) => {
      cleanup = c;
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden md:block"
      style={{ zIndex: 0 }}
    />
  );
}

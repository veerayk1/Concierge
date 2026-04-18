'use client';

/**
 * Three.js 3D Hero — Brass-tinted geometric city skyline.
 *
 * Slowly rotates, floats up/down, responds to mouse position.
 * Hidden on mobile (<768px) — replaced with CSS gradient in HeroSection.
 *
 * Design notes:
 * - Uses MeshStandardMaterial (smooth shading) rather than transmissive Physical
 *   material to avoid internal-face seams and warm halo at the viewport edges.
 * - Neutral-white directional + hemisphere lighting keeps the scene crisp; the
 *   brass tone comes from the material itself, not from colored lights spilling
 *   onto the background.
 * - scene.fog fades buildings into the dark background so the composite blends
 *   cleanly into the surrounding section (no reddish rim glow at the viewport edges).
 * - Buildings are spread slightly further apart with a small footprint inset,
 *   which prevents visible seams where blocks touch.
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

      const BACKGROUND_COLOR = 0x0a0a0a;

      // Scene — fog matches the surrounding section background so buildings
      // dissolve into the dark rather than producing a warm halo at the edges.
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(BACKGROUND_COLOR, 10, 22);

      // Camera
      const camera = new THREE.PerspectiveCamera(
        45,
        container!.clientWidth / container!.clientHeight,
        0.1,
        1000,
      );
      camera.position.set(0, 2, 12);
      camera.lookAt(0, 0, 0);

      // Renderer — antialias on, proper colour pipeline so brass doesn't bleed
      // into reddish tones under tone mapping.
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(container!.clientWidth, container!.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(BACKGROUND_COLOR, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      container!.appendChild(renderer.domElement);

      // Lighting — neutral white so the brass colour in the material reads
      // accurately. A hemisphere light gives a gentle sky/ground gradient; a
      // single directional light picks out the edges without creating a warm
      // rim glow.
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
      scene.add(ambientLight);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 0.4);
      hemiLight.position.set(0, 10, 0);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
      keyLight.position.set(6, 10, 7);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.25);
      fillLight.position.set(-5, 4, -3);
      scene.add(fillLight);

      // Building group
      const buildingGroup = new THREE.Group();

      // Building layout — slightly wider spacing and a 0.02 footprint inset so
      // adjacent blocks never share coincident faces (which is what produces
      // the harsh Minecraft-style seams).
      const SPACING = 1.15;
      const FOOTPRINT_INSET = 0.04;
      const buildingData = [
        { x: -3.0, z: -1.0, w: 0.6, h: 3.5, d: 0.6 },
        { x: -2.2, z: 0.0, w: 0.5, h: 2.8, d: 0.5 },
        { x: -1.5, z: -0.5, w: 0.7, h: 4.2, d: 0.7 },
        { x: -0.8, z: 0.3, w: 0.5, h: 3.0, d: 0.5 },
        { x: -0.2, z: -0.8, w: 0.8, h: 5.0, d: 0.8 },
        { x: 0.5, z: 0.5, w: 0.6, h: 4.5, d: 0.6 },
        { x: 1.2, z: -0.3, w: 0.7, h: 3.8, d: 0.7 },
        { x: 1.8, z: 0.2, w: 0.5, h: 2.5, d: 0.5 },
        { x: 2.5, z: -0.6, w: 0.6, h: 3.2, d: 0.6 },
        { x: 3.2, z: 0.1, w: 0.5, h: 2.0, d: 0.5 },
        { x: -2.8, z: 0.8, w: 0.4, h: 1.8, d: 0.4 },
        { x: 0.0, z: 0.7, w: 0.4, h: 2.2, d: 0.4 },
        { x: 2.8, z: 0.7, w: 0.4, h: 1.5, d: 0.4 },
      ];

      // Shared material — MeshStandardMaterial with smooth (non-flat) shading.
      // Opacity is bumped up so the DoubleSide/transmission artifacts that
      // produced visible internal seams no longer apply.
      const material = new THREE.MeshStandardMaterial({
        color: 0xc9a96e,
        roughness: 0.35,
        metalness: 0.2,
        flatShading: false,
      });

      for (const b of buildingData) {
        const w = Math.max(0.1, b.w - FOOTPRINT_INSET);
        const d = Math.max(0.1, b.d - FOOTPRINT_INSET);
        const geometry = new THREE.BoxGeometry(w, b.h, d);
        // Smooth normals — BoxGeometry normals are already per-face so this is
        // belt-and-braces for the shading pass.
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(b.x * SPACING, b.h / 2 - 1, b.z * SPACING);
        buildingGroup.add(mesh);
      }

      scene.add(buildingGroup);

      // Ground plane — subtly catches the fog so the base of the skyline
      // blends into the dark background rather than ending abruptly.
      const groundGeo = new THREE.PlaneGeometry(60, 60);
      const groundMat = new THREE.MeshBasicMaterial({
        color: BACKGROUND_COLOR,
        transparent: true,
        opacity: 0.85,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1.01;
      scene.add(ground);

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
        material.dispose();
        groundGeo.dispose();
        groundMat.dispose();
        buildingGroup.traverse((obj) => {
          if ((obj as THREE.Mesh).geometry) {
            (obj as THREE.Mesh).geometry.dispose();
          }
        });
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

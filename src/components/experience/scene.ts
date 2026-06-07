/**
 * BuildingAutopilot — Immersive Experience 3D Engine (raw Three.js)
 *
 * A self-contained scene: a stylized condo tower lit cinematically, with a camera
 * that flies along a spline path driven by scroll progress (0 → 1). Brass brand
 * accents glow via UnrealBloom; particles + slow motion give the space life.
 *
 * No external 3D assets and no React-Three-Fiber — keeps it reliable on top of the
 * already-installed `three`. Exposes a tiny imperative API the React layer drives:
 *   createScene(container) -> { setProgress, resize, dispose }
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const BG = 0x06070a;
const BRASS = 0xc9a96e;
const FLOORS = 18;
const FLOOR_H = 1.15;
const TOWER_W = 6;
const TOWER_D = 4.5;

export interface SceneHandle {
  setProgress: (p: number) => void;
  resize: () => void;
  dispose: () => void;
}

export function createScene(container: HTMLElement): SceneHandle {
  const width = container.clientWidth;
  const height = container.clientHeight;

  // --- Renderer ---------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';

  // --- Scene ------------------------------------------------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, 0.018);

  // PBR reflections without any external HDRI (RoomEnvironment ships with three).
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
  camera.position.set(0, 4, 30);

  // --- Lights -----------------------------------------------------------------
  const hemi = new THREE.HemisphereLight(0x8899bb, 0x080808, 0.6);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(12, 24, 14);
  scene.add(key);

  const warm = new THREE.PointLight(BRASS, 60, 60, 2);
  warm.position.set(-6, 8, 8);
  scene.add(warm);

  const cool = new THREE.PointLight(0x4f7fff, 40, 60, 2);
  cool.position.set(8, 14, -6);
  scene.add(cool);

  // --- The tower --------------------------------------------------------------
  const tower = new THREE.Group();
  scene.add(tower);

  const slabMat = new THREE.MeshStandardMaterial({
    color: 0x14161c,
    metalness: 0.6,
    roughness: 0.35,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0c1320,
    metalness: 0.9,
    roughness: 0.08,
    envMapIntensity: 1.4,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: BRASS,
    metalness: 1,
    roughness: 0.25,
    emissive: new THREE.Color(BRASS),
    emissiveIntensity: 1.6,
  });

  // Floor slabs + glass facade per floor, with a glowing brass edge strip.
  for (let i = 0; i < FLOORS; i++) {
    const y = i * FLOOR_H;

    const slab = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W + 0.4, 0.16, TOWER_D + 0.4), slabMat);
    slab.position.y = y;
    tower.add(slab);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W, FLOOR_H * 0.78, TOWER_D), glassMat);
    glass.position.y = y + FLOOR_H * 0.5;
    tower.add(glass);

    // Brass edge strip — these are what bloom picks up.
    const strip = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W + 0.42, 0.04, 0.05), brassMat);
    strip.position.set(0, y + 0.1, TOWER_D / 2 + 0.21);
    tower.add(strip);
  }

  // Vertical brass cores at the corners.
  const coreGeo = new THREE.BoxGeometry(0.12, FLOORS * FLOOR_H, 0.12);
  for (const [cx, cz] of [
    [TOWER_W / 2, TOWER_D / 2],
    [-TOWER_W / 2, TOWER_D / 2],
    [TOWER_W / 2, -TOWER_D / 2],
    [-TOWER_W / 2, -TOWER_D / 2],
  ] as const) {
    const core = new THREE.Mesh(coreGeo, brassMat);
    core.position.set(cx, (FLOORS * FLOOR_H) / 2, cz);
    tower.add(core);
  }

  // Centre the tower vertically around its mid-height.
  tower.position.y = -(FLOORS * FLOOR_H) / 2 + 2;

  // --- Automation nodes (glowing pulses that ride up the tower) ---------------
  const nodeMat = new THREE.MeshStandardMaterial({
    color: 0x6fe3a0,
    emissive: new THREE.Color(0x47d493),
    emissiveIntensity: 3,
  });
  const nodeGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const nodes: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const n = new THREE.Mesh(nodeGeo, nodeMat);
    n.userData.phase = Math.random() * Math.PI * 2;
    n.userData.speed = 0.15 + Math.random() * 0.25;
    n.userData.x = (Math.random() - 0.5) * (TOWER_W + 2);
    n.userData.z = TOWER_D / 2 + 0.3 + Math.random() * 0.4;
    scene.add(n);
    nodes.push(n);
  }

  // --- Ground -----------------------------------------------------------------
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(80, 64),
    new THREE.MeshStandardMaterial({ color: 0x05060a, metalness: 0.8, roughness: 0.5 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -(FLOORS * FLOOR_H) / 2 + 1.9;
  scene.add(ground);

  // --- Atmosphere particles ---------------------------------------------------
  const pCount = 600;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 60;
    pPos[i * 3 + 1] = Math.random() * 40 - 8;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: 0xc9a96e,
      size: 0.06,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );
  scene.add(particles);

  // --- Camera flight path -----------------------------------------------------
  // Position curve the camera rides; look-target curve it gazes at.
  const camPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -6, 26),
    new THREE.Vector3(-9, -2, 16),
    new THREE.Vector3(-6, 4, 10),
    new THREE.Vector3(6, 9, 11),
    new THREE.Vector3(10, 14, 16),
    new THREE.Vector3(0, 10, 30),
  ]);
  const lookPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -2, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 5, 0),
    new THREE.Vector3(0, 9, 0),
    new THREE.Vector3(0, 8, 0),
    new THREE.Vector3(0, 6, 0),
  ]);

  // --- Post-processing (bloom) ------------------------------------------------
  const composer = new EffectComposer(renderer);
  composer.setSize(width, height);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.85, 0.6, 0.12);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // --- Drive --------------------------------------------------------------------
  const clock = new THREE.Clock();
  let targetP = 0;
  let currentP = 0;
  let raf = 0;
  const tmpPos = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();

  function frame() {
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    // Smoothly ease the camera toward the scroll target.
    currentP += (targetP - currentP) * 0.06;
    const p = Math.min(Math.max(currentP, 0), 1);

    camPath.getPointAt(p, tmpPos);
    lookPath.getPointAt(p, tmpLook);
    // Gentle idle sway layered on top.
    tmpPos.x += Math.sin(t * 0.3) * 0.4;
    tmpPos.y += Math.cos(t * 0.24) * 0.25;
    camera.position.copy(tmpPos);
    camera.lookAt(tmpLook);

    tower.rotation.y = Math.sin(t * 0.06) * 0.05;

    // Automation nodes drift upward and pulse.
    for (const n of nodes) {
      const yy = ((t * n.userData.speed + n.userData.phase) % 2) - 1; // -1..1 loop
      n.position.set(n.userData.x, yy * (FLOORS * FLOOR_H) * 0.5, n.userData.z);
      const s = 0.6 + Math.abs(Math.sin(t * 2 + n.userData.phase)) * 0.8;
      n.scale.setScalar(s);
    }

    particles.rotation.y = t * 0.01;

    composer.render();
  }
  frame();

  return {
    setProgress(p: number) {
      targetP = Math.min(Math.max(p, 0), 1);
    },
    resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    },
    dispose() {
      cancelAnimationFrame(raf);
      composer.dispose();
      renderer.dispose();
      pmrem.dispose();
      envTex.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else m.dispose();
        }
      });
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}

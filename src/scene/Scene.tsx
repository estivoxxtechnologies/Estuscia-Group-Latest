import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { S, M } from './state';

function face() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;

  const x = c.getContext('2d')!;

  x.fillStyle = '#d9ac45';
  x.fillRect(0, 0, 256, 256);

  x.strokeStyle = '#f3d98f';
  x.lineWidth = 7;
  x.beginPath();
  x.arc(128, 128, 112, 0, 7);
  x.stroke();

  x.lineWidth = 2;
  x.beginPath();
  x.arc(128, 128, 94, 0, 7);
  x.stroke();

  x.fillStyle = '#f7e6b0';
  x.font = 'italic 400 150px Georgia,serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('E', 128, 140);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;

  return t;
}

/**
 * Money scene:
 * - Hero gold coin
 * - Coin stack
 * - Rising emerald growth bars
 * - Orbiting coins
 * - Floating particles
 *
 * The floating brand logo and purple halo have been removed.
 */
export default function Scene({
  reduce,
  onFail,
}: {
  reduce: boolean;
  onFail: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const small = innerWidth < 820;
    const touch = matchMedia('(hover:none)').matches;

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !small,
        alpha: true,
        powerPreference: 'high-performance',
      });

      if (!renderer.getContext()) {
        throw new Error('WebGL context unavailable');
      }
    } catch {
      onFail();
      return;
    }

    renderer.setPixelRatio(
      Math.min(devicePixelRatio, small ? 1.5 : 1.75),
    );

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x03100c, 0.03);

    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;

    const cam = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const group = new THREE.Group();

    const gold = new THREE.MeshStandardMaterial({
      color: 0xe2b85a,
      metalness: 1,
      roughness: 0.28,
      envMapIntensity: 1.1,
    });

    const capMat = new THREE.MeshStandardMaterial({
      map: face(),
      metalness: 1,
      roughness: 0.35,
      envMapIntensity: 1,
    });

    // Hero gold coin
    const hero = new THREE.Group();

    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.3, 72),
      [gold, capMat, capMat],
    );

    coin.rotation.x = Math.PI / 2;
    hero.add(coin);

    hero.scale.setScalar(0.5);
    group.add(hero);

    // Stack of gold coins
    const stack = new THREE.Group();

    const sg = new THREE.CylinderGeometry(
      0.9,
      0.9,
      0.16,
      48,
    );

    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(sg, gold);

      m.position.set((i % 2) * 0.03, i * 0.17, 0);
      m.rotation.y = i;

      stack.add(m);
    }

    stack.position.set(-3, -1.9, -1);
    group.add(stack);

    // Decorative gold wireframe
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.1, 1),
      new THREE.MeshBasicMaterial({
        color: 0xe2b85a,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
      }),
    );

    group.add(wire);

    // Emerald growth bars
    const NB = 10;

    const bars = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.3, 1, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0x2fd68a,
        metalness: 0.6,
        roughness: 0.3,
        emissive: 0x06351f,
      }),
      NB,
    );

    bars.position.set(2.2, -1.8, -1.2);
    group.add(bars);

    // Orbiting gold coins
    const NC = small ? 16 : 40;

    const orb = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(
        0.17,
        0.17,
        0.045,
        24,
      ),
      gold,
      NC,
    );

    group.add(orb);
    scene.add(group);

    // Floating particles
    const n = small ? 350 : 1200;
    const pos = new Float32Array(n * 3);

    for (let i = 0; i < n * 3; i++) {
      pos[i] =
        (Math.random() - 0.5) *
        (i % 3 === 2 ? 30 : 24);
    }

    const pg = new THREE.BufferGeometry();

    pg.setAttribute(
      'position',
      new THREE.BufferAttribute(pos, 3),
    );

    const pts = new THREE.Points(
      pg,
      new THREE.PointsMaterial({
        size: 0.028,
        color: 0xf0cf7a,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    );

    scene.add(pts);

    // Lighting
    scene.add(
      new THREE.AmbientLight(0x2a5a48, 0.6),
    );

    const key = new THREE.PointLight(
      0xffd9a0,
      70,
      40,
      1.5,
    );

    key.position.set(4, 3, 5);

    const em = new THREE.PointLight(
      0x22d68a,
      40,
      40,
      1.5,
    );

    em.position.set(-5, -2, 3);

    scene.add(key, em);

    // Resize handler
    const resize = () => {
      renderer.setSize(innerWidth, innerHeight, false);

      cam.aspect = innerWidth / innerHeight;
      cam.updateProjectionMatrix();

      if (reduce) {
        draw(0);
      }
    };

    const o = new THREE.Object3D();
    const clock = new THREE.Clock();

    let raf = 0;
    let last = -1;

    function draw(T: number) {
      // Main scene movement
      group.rotation.y =
        S.rot * Math.PI * 0.5 + M.x * 0.25;

      group.rotation.x = M.y * 0.12;

      // Hero coin animation
      hero.rotation.y = T * 0.5 + S.rot * 3;

      hero.position.set(
        1.9,
        -1 + Math.sin(T * 0.8) * 0.12,
        0.8,
      );

      // Horizontal scene movement
      group.position.x +=
        ((small ? 0 : S.x) - group.position.x) * 0.06;

      // Camera movement
      cam.position.z +=
        ((S.z - S.pulse * 2.6) - cam.position.z) * 0.08;

      cam.position.x +=
        (M.x * 0.4 - cam.position.x) * 0.04;

      cam.lookAt(0, 0, 0);

      const fov = 42 + S.pulse * 14;

      if (Math.abs(cam.fov - fov) > 0.05) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
      }

      if (Math.abs(S.pulse - last) > 0.005) {
        last = S.pulse;

        document.documentElement.style.setProperty(
          '--pulse',
          S.pulse.toFixed(3),
        );
      }

      // Wireframe animation
      (
        wire.material as THREE.MeshBasicMaterial
      ).opacity = 0.08 + S.wire * 0.4;

      wire.rotation.y = -T * 0.1;

      wire.scale.setScalar(1 + S.spread * 0.3);

      // Coin stack animation
      stack.rotation.y = T * 0.2;

      // Lighting animation
      key.intensity = 45 + S.glow * 50;

      // Particle animation
      pts.rotation.y = T * 0.01 + S.rot * 0.5;

      pts.scale.setScalar(1 + S.pulse * 0.6);

      // Growth bar animation
      for (let i = 0; i < NB; i++) {
        const h =
          (0.4 + i * 0.32) *
          Math.max(
            0.02,
            Math.min(1, S.grow * 12 - i),
          );

        o.position.set(i * 0.42 - 2, h / 2, 0);
        o.scale.set(1, h, 1);
        o.rotation.set(0, 0, 0);

        o.updateMatrix();
        bars.setMatrixAt(i, o.matrix);
      }

      bars.instanceMatrix.needsUpdate = true;

      // Orbiting coin animation
      for (let i = 0; i < NC; i++) {
        const a =
          (i / NC) * Math.PI * 2 + T * 0.15;

        const r = 3.3 + S.spread * 1.2;

        o.position.set(
          Math.cos(a) * r,
          Math.sin(a * 3 + T) * 0.5,
          Math.sin(a) * r * 0.6,
        );

        o.rotation.set(a * 2 + T, a, 0);

        o.scale.setScalar(0.6 + S.spread * 0.5);

        o.updateMatrix();
        orb.setMatrixAt(i, o.matrix);
      }

      orb.instanceMatrix.needsUpdate = true;

      renderer.render(scene, cam);
    }

    // Animation loop
    const loop = () => {
      draw(clock.getElapsedTime());
      raf = requestAnimationFrame(loop);
    };

    // Pointer interaction
    const move = (e: PointerEvent) => {
      M.x = (e.clientX / innerWidth) * 2 - 1;
      M.y = (e.clientY / innerHeight) * 2 - 1;
    };

    resize();

    addEventListener('resize', resize);

    if (!reduce) {
      loop();

      if (!touch) {
        addEventListener('pointermove', move);
      }
    }

    // Cleanup
    return () => {
      cancelAnimationFrame(raf);

      removeEventListener('resize', resize);
      removeEventListener('pointermove', move);

      scene.traverse((x) => {
        const m = x as THREE.Mesh;
        m.geometry?.dispose();
      });

      gold.dispose();
      capMat.map?.dispose();
      capMat.dispose();

      pg.dispose();
      pts.material.dispose();
      bars.material.dispose();
      orb.material.dispose();
      wire.material.dispose();

      scene.environment?.dispose();

      pm.dispose();
      renderer.dispose();
    };
  }, [reduce, onFail]);

  return (
    <canvas
      id="gl"
      ref={ref}
      aria-hidden="true"
    />
  );
}
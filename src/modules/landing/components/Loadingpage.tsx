"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

/**
 * Loader de TRANSICIÓN.
 *
 * ── Qué cambió y por qué ────────────────────────────────────────────────────
 * Antes esto era una pantalla de carga falsa: `Loadingwrapper` la montaba en
 * cada entrada a la home y un `setTimeout` la mantenía 2s exactos mostrando una
 * barra de progreso que contaba de 0 a 100 sin medir absolutamente nada. Se veía
 * siempre, incluso cuando no había nada que esperar, y era 2s de fricción pura
 * entre el usuario y la landing.
 *
 * Ahora este componente NO decide cuándo mostrarse ni cuándo irse: lo monta y lo
 * desmonta el propio router. Vive en los `loading.tsx` de cada segmento de ruta
 * (App Router), que React monta mientras el segmento está realmente cargando y
 * desmonta apenas termina. Si no hay nada que esperar, no se monta.
 *
 * ── El gate de {APPEAR_DELAY_MS}ms ──────────────────────────────────────────
 * Una navegación cacheada tarda ~50ms. Montar un loader a pantalla completa por
 * 50ms es un flash molesto — peor que no mostrar nada. Por eso el componente se
 * monta transparente y no pinta NADA durante los primeros {APPEAR_DELAY_MS}ms.
 *
 * Ojo con la distinción, porque es justo lo que se pidió evitar: esto NO demora
 * la página. La navegación termina cuando termina; lo único que se demora es la
 * aparición del overlay. Navegación rápida → el loader nunca llega a verse.
 * Navegación lenta → aparece y acompaña.
 *
 * La escena 3D tampoco se inicializa hasta pasado el gate: una transición rápida
 * no paga el costo de levantar un contexto WebGL que nadie va a ver.
 */

const FACTS = [
  { emoji: "🏠", titulo: "Casa propia, sueño argentino", texto: "El 73% de los argentinos prefiere vivir en casa propia antes que alquilar." },
  { emoji: "📈", titulo: "Córdoba en alza", texto: "Los departamentos en Córdoba capital aumentaron un 18% de valor en los últimos 2 años." },
  { emoji: "🌍", titulo: "El metro más caro del mundo", texto: "Hong Kong tiene los metros cuadrados más caros del mundo: USD 28.000/m²." },
  { emoji: "🏗️", titulo: "Tiempo de construcción", texto: "Se tarda en promedio 18 meses construir una casa desde el permiso hasta la entrega." },
  { emoji: "🔑", titulo: "Vendé más rápido", texto: "El 60% de las operaciones inmobiliarias se cierran en los primeros 3 meses de publicación." },
  { emoji: "🌿", titulo: "El poder del verde", texto: "Las casas con jardín se venden un 12% más rápido que las sin espacios verdes." },
  { emoji: "📸", titulo: "Fotos que venden", texto: "Propiedades con fotos profesionales reciben 4x más consultas que las sin fotos." },
  { emoji: "💡", titulo: "Luz = valor", texto: "Una buena iluminación puede aumentar hasta un 10% el valor percibido de una propiedad." },
  { emoji: "🏙️", titulo: "Nueva Córdoba lidera", texto: "Nueva Córdoba es el barrio con mayor demanda de alquiler estudiantil de Argentina." },
  { emoji: "📊", titulo: "Precio en Córdoba", texto: "El precio promedio de un departamento en Córdoba capital es de USD 1.800/m²." },
  { emoji: "🤝", titulo: "El boca a boca funciona", texto: "El 45% de las ventas inmobiliarias se realizan a través de recomendaciones." },
  { emoji: "🏆", titulo: "Vivir cerca de plazas", texto: "Las propiedades cerca de plazas o parques valen entre un 8% y 15% más." },
];

/** Halos verdes de fondo. Decorativos: flotan desfasados entre sí. */
const HALOS = [
  { size: 320, top: "-10%", left: "-8%", opacity: 0.15, delay: "0s", dur: "7s" },
  { size: 180, top: "5%", left: "70%", opacity: 0.12, delay: "1s", dur: "5s" },
  { size: 240, top: "65%", left: "78%", opacity: 0.12, delay: "0.5s", dur: "6s" },
  { size: 140, top: "72%", left: "-4%", opacity: 0.12, delay: "1.5s", dur: "4.5s" },
  { size: 90, top: "40%", left: "88%", opacity: 0.1, delay: "2s", dur: "5.5s" },
  { size: 60, top: "20%", left: "15%", opacity: 0.1, delay: "0.8s", dur: "6.5s" },
  { size: 200, top: "80%", left: "40%", opacity: 0.1, delay: "1.2s", dur: "8s" },
];

const APPEAR_DELAY_MS = 250;

/** Ancho máximo de la escena 3D. Por debajo de esto se achica con el viewport. */
const SCENE_MAX_W = 420;
/** Alto de la escena como proporción del ancho. */
const SCENE_RATIO = 0.8;

export default function LoadingPage() {
  const [visible, setVisible] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const mountRef = useRef<HTMLDivElement>(null);

  // Gate de aparición — ver el comentario de arriba.
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const nextFact = useCallback(() => setFactIndex((i) => (i + 1) % FACTS.length), []);

  // ── Escena 3D ──────────────────────────────────────────────────────────────
  // `visible` en las dependencias, y no un montaje incondicional: mientras el
  // gate no se abre, `mountRef.current` es null y el efecto sale sin construir
  // nada. Esa es la optimización que evita levantar WebGL en transiciones cortas.
  useEffect(() => {
    const el = mountRef.current;
    if (!visible || !el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(9, 7, 11);
    camera.lookAt(0, 0.5, 0);

    // La escena se adapta al ancho disponible en vez de quedar clavada en
    // 520×420. Ese tamaño fijo era el que desbordaba el contenedor en pantallas
    // chicas y descolocaba todo lo que venía abajo.
    const resize = () => {
      const w = Math.min(el.clientWidth || SCENE_MAX_W, SCENE_MAX_W);
      const h = Math.round(w * SCENE_RATIO);
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = `${w}px`;
      renderer.domElement.style.height = `${h}px`;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // ── Iluminación ────────────────────────────────────────
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0xc8e6c9, 0.7));

    const sun = new THREE.DirectionalLight(0xfff8e7, 2.0);
    sun.position.set(8, 12, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 40;
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    sun.shadow.bias = -0.001;
    sun.shadow.radius = 3;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xddeeff, 0.5);
    fill.position.set(-6, 4, -3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffeedd, 0.3);
    rim.position.set(0, 2, -8);
    scene.add(rim);

    const doorLight = new THREE.PointLight(0xffcc66, 0.8, 4);
    doorLight.position.set(0, 0.8, 2.2);
    scene.add(doorLight);

    // ── Todo gira junto (isla + casa) ──────────────────────
    const world = new THREE.Group();
    scene.add(world);

    // ── Materiales ─────────────────────────────────────────
    const mGrassTop = new THREE.MeshStandardMaterial({ color: 0x5a9e3a, roughness: 0.85 });
    const mGrassSide = new THREE.MeshStandardMaterial({ color: 0x4a8a2e, roughness: 0.9 });
    const mDirt = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.95 });
    const mWall = new THREE.MeshStandardMaterial({ color: 0xf2ede2, roughness: 0.85 });
    const mWall2 = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.9 });
    const mRoof = new THREE.MeshStandardMaterial({ color: 0xb03a2e, roughness: 0.7 });
    const mRoofDark = new THREE.MeshStandardMaterial({ color: 0x922b21, roughness: 0.8 });
    const mRoofEdge = new THREE.MeshStandardMaterial({ color: 0x922b21, roughness: 0.75 });
    const mWin = new THREE.MeshStandardMaterial({ color: 0x85c1e9, transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.2 });
    const mDoor = new THREE.MeshStandardMaterial({ color: 0x5d3a1a, roughness: 0.6, metalness: 0.1 });
    const mDoorFrame = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    const mPath = new THREE.MeshStandardMaterial({ color: 0xd4c5a9, roughness: 0.95 });
    const mChim = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.85 });
    const mChimTop = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9 });
    const mFrame = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.6 });
    const mGold = new THREE.MeshStandardMaterial({ color: 0xf0c040, roughness: 0.3, metalness: 0.8 });
    const mTree = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.9 });
    const mTreeDark = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.9 });
    const mTrunk = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.9 });
    const mBush = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.9 });
    const mFence = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });

    // ── ISLA FLOTANTE — 3 capas con grosor visible ─────────
    const islandTop = new THREE.Mesh(new THREE.BoxGeometry(11, 0.35, 11), mGrassTop);
    islandTop.position.y = 0.17;
    islandTop.receiveShadow = true;
    world.add(islandTop);

    const islandMid = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.4, 10.8), mGrassSide);
    islandMid.position.y = -0.2;
    islandMid.castShadow = true;
    world.add(islandMid);

    const islandBot = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.5, 10.5), mDirt);
    islandBot.position.y = -0.6;
    islandBot.castShadow = true;
    world.add(islandBot);

    const shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(5.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.1 })
    );
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = -2.2;
    world.add(shadowDisc);

    // ── Camino de entrada ──────────────────────────────────
    const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.0), mPath);
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(0, 0.36, 3.2);
    pathMesh.receiveShadow = true;
    world.add(pathMesh);

    for (let i = 0; i < 5; i++) {
      const stone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.13, 0.05, 6),
        new THREE.MeshStandardMaterial({ color: 0xc0bdb5, roughness: 0.95 })
      );
      stone.position.set(i % 2 === 0 ? -0.26 : 0.26, 0.38, 2.1 + i * 0.5);
      world.add(stone);
    }

    // ── CASA ───────────────────────────────────────────────
    const house = new THREE.Group();
    world.add(house);

    const foundation = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.18, 4.0), mWall2);
    foundation.position.y = 0.44;
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    house.add(foundation);

    const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 3.2), mWall);
    body.position.y = 1.61;
    body.castShadow = true;
    body.receiveShadow = true;
    house.add(body);

    const baseboard = new THREE.Mesh(new THREE.BoxGeometry(3.62, 0.22, 3.22), mWall2);
    baseboard.position.y = 0.62;
    baseboard.castShadow = true;
    house.add(baseboard);

    // Techo
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-2.1, 0);
    roofShape.lineTo(0, 1.5);
    roofShape.lineTo(2.1, 0);
    roofShape.closePath();
    const roof = new THREE.Mesh(
      new THREE.ExtrudeGeometry(roofShape, { depth: 3.4, bevelEnabled: false }),
      mRoof
    );
    roof.position.set(0, 2.71, -1.7);
    roof.castShadow = true;
    house.add(roof);

    const eaveFront = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.08, 0.35), mRoofEdge);
    eaveFront.position.set(0, 2.71, 1.87);
    eaveFront.castShadow = true;
    house.add(eaveFront);
    const eaveBack = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.08, 0.35), mRoofEdge);
    eaveBack.position.set(0, 2.71, -1.87);
    eaveBack.castShadow = true;
    house.add(eaveBack);
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 3.6), mRoofDark);
    ridge.position.set(0, 4.23, 0);
    house.add(ridge);

    // Chimenea
    const chimBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.1, 0.42), mChim);
    chimBase.position.set(0.85, 3.65, -0.5);
    chimBase.castShadow = true;
    house.add(chimBase);
    const chimCap = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.54), mChimTop);
    chimCap.position.set(0.85, 4.22, -0.5);
    house.add(chimCap);

    // Ventanas
    const addWindow = (x: number, y: number, z: number, rY = 0) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.82, 0.08), mFrame));
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.06), mWin);
      glass.position.z = 0.01;
      g.add(glass);
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.045, 0.08), mFrame);
      hBar.position.z = 0.02;
      g.add(hBar);
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.62, 0.08), mFrame);
      vBar.position.z = 0.02;
      g.add(vBar);
      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.07, 0.15), mFrame);
      sill.position.set(0, -0.45, 0.06);
      g.add(sill);
      g.position.set(x, y, z);
      g.rotation.y = rY;
      house.add(g);
    };
    addWindow(-0.9, 1.63, 1.61);
    addWindow(0.9, 1.63, 1.61);
    addWindow(1.81, 1.63, 0.3, Math.PI / 2);
    addWindow(-1.81, 1.63, 0.3, -Math.PI / 2);
    addWindow(0, 1.63, -1.61, Math.PI);

    // Puerta
    const doorFrameMesh = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.36, 0.1), mDoorFrame);
    doorFrameMesh.position.set(0, 1.09, 1.61);
    house.add(doorFrameMesh);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.2, 0.08), mDoor);
    door.position.set(0, 1.09, 1.66);
    door.castShadow = true;
    house.add(door);
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.42, 0.04), mChim);
    p1.position.set(0, 1.33, 1.71);
    house.add(p1);
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.42, 0.04), mChim);
    p2.position.set(0, 0.79, 1.71);
    house.add(p2);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), mGold);
    knob.position.set(0.32, 1.09, 1.72);
    house.add(knob);
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.42), mPath);
    step1.position.set(0, 0.43, 1.84);
    step1.castShadow = true;
    house.add(step1);
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.1, 0.3), mPath);
    step2.position.set(0, 0.53, 2.06);
    house.add(step2);

    // ── ÁRBOLES en esquinas y bordes ───────────────────────
    const addTree = (x: number, z: number, scale = 1.0) => {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.14 * scale, 0.7 * scale, 8), mTrunk);
      trunk.position.y = 0.35 * scale;
      trunk.castShadow = true;
      g.add(trunk);
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.75 * scale, 1.0 * scale, 7), mTree);
      c1.position.y = 1.1 * scale;
      c1.castShadow = true;
      g.add(c1);
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.6 * scale, 0.85 * scale, 7), mTree);
      c2.position.y = 1.55 * scale;
      c2.castShadow = true;
      g.add(c2);
      const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.42 * scale, 0.7 * scale, 7), mTreeDark);
      c3.position.y = 1.92 * scale;
      c3.castShadow = true;
      g.add(c3);
      g.position.set(x, 0.35, z);
      world.add(g);
    };

    addTree(-4.0, -4.0, 1.15);
    addTree(4.0, -4.0, 1.05);
    addTree(-4.2, 3.8, 0.9);
    addTree(4.2, 3.8, 0.95);
    addTree(-4.3, -0.5, 0.85);
    addTree(4.3, -0.5, 0.85);

    // ── ARBUSTOS bordeando la isla ─────────────────────────
    const addBush = (x: number, z: number, s = 1.0) => {
      const g = new THREE.Group();
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.28 * s, 7, 6), mBush);
      s1.position.y = 0.22 * s;
      s1.castShadow = true;
      g.add(s1);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 7, 6), mBush);
      s2.position.set(0.24 * s, 0.18 * s, 0);
      s2.castShadow = true;
      g.add(s2);
      const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 7, 6), mBush);
      s3.position.set(-0.2 * s, 0.16 * s, 0.1 * s);
      s3.castShadow = true;
      g.add(s3);
      g.position.set(x, 0.35, z);
      world.add(g);
    };

    addBush(-3.2, 4.5, 0.85); addBush(-1.6, 4.5, 0.8);
    addBush(1.6, 4.5, 0.8); addBush(3.2, 4.5, 0.85);
    addBush(-3.0, -4.3, 0.9); addBush(-1.4, -4.3, 0.8);
    addBush(1.4, -4.3, 0.8); addBush(3.0, -4.3, 0.9);
    addBush(-4.5, -2.5, 0.8); addBush(-4.5, 0.8, 0.85); addBush(-4.5, 2.5, 0.8);
    addBush(4.5, -2.5, 0.8); addBush(4.5, 0.8, 0.85); addBush(4.5, 2.5, 0.8);
    addBush(-2.0, 1.85, 0.9); addBush(2.0, 1.85, 0.85);
    addBush(-2.0, 0.4, 0.75); addBush(2.0, 0.4, 0.8);

    // ── VALLA ──────────────────────────────────────────────
    const addFencePost = (x: number, z: number) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), mFence);
      post.position.set(x, 0.7, z);
      post.castShadow = true;
      world.add(post);
    };
    const addFenceRail = (x: number, z: number, w: number, rY = 0) => {
      [0.62, 0.38].forEach((h) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.05), mFence);
        rail.position.set(x, h, z);
        rail.rotation.y = rY;
        world.add(rail);
      });
    };
    for (let i = 0; i < 4; i++) addFencePost(-2.6 + i * 0.5, 2.15);
    addFenceRail(-1.35, 2.15, 1.55);
    for (let i = 0; i < 4; i++) addFencePost(0.6 + i * 0.5, 2.15);
    addFenceRail(1.35, 2.15, 1.55);
    for (let i = 0; i < 5; i++) addFencePost(-2.6, -0.6 + i * 0.65);
    addFenceRail(-2.6, 0.7, 2.8, Math.PI / 2);
    for (let i = 0; i < 5; i++) addFencePost(2.6, -0.6 + i * 0.65);
    addFenceRail(2.6, 0.7, 2.8, Math.PI / 2);

    // ── ANIMACIÓN ──────────────────────────────────────────
    let animId: number;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.008;

      world.rotation.y += 0.004;
      world.position.y = Math.sin(time) * 0.12;

      sun.position.x = 8 + Math.sin(time * 0.4) * 1.5;
      sun.position.z = 6 + Math.cos(time * 0.4) * 1.5;

      doorLight.intensity = 0.8 + Math.sin(time * 2.6) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [visible]);

  // Antes del gate no se pinta nada — ni un fondo, ni un flash blanco.
  if (!visible) return null;

  const fact = FACTS[factIndex];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando"
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden bg-surface [animation:loader-in_.28s_ease-out_both]"
    >
      {/* Halos decorativos */}
      {HALOS.map((h, i) => (
        <span
          key={i}
          aria-hidden
          className="loader-halo pointer-events-none absolute rounded-full bg-brand-700"
          style={{
            width: h.size,
            height: h.size,
            top: h.top,
            left: h.left,
            opacity: h.opacity,
            animation: `loader-float ${h.dur} ease-in-out infinite`,
            animationDelay: h.delay,
          }}
        />
      ))}

      {/* ── COLUMNA CENTRAL ──
          Un único contenedor con ancho común para TODOS los bloques (escena,
          textos, barra y tarjeta). Antes cada bloque tenía su propio ancho
          (520 / 460 / 500px) y ninguno coincidía con el de al lado: por eso la
          tarjeta de datos se leía descentrada respecto de la isla. Ahora
          comparten eje y ancho, y el `min-h-0` deja que la columna se comprima
          en pantallas bajas en vez de desbordar. */}
      <div className="relative z-10 flex w-full min-h-0 max-w-[420px] flex-col items-center px-5">

        {/* Escena 3D — se centra sola porque el contenedor la limita. */}
        <div ref={mountRef} className="flex w-full shrink justify-center" />

        <h1 className="mt-1 text-center text-xl font-extrabold tracking-tight text-brand-800">
          Cargando tu experiencia
        </h1>
        <p className="mt-1 text-center text-[13px] font-medium text-ink-500">
          Preparando todo para vos…
        </p>

        {/* Barra indeterminada — no miente un porcentaje. */}
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
          <div
            className="loader-bar h-full w-full rounded-full [animation:loader-indeterminate_1.4s_cubic-bezier(.65,.05,.36,1)_infinite]"
            style={{ background: "var(--gradient-brand)" }}
          />
        </div>

        {/* ── Tarjeta de datos rotativos ── */}
        <button
          type="button"
          onClick={nextFact}
          aria-label="Ver el siguiente dato"
          className="group mt-6 w-full cursor-pointer overflow-hidden rounded-2xl border border-ink-200 bg-white text-left shadow-[0_4px_20px_-6px_rgba(10,12,11,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-700/40 hover:shadow-[0_14px_34px_-12px_rgba(6,57,35,0.3)] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-2 bg-brand-700 px-4 py-2">
            <span className="text-[10px] font-black tracking-[0.16em] text-white uppercase">
              ¿Sabías que…?
            </span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white">
              {factIndex + 1} / {FACTS.length}
            </span>
          </div>

          {/* `key` en el contenido: al cambiar de dato React reemplaza el nodo y
              la animación de entrada se vuelve a disparar sola. Antes esto se
              hacía con dos `setTimeout` encadenados y un flag de opacidad. */}
          <div
            key={factIndex}
            className="flex items-start gap-3.5 px-4 py-4 [animation:loader-fact-in_.3s_ease-out_both]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-2xl">
              {fact.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-ink-900">{fact.titulo}</span>
              <span className="mt-1 block text-xs leading-relaxed font-medium text-ink-500">
                {fact.texto}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-ink-100 px-4 py-2.5">
            <span className="flex items-center gap-1" aria-hidden>
              {FACTS.map((_, i) => (
                <span
                  key={i}
                  className={`block h-1 rounded-full transition-all duration-300 ${
                    i === factIndex ? "w-4 bg-brand-700" : "w-1 bg-ink-200"
                  }`}
                />
              ))}
            </span>
            <span className="text-[11px] font-semibold text-ink-400 transition-colors group-hover:text-brand-700">
              Tocá para siguiente
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

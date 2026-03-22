"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

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

const CIRCLES = [
  { size: 320, top: "-10%", left: "-8%",  opacity: 0.15, delay: "0s",   dur: "7s"  },
  { size: 180, top: "5%",   left: "70%",  opacity: 0.12, delay: "1s",   dur: "5s"  },
  { size: 240, top: "65%",  left: "78%",  opacity: 0.12, delay: "0.5s", dur: "6s"  },
  { size: 140, top: "72%",  left: "-4%",  opacity: 0.12, delay: "1.5s", dur: "4.5s"},
  { size: 90,  top: "40%",  left: "88%",  opacity: 0.10, delay: "2s",   dur: "5.5s"},
  { size: 60,  top: "20%",  left: "15%",  opacity: 0.10, delay: "0.8s", dur: "6.5s"},
  { size: 200, top: "80%",  left: "40%",  opacity: 0.10, delay: "1.2s", dur: "8s"  },
];

export default function LoadingPage({ onComplete }: { onComplete?: () => void }) {
  const mountRef    = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [progress, setProgress]   = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [factAnim, setFactAnim]   = useState(true);
  const [done, setDone]           = useState(false);

  const changeFact = useCallback(() => {
    setFactAnim(false);
    setTimeout(() => { setFactIndex(i => (i + 1) % FACTS.length); setFactAnim(true); }, 300);
  }, []);

  useEffect(() => {
    let frame: ReturnType<typeof setTimeout>;
    let cur = 0;
    const tick = () => {
      cur += 16;
      const pct = Math.min(100, Math.round((cur / 2000) * 100));
      setProgress(pct);
      if (pct < 100) { frame = setTimeout(tick, 16); }
      else { setTimeout(() => { setDone(true); onComplete?.(); }, 400); }
    };
    frame = setTimeout(tick, 16);
    return () => clearTimeout(frame);
  }, [onComplete]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el || rendererRef.current) return;

    const W = 520, H = 320;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 100);
    camera.position.set(7, 6, 9);
    camera.lookAt(0, 0.5, 0);

    // ── Iluminación ────────────────────────────────────────
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0xc8e6c9, 0.7));

    const sun = new THREE.DirectionalLight(0xfff8e7, 2.0);
    sun.position.set(8, 12, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.width  = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near   = 0.5;
    sun.shadow.camera.far    = 40;
    sun.shadow.camera.left   = -10;
    sun.shadow.camera.right  =  10;
    sun.shadow.camera.top    =  10;
    sun.shadow.camera.bottom = -10;
    sun.shadow.bias   = -0.001;
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
    const mGrassTop  = new THREE.MeshStandardMaterial({ color: 0x5a9e3a, roughness: 0.85 });
    const mGrassSide = new THREE.MeshStandardMaterial({ color: 0x4a8a2e, roughness: 0.9  });
    const mDirt      = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.95 });
    const mWall      = new THREE.MeshStandardMaterial({ color: 0xf2ede2, roughness: 0.85 });
    const mWall2     = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.9  });
    const mRoof      = new THREE.MeshStandardMaterial({ color: 0xb03a2e, roughness: 0.7  });
    const mRoofDark  = new THREE.MeshStandardMaterial({ color: 0x922b21, roughness: 0.8  });
    const mRoofEdge  = new THREE.MeshStandardMaterial({ color: 0x922b21, roughness: 0.75 });
    const mWin       = new THREE.MeshStandardMaterial({ color: 0x85c1e9, transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.2 });
    const mWinGlow   = new THREE.MeshStandardMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.1, emissive: 0xfff3b0, emissiveIntensity: 0.3 });
    const mDoor      = new THREE.MeshStandardMaterial({ color: 0x5d3a1a, roughness: 0.6, metalness: 0.1 });
    const mDoorFrame = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    const mPath      = new THREE.MeshStandardMaterial({ color: 0xd4c5a9, roughness: 0.95 });
    const mChim      = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.85 });
    const mChimTop   = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9  });
    const mFrame     = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.6  });
    const mGold      = new THREE.MeshStandardMaterial({ color: 0xf0c040, roughness: 0.3, metalness: 0.8 });
    const mTree      = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.9  });
    const mTreeDark  = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.9  });
    const mTrunk     = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.9  });
    const mBush      = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.9  });
    const mFence     = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7  });

    // ── ISLA FLOTANTE — 3 capas con grosor visible ─────────
    // Capa top: pasto
    const islandTop = new THREE.Mesh(new THREE.BoxGeometry(11, 0.35, 11), mGrassTop);
    islandTop.position.y = 0.17;
    islandTop.receiveShadow = true;
    world.add(islandTop);

    // Capa media: franja verde oscura
    const islandMid = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.4, 10.8), mGrassSide);
    islandMid.position.y = -0.2;
    islandMid.castShadow = true;
    world.add(islandMid);

    // Capa inferior: tierra
    const islandBot = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.5, 10.5), mDirt);
    islandBot.position.y = -0.6;
    islandBot.castShadow = true;
    world.add(islandBot);

    // Sombra bajo la isla
    const shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(5.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.10 })
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
      stone.position.set((i % 2 === 0 ? -0.26 : 0.26), 0.38, 2.1 + i * 0.5);
      world.add(stone);
    }

    // ── CASA ───────────────────────────────────────────────
    const house = new THREE.Group();
    world.add(house);

    const foundation = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.18, 4.0), mWall2);
    foundation.position.y = 0.44;
    foundation.castShadow = true; foundation.receiveShadow = true;
    house.add(foundation);

    const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 3.2), mWall);
    body.position.y = 1.61;
    body.castShadow = true; body.receiveShadow = true;
    house.add(body);

    const baseboard = new THREE.Mesh(new THREE.BoxGeometry(3.62, 0.22, 3.22), mWall2);
    baseboard.position.y = 0.62; baseboard.castShadow = true;
    house.add(baseboard);

    // Techo
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-2.1, 0); roofShape.lineTo(0, 1.5); roofShape.lineTo(2.1, 0);
    roofShape.closePath();
    const roof = new THREE.Mesh(
      new THREE.ExtrudeGeometry(roofShape, { depth: 3.4, bevelEnabled: false }), mRoof
    );
    roof.position.set(0, 2.71, -1.7); roof.castShadow = true;
    house.add(roof);

    const eaveFront = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.08, 0.35), mRoofEdge);
    eaveFront.position.set(0, 2.71, 1.87); eaveFront.castShadow = true;
    house.add(eaveFront);
    const eaveBack = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.08, 0.35), mRoofEdge);
    eaveBack.position.set(0, 2.71, -1.87); eaveBack.castShadow = true;
    house.add(eaveBack);
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 3.6), mRoofDark);
    ridge.position.set(0, 4.23, 0);
    house.add(ridge);

    // Chimenea
    const chimBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.1, 0.42), mChim);
    chimBase.position.set(0.85, 3.65, -0.5); chimBase.castShadow = true;
    house.add(chimBase);
    const chimCap = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.54), mChimTop);
    chimCap.position.set(0.85, 4.22, -0.5);
    house.add(chimCap);

    // Ventanas
    const addWindow = (x: number, y: number, z: number, rY = 0, glowing = false) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.82, 0.08), mFrame));
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.06), glowing ? mWinGlow : mWin);
      glass.position.z = 0.01; g.add(glass);
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.045, 0.08), mFrame);
      hBar.position.z = 0.02; g.add(hBar);
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.62, 0.08), mFrame);
      vBar.position.z = 0.02; g.add(vBar);
      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.07, 0.15), mFrame);
      sill.position.set(0, -0.45, 0.06); g.add(sill);
      g.position.set(x, y, z); g.rotation.y = rY;
      house.add(g);
    };
    addWindow(-0.9, 1.63, 1.61, 0, false);
    addWindow( 0.9, 1.63, 1.61, 0, false);
    addWindow( 1.81, 1.63, 0.3, Math.PI / 2, false);
    addWindow(-1.81, 1.63, 0.3, -Math.PI / 2, false);
    addWindow(0, 1.63, -1.61, Math.PI, false);

    // Puerta
    const doorFrameMesh = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.36, 0.1), mDoorFrame);
    doorFrameMesh.position.set(0, 1.09, 1.61);
    house.add(doorFrameMesh);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.2, 0.08), mDoor);
    door.position.set(0, 1.09, 1.66); door.castShadow = true; house.add(door);
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.42, 0.04), mChim);
    p1.position.set(0, 1.33, 1.71); house.add(p1);
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.42, 0.04), mChim);
    p2.position.set(0, 0.79, 1.71); house.add(p2);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), mGold);
    knob.position.set(0.32, 1.09, 1.72); house.add(knob);
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.42), mPath);
    step1.position.set(0, 0.43, 1.84); step1.castShadow = true; house.add(step1);
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.1, 0.3), mPath);
    step2.position.set(0, 0.53, 2.06); house.add(step2);

    // ── ÁRBOLES en esquinas y bordes ───────────────────────
    const addTree = (x: number, z: number, scale = 1.0) => {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1*scale, 0.14*scale, 0.7*scale, 8), mTrunk);
      trunk.position.y = 0.35*scale; trunk.castShadow = true; g.add(trunk);
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.75*scale, 1.0*scale, 7), mTree);
      c1.position.y = 1.1*scale; c1.castShadow = true; g.add(c1);
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.6*scale, 0.85*scale, 7), mTree);
      c2.position.y = 1.55*scale; c2.castShadow = true; g.add(c2);
      const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.42*scale, 0.7*scale, 7), mTreeDark);
      c3.position.y = 1.92*scale; c3.castShadow = true; g.add(c3);
      g.position.set(x, 0.35, z);
      world.add(g);
    };

    // 4 esquinas + lados
    addTree(-4.0, -4.0, 1.15);
    addTree( 4.0, -4.0, 1.05);
    addTree(-4.2,  3.8, 0.9);
    addTree( 4.2,  3.8, 0.95);
    addTree(-4.3, -0.5, 0.85);
    addTree( 4.3, -0.5, 0.85);

    // ── ARBUSTOS bordeando la isla ─────────────────────────
    const addBush = (x: number, z: number, s = 1.0) => {
      const g = new THREE.Group();
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.28*s, 7, 6), mBush);
      s1.position.y = 0.22*s; s1.castShadow = true; g.add(s1);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.22*s, 7, 6), mBush);
      s2.position.set(0.24*s, 0.18*s, 0); s2.castShadow = true; g.add(s2);
      const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.2*s, 7, 6), mBush);
      s3.position.set(-0.2*s, 0.16*s, 0.1*s); s3.castShadow = true; g.add(s3);
      g.position.set(x, 0.35, z);
      world.add(g);
    };

    // Borde frente
    addBush(-3.2, 4.5, 0.85); addBush(-1.6, 4.5, 0.8);
    addBush( 1.6, 4.5, 0.8);  addBush( 3.2, 4.5, 0.85);
    // Borde atrás
    addBush(-3.0, -4.3, 0.9); addBush(-1.4, -4.3, 0.8);
    addBush( 1.4, -4.3, 0.8); addBush( 3.0, -4.3, 0.9);
    // Borde lados
    addBush(-4.5, -2.5, 0.8); addBush(-4.5, 0.8, 0.85); addBush(-4.5, 2.5, 0.8);
    addBush( 4.5, -2.5, 0.8); addBush( 4.5, 0.8, 0.85); addBush( 4.5, 2.5, 0.8);
    // Junto a la casa
    addBush(-2.0, 1.85, 0.9); addBush( 2.0, 1.85, 0.85);
    addBush(-2.0, 0.4,  0.75); addBush( 2.0, 0.4, 0.8);

    // ── VALLA ──────────────────────────────────────────────
    const addFencePost = (x: number, z: number) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), mFence);
      post.position.set(x, 0.7, z); post.castShadow = true; world.add(post);
    };
    const addFenceRail = (x: number, z: number, w: number, rY = 0) => {
      [0.62, 0.38].forEach(h => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.05), mFence);
        rail.position.set(x, h, z); rail.rotation.y = rY; world.add(rail);
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

      // Toda la isla gira
      world.rotation.y += 0.004;

      // Flotación suave
      world.position.y = Math.sin(time) * 0.12;

      // Sol se mueve lentamente
      sun.position.x = 8 + Math.sin(time * 0.4) * 1.5;
      sun.position.z = 6 + Math.cos(time * 0.4) * 1.5;

      // Parpadeo sutil de luz interior
      doorLight.intensity = 0.8 + Math.sin(time * 2.6) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      rendererRef.current = null;
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  if (done) return null;

  const fact = FACTS[factIndex];

  return (
    <>
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#f8faf8", overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        {CIRCLES.map((c, i) => (
          <span key={i} style={{
            position: "absolute", width: c.size, height: c.size,
            borderRadius: "50%", background: "#0b7a4b",
            opacity: c.opacity, top: c.top, left: c.left,
            animation: `floatC ${c.dur} ease-in-out infinite`,
            animationDelay: c.delay, pointerEvents: "none",
          }} />
        ))}

        {/* Isla 3D */}
        <div ref={mountRef} style={{ width: 520, height: 320, flexShrink: 0, overflow: "hidden", zIndex: 1 }} />

        <h1 style={{ color: "#0b7a4b", fontSize: 20, fontWeight: 800, margin: "0 0 2px", zIndex: 1, letterSpacing: "-0.02em" }}>
          Cargando tu experiencia
        </h1>
        <p style={{ color: "#9ca3af", fontSize: 12, fontWeight: 500, margin: "0 0 14px", zIndex: 1 }}>
          Preparando todo para vos...
        </p>

        <div style={{ width: "min(460px, 86vw)", zIndex: 1 }}>
          <div style={{ width: "100%", height: 6, borderRadius: 999, background: "#e5e7eb", overflow: "hidden", marginBottom: 5 }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #0b7a4b, #14a366)", borderRadius: 999, transition: "width 0.06s linear" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Iniciando...</span>
            <span style={{ fontSize: 11, color: "#0b7a4b", fontWeight: 800 }}>{progress}%</span>
          </div>
        </div>

        <button
          onClick={changeFact}
          style={{ marginTop: 16, width: "min(500px, 96vw)", background: "#ffffff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: 0, cursor: "pointer", textAlign: "left", zIndex: 1, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden", transition: "transform 0.15s, box-shadow 0.15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.09)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; }}
        >
          <div style={{ background: "#0b7a4b", padding: "9px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.16em" }}>¿Sabías que...?</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#ffffff", background: "rgba(255,255,255,0.15)", padding: "1px 7px", borderRadius: 999 }}>{factIndex + 1} / {FACTS.length}</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700 }}>→</span>
          </div>

          <div style={{ padding: "14px 18px 16px", display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: "#f0fdf4", border: "1px solid #d1fae5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
              {fact.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", margin: "0 0 4px", opacity: factAnim ? 1 : 0, transform: factAnim ? "translateY(0)" : "translateY(5px)", transition: "opacity 0.2s, transform 0.2s" }}>{fact.titulo}</p>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", lineHeight: 1.55, margin: 0, opacity: factAnim ? 1 : 0, transform: factAnim ? "translateY(0)" : "translateY(5px)", transition: "opacity 0.2s 0.04s, transform 0.2s 0.04s" }}>{fact.texto}</p>
            </div>
          </div>

          <div style={{ padding: "8px 18px 12px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {FACTS.map((_, i) => (
                <span key={i} style={{ display: "inline-block", height: 4, borderRadius: 999, width: i === factIndex ? 16 : 4, background: i === factIndex ? "#0b7a4b" : "#d1d5db", transition: "width 0.3s, background 0.3s" }} />
              ))}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.03em" }}>Tocá para siguiente</span>
          </div>
        </button>
      </div>

      <style>{`
        @keyframes floatC {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-18px) scale(1.04); }
        }
      `}</style>
    </>
  );
}
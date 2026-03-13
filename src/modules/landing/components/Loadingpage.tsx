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
  { size: 320, top: "-10%", left: "-8%",  opacity: 0.06, delay: "0s",   dur: "7s"  },
  { size: 180, top: "5%",   left: "70%",  opacity: 0.08, delay: "1s",   dur: "5s"  },
  { size: 240, top: "65%",  left: "78%",  opacity: 0.07, delay: "0.5s", dur: "6s"  },
  { size: 140, top: "72%",  left: "-4%",  opacity: 0.09, delay: "1.5s", dur: "4.5s"},
  { size: 90,  top: "40%",  left: "88%",  opacity: 0.06, delay: "2s",   dur: "5.5s"},
  { size: 60,  top: "20%",  left: "15%",  opacity: 0.08, delay: "0.8s", dur: "6.5s"},
  { size: 200, top: "80%",  left: "40%",  opacity: 0.05, delay: "1.2s", dur: "8s"  },
];

export default function LoadingPage({ onComplete }: { onComplete?: () => void }) {
  const mountRef     = useRef<HTMLDivElement>(null);
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null);
  const [progress, setProgress]   = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [factAnim, setFactAnim]   = useState(true);
  const [done, setDone]           = useState(false);

  const changeFact = useCallback(() => {
    setFactAnim(false);
    setTimeout(() => { setFactIndex(i => (i + 1) % FACTS.length); setFactAnim(true); }, 300);
  }, []);

  // ── Progress ─────────────────────────────────────────────
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

  // ── Three.js ─────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el || rendererRef.current) return;

    const W = 280, H = 250;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(5, 4, 6);
    camera.lookAt(0, 0.8, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(6, 10, 6); sun.castShadow = true; scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-4, 3, -4); scene.add(fill);

    const house = new THREE.Group();
    scene.add(house);

    const mWall  = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 });
    const mRoof  = new THREE.MeshLambertMaterial({ color: 0xc0392b });
    const mWin   = new THREE.MeshLambertMaterial({ color: 0x5dade2, transparent: true, opacity: 0.85 });
    const mDoor  = new THREE.MeshLambertMaterial({ color: 0x6d4c2a });
    const mFloor = new THREE.MeshLambertMaterial({ color: 0x8bc34a });
    const mChim  = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
    const mFrame = new THREE.MeshLambertMaterial({ color: 0xffffff });

    const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.15, 3.6), mFloor);
    base.position.y = -0.075; house.add(base);

    const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2, 2.8), mWall);
    body.position.y = 1.0; body.castShadow = true; house.add(body);

    const rs = new THREE.Shape();
    rs.moveTo(-1.9, 0); rs.lineTo(0, 1.3); rs.lineTo(1.9, 0); rs.closePath();
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: 3.0, bevelEnabled: false }), mRoof);
    roof.position.set(0, 2.0, -1.5); roof.castShadow = true; house.add(roof);

    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.35), mChim);
    chim.position.set(0.7, 3.4, -0.4); house.add(chim);

    const addWin = (x: number, y: number, z: number, rY = 0) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.06), mFrame));
      const gl = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.06), mWin);
      gl.position.z = 0.02; g.add(gl);
      const hb = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.055, 0.07), mFrame);
      hb.position.z = 0.03; g.add(hb);
      const vb = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.56, 0.07), mFrame);
      vb.position.z = 0.03; g.add(vb);
      g.position.set(x, y, z); g.rotation.y = rY; house.add(g);
    };
    addWin(-0.75, 1.2, 1.41); addWin(0.75, 1.2, 1.41);
    addWin(1.61, 1.2, 0, Math.PI / 2); addWin(-1.61, 1.2, 0, -Math.PI / 2);

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.1, 0.07), mDoor);
    door.position.set(0, 0.55, 1.42); house.add(door);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshLambertMaterial({ color: 0xf0c040 }));
    knob.position.set(0.27, 0.55, 1.49); house.add(knob);
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.35), mChim);
    step.position.set(0, 0.05, 1.6); house.add(step);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      house.rotation.y += 0.008;
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
        background: "#f8faf8",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>

        {/* ── Círculos decorativos ───────────────────────────── */}
        {CIRCLES.map((c, i) => (
          <span key={i} style={{
            position: "absolute",
            width: c.size, height: c.size,
            borderRadius: "50%",
            background: "#0b7a4b",
            opacity: c.opacity,
            top: c.top, left: c.left,
            animation: `floatC ${c.dur} ease-in-out infinite`,
            animationDelay: c.delay,
            pointerEvents: "none",
          }} />
        ))}

        {/* ── Casa 3D ────────────────────────────────────────── */}
        <div ref={mountRef} style={{
          width: 280, height: 250, flexShrink: 0,
          overflow: "hidden", zIndex: 1,
        }} />

        {/* ── Título ─────────────────────────────────────────── */}
        <h1 style={{
          color: "#0b7a4b", fontSize: 20, fontWeight: 800,
          margin: "0 0 2px", zIndex: 1, letterSpacing: "-0.02em",
        }}>
          Cargando tu experiencia
        </h1>
        <p style={{ color: "#9ca3af", fontSize: 12, fontWeight: 500, margin: "0 0 14px", zIndex: 1 }}>
          Preparando todo para vos...
        </p>

        {/* ── Barra de progreso ──────────────────────────────── */}
        <div style={{ width: "min(460px, 86vw)", zIndex: 1 }}>
          <div style={{
            width: "100%", height: 6, borderRadius: 999,
            background: "#e5e7eb", overflow: "hidden", marginBottom: 5,
          }}>
            <div style={{
              height: "100%", width: `${progress}%`,
              background: "#0b7a4b", borderRadius: 999,
              transition: "width 0.06s linear",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Iniciando...</span>
            <span style={{ fontSize: 11, color: "#0b7a4b", fontWeight: 800 }}>{progress}%</span>
          </div>
        </div>

        {/* ── Card dato curioso ──────────────────────────────── */}
        <button
          onClick={changeFact}
          style={{
            marginTop: 16,
            width: "min(500px, 86vw)",
            background: "#ffffff",
            border: "1.5px solid #e5e7eb",
            borderRadius: 20,
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            zIndex: 1,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            overflow: "hidden",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.09)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
          }}
        >
          {/* Header minimalista */}
          <div style={{
            background: "#0b7a4b",
            padding: "9px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase", letterSpacing: "0.16em",
              }}>
                ¿Sabías que...?
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)",
                background: "rgba(255,255,255,0.15)",
                padding: "1px 7px", borderRadius: 999,
              }}>
                {factIndex + 1} / {FACTS.length}
              </span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700 }}>→</span>
          </div>

          {/* Cuerpo */}
          <div style={{ padding: "14px 18px 16px", display: "flex", alignItems: "flex-start", gap: 14 }}>
            {/* Emoji */}
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "#f0fdf4",
              border: "1px solid #d1fae5",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>
              {fact.emoji}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 800, color: "#111827",
                margin: "0 0 4px",
                opacity: factAnim ? 1 : 0,
                transform: factAnim ? "translateY(0)" : "translateY(5px)",
                transition: "opacity 0.2s, transform 0.2s",
              }}>
                {fact.titulo}
              </p>
              <p style={{
                fontSize: 12, fontWeight: 500, color: "#6b7280",
                lineHeight: 1.55, margin: 0,
                opacity: factAnim ? 1 : 0,
                transform: factAnim ? "translateY(0)" : "translateY(5px)",
                transition: "opacity 0.2s 0.04s, transform 0.2s 0.04s",
              }}>
                {fact.texto}
              </p>
            </div>
          </div>

          {/* Footer con dots */}
          <div style={{
            padding: "8px 18px 12px",
            borderTop: "1px solid #f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {FACTS.map((_, i) => (
                <span key={i} style={{
                  display: "inline-block", height: 4, borderRadius: 999,
                  width: i === factIndex ? 16 : 4,
                  background: i === factIndex ? "#0b7a4b" : "#d1d5db",
                  transition: "width 0.3s, background 0.3s",
                }} />
              ))}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, color: "#9ca3af",
              letterSpacing: "0.03em",
            }}>
              Tocá para siguiente
            </span>
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
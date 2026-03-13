import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Home, Key, DollarSign, Briefcase, Megaphone, FileCheck,
  ArrowLeft, CheckCircle2, TrendingUp, Clock, Shield, Users,
  Star, FileText, MessageCircle, ArrowRight,
} from "lucide-react";

const serviciosData = {
  venta: {
    icon: Home,
    titulo: "Venta de Propiedades",
    tagline: "Maximizamos el valor de tu propiedad",
    descripcion: `Nuestro servicio de venta de propiedades está diseñado para acompañarte en cada etapa del proceso, desde la valoración inicial hasta la firma del contrato. Contamos con un equipo de profesionales con amplio conocimiento del mercado inmobiliario local que trabajará incansablemente para obtener el mejor precio por tu propiedad.\n\nDesarrollamos estrategias de marketing personalizadas para cada inmueble, combinando difusión digital, base de datos de compradores activos y presencia en los principales portales inmobiliarios del país.`,
    pasos: [
      { num: "01", titulo: "Tasación gratuita", desc: "Análisis comparativo del mercado para determinar el precio óptimo." },
      { num: "02", titulo: "Estrategia de venta", desc: "Plan personalizado de marketing y difusión para tu propiedad." },
      { num: "03", titulo: "Fotografía profesional", desc: "Sesión fotográfica y recorrido virtual 360° sin costo adicional." },
      { num: "04", titulo: "Publicación masiva", desc: "Difusión en portales líderes, redes sociales y base de clientes." },
      { num: "05", titulo: "Gestión de visitas", desc: "Coordinamos y acompañamos cada visita de potenciales compradores." },
      { num: "06", titulo: "Negociación y cierre", desc: "Negociación profesional y acompañamiento hasta la escritura." },
    ],
    beneficios: [
      { icon: TrendingUp, texto: "Precio optimizado según el mercado actual" },
      { icon: Clock, texto: "Vendemos en el menor tiempo posible" },
      { icon: Shield, texto: "Proceso 100% seguro y transparente" },
      { icon: Users, texto: "Amplia cartera de compradores calificados" },
    ],
    whatsapp: "Venta de Propiedades",
    g1: "#0b7a4b", g2: "#16a34a", light: "#f0fdf4", lightText: "#166534", accent: "#0b7a4b",
  },
  alquiler: {
    icon: Key,
    titulo: "Alquiler de Propiedades",
    tagline: "Gestión completa sin preocupaciones",
    descripcion: `Gestionamos el alquiler de tu propiedad de forma integral, encargándonos de todo el proceso para que no tengas que preocuparte por nada. Desde la búsqueda y evaluación exhaustiva del inquilino ideal hasta el seguimiento mensual del contrato.\n\nTrabajamos con un sistema de evaluación de inquilinos riguroso que incluye verificación crediticia, laboral y de antecedentes, garantizando que tu inmueble quede en las mejores manos.`,
    pasos: [
      { num: "01", titulo: "Publicación y difusión", desc: "Lanzamos tu propiedad en todos los canales disponibles." },
      { num: "02", titulo: "Filtrado de interesados", desc: "Preseleccionamos candidatos según criterios de solvencia." },
      { num: "03", titulo: "Evaluación del inquilino", desc: "Verificación crediticia, laboral y de antecedentes completa." },
      { num: "04", titulo: "Redacción del contrato", desc: "Contrato ajustado a la normativa vigente y tus condiciones." },
      { num: "05", titulo: "Cobro mensual", desc: "Rendición puntual de alquileres con detalle de gastos." },
      { num: "06", titulo: "Renovaciones y rescisiones", desc: "Gestión completa de todo el ciclo del contrato." },
    ],
    beneficios: [
      { icon: Users, texto: "Inquilinos verificados y confiables" },
      { icon: Shield, texto: "Contratos respaldados legalmente" },
      { icon: Clock, texto: "Administración mensual sin esfuerzo" },
      { icon: TrendingUp, texto: "Rentabilidad asegurada para tu inversión" },
    ],
    whatsapp: "Alquiler de Propiedades",
    g1: "#0b7a4b", g2: "#0f766e", light: "#f0fdfa", lightText: "#134e4a", accent: "#0f766e",
  },
  tasaciones: {
    icon: DollarSign,
    titulo: "Tasaciones Profesionales",
    tagline: "Valoración real y fundamentada de tu inmueble",
    descripcion: `Una tasación precisa es la base de cualquier operación inmobiliaria exitosa. Nuestros tasadores matriculados utilizan metodologías reconocidas combinadas con el conocimiento profundo del mercado local para darte una valoración real y fundamentada.\n\nEl informe de tasación que emitimos tiene validez legal y puede ser utilizado ante organismos oficiales, entidades bancarias y en procesos judiciales o sucesorios.`,
    pasos: [
      { num: "01", titulo: "Solicitud y coordinación", desc: "Agendamos la visita en el horario que más te convenga." },
      { num: "02", titulo: "Inspección técnica", desc: "Relevamiento detallado del inmueble y sus características." },
      { num: "03", titulo: "Análisis comparativo", desc: "Estudio de operaciones similares realizadas en la zona." },
      { num: "04", titulo: "Evaluación del mercado", desc: "Análisis de tendencias actuales y proyecciones del sector." },
      { num: "05", titulo: "Elaboración del informe", desc: "Documento técnico detallado con metodología y fundamentos." },
      { num: "06", titulo: "Entrega y asesoramiento", desc: "Explicación del informe con recomendaciones incluidas." },
    ],
    beneficios: [
      { icon: Star, texto: "Tasadores matriculados y certificados" },
      { icon: TrendingUp, texto: "Análisis de mercado actualizado" },
      { icon: FileText, texto: "Informe oficial con validez legal" },
      { icon: Shield, texto: "Metodología reconocida internacionalmente" },
    ],
    whatsapp: "Tasaciones Profesionales",
    g1: "#0b7a4b", g2: "#4d7c0f", light: "#f7fee7", lightText: "#365314", accent: "#3f6212",
  },
  asesoramiento: {
    icon: Briefcase,
    titulo: "Asesoramiento Profesional",
    tagline: "Decisiones informadas en cada etapa",
    descripcion: `El mercado inmobiliario puede ser complejo y cambiante. Nuestro servicio de asesoramiento profesional te brinda el soporte experto que necesitás para tomar decisiones informadas, ya sea que estés comprando tu primera propiedad, invirtiendo o reorganizando tu patrimonio.\n\nContamos con especialistas en distintas áreas del mercado inmobiliario que trabajarán juntos para darte una visión integral de tu situación y las mejores opciones disponibles.`,
    pasos: [
      { num: "01", titulo: "Diagnóstico inicial", desc: "Entendemos tu situación, objetivos y posibilidades reales." },
      { num: "02", titulo: "Análisis del mercado", desc: "Evaluamos las opciones disponibles según tu perfil." },
      { num: "03", titulo: "Presentación de opciones", desc: "Te mostramos escenarios claros con ventajas y riesgos." },
      { num: "04", titulo: "Asesoramiento financiero", desc: "Orientación sobre créditos, inversiones y aspectos impositivos." },
      { num: "05", titulo: "Acompañamiento en decisiones", desc: "Estamos con vos en cada negociación y etapa clave." },
      { num: "06", titulo: "Seguimiento post-operación", desc: "Continuamos asesorándote después de concretada la operación." },
    ],
    beneficios: [
      { icon: Users, texto: "Asesor dedicado exclusivamente a tu caso" },
      { icon: Shield, texto: "Decisiones respaldadas por expertos" },
      { icon: CheckCircle2, texto: "Resultados orientados a tus metas" },
      { icon: TrendingUp, texto: "Estrategia patrimonial a largo plazo" },
    ],
    whatsapp: "Asesoramiento Profesional",
    g1: "#0b7a4b", g2: "#16a34a", light: "#f0fdf4", lightText: "#166534", accent: "#0b7a4b",
  },
  comercializacion: {
    icon: Megaphone,
    titulo: "Publicamos tu Propiedad en CercaTrova",
    tagline: "Tu propiedad, visible para todos los compradores",
    descripcion: `Si tenés una propiedad y querés que aparezca en nuestro catálogo, el proceso es simple: completás un formulario con todos los datos de tu inmueble, nuestro equipo lo revisa y, si se aprueba, nos ponemos en contacto para coordinar los siguientes pasos.\n\nContamos con presencia en los principales portales inmobiliarios del país, una base activa de compradores e inquilinos, y una estrategia de redes sociales que maximiza la visibilidad de cada publicación.`,
    pasos: [
      { num: "01", titulo: "Enviás el formulario", desc: "Completás los datos de tu propiedad de forma online." },
      { num: "02", titulo: "Revisión del agente", desc: "Evaluamos tu solicitud en 24 a 48 horas hábiles." },
      { num: "03", titulo: "Aprobación y contacto", desc: "Si se aprueba, coordinamos visita y sesión fotográfica." },
      { num: "04", titulo: "Creación del aviso", desc: "Redacción profesional con fotos de calidad y descripción." },
      { num: "05", titulo: "Publicación masiva", desc: "Lanzamos en portales, redes y base de clientes activos." },
      { num: "06", titulo: "Gestión de consultas", desc: "Respondemos consultas y coordinamos visitas por vos." },
    ],
    beneficios: [
      { icon: Megaphone, texto: "Difusión masiva en todos los canales" },
      { icon: Clock, texto: "Publicación activa en menos de 48hs" },
      { icon: TrendingUp, texto: "Mayor exposición = mejor precio final" },
      { icon: Users, texto: "Base activa de compradores e inquilinos" },
    ],
    whatsapp: "Publicación y Comercialización",
    g1: "#0b7a4b", g2: "#0f766e", light: "#f0fdfa", lightText: "#134e4a", accent: "#0f766e",
    ctaEspecial: true,
  },
  legal: {
    icon: FileCheck,
    titulo: "Gestión Legal y Documental",
    tagline: "Protección jurídica en cada operación",
    descripcion: `Las operaciones inmobiliarias implican una gran cantidad de documentación legal que debe estar perfectamente en orden. Nuestro equipo supervisa cada documento, contrato y trámite para que tu operación sea completamente segura y transparente.\n\nTrabajamos en estrecha colaboración con escribanos y asesores legales especializados en derecho inmobiliario para garantizar que cada detalle esté cubierto.`,
    pasos: [
      { num: "01", titulo: "Verificación de títulos", desc: "Revisión y verificación de títulos de propiedad." },
      { num: "02", titulo: "Consulta registral", desc: "Verificación de inhibiciones, gravámenes e hipotecas." },
      { num: "03", titulo: "Redacción del boleto", desc: "Boleto de compraventa revisado y ajustado a la operación." },
      { num: "04", titulo: "Coordinación con escribanía", desc: "Trabajamos con el escribano de tu confianza." },
      { num: "05", titulo: "Preparación del legajo", desc: "Toda la documentación lista para la escritura." },
      { num: "06", titulo: "Escrituración e inscripción", desc: "Acompañamiento hasta la inscripción registral final." },
    ],
    beneficios: [
      { icon: Shield, texto: "Operaciones 100% seguras y legales" },
      { icon: FileText, texto: "Documentación revisada por expertos" },
      { icon: CheckCircle2, texto: "Sin sorpresas al momento de escriturar" },
      { icon: Star, texto: "Red de escribanos y asesores de confianza" },
    ],
    whatsapp: "Gestión Legal y Documental",
    g1: "#0b7a4b", g2: "#14532d", light: "#f0fdf4", lightText: "#166534", accent: "#0b7a4b",
  },
};

export default function ServicioDetallePage({ params }: { params: { id: string } }) {
  const s = serviciosData[params.id as keyof typeof serviciosData];
  if (!s) notFound();

  const Icon = s.icon;
  const phoneNumber = "543513872817";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=Hola! Estoy interesado en el servicio de: ${s.whatsapp}`;

  return (
    <main className="min-h-screen" style={{ background: "#f5f7f5" }}>

      {/* ══ HERO ═══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden text-white py-28 px-4"
        style={{ background: `linear-gradient(135deg, ${s.g1} 0%, ${s.g2} 100%)` }}
      >
        {/* Burbujas decorativas */}
        <span className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <span className="absolute top-1/3 right-1/3 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <span className="absolute -bottom-12 -left-12 w-60 h-60 rounded-full bg-white/5 pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Back link */}
          <Link
            href="/#servicios"
            className="inline-flex items-center gap-2 mb-10 text-sm font-medium text-white/60 hover:text-white transition-colors group"
          >
            <span className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.12)" }}>
              <ArrowLeft size={13} />
            </span>
            Volver a Servicios
          </Link>

          <div className="flex items-center gap-5">
            {/* Ícono glass */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl"
              style={{
                background: "rgba(255,255,255,0.14)",
                backdropFilter: "blur(14px)",
                border: "1.5px solid rgba(255,255,255,0.28)",
              }}
            >
              <Icon size={28} />
            </div>

            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.22em] mb-2 inline-block px-3 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.13)", backdropFilter: "blur(6px)" }}
              >
                Servicio Inmobiliario
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight drop-shadow-sm">
                {s.titulo}
              </h1>
              <p className="text-white text-base mt-1 font-light">{s.tagline}</p>
            </div>
          </div>
        </div>

        {/* Ola bottom */}
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 48H1440V16C1200 48 960 0 720 24C480 48 240 0 0 24V48Z" fill="#f5f7f5" />
          </svg>
        </div>
      </section>

      {/* ══ BODY ════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 pt-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-start">

          {/* ─ COLUMNA PRINCIPAL ─────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Descripción */}
            <div className="bg-white rounded-3xl p-8 shadow-sm" style={{ border: "1px solid #e8f5e9" }}>
              <SectionHeader accent={s.accent} title="¿En qué consiste?" />
              <div className="space-y-3 mt-5">
                {s.descripcion.split("\n\n").map((p, i) => (
                  <p key={i} className="text-gray-500 leading-relaxed text-[15px]">{p.trim()}</p>
                ))}
              </div>
            </div>

            {/* Timeline de pasos */}
            <div className="bg-white rounded-3xl p-8 shadow-sm" style={{ border: "1px solid #e8f5e9" }}>
              <SectionHeader accent={s.accent} title="¿Cómo funciona?" />

              <div className="relative mt-6">
                {/* línea vertical */}
                <span
                  className="absolute left-4.75 top-4 bottom-4 w-px rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${s.accent}50, transparent)` }}
                />

                <div className="space-y-6">
                  {s.pasos.map((paso, i) => (
                    <div key={i} className="flex items-start gap-5 group">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black z-10 shadow-sm transition-all duration-200 group-hover:scale-110 group-hover:shadow-md"
                        style={{ background: s.light, color: s.accent, border: `2px solid ${s.accent}20` }}
                      >
                        {paso.num}
                      </div>
                      <div className="pt-1.5 border-b border-gray-50 pb-4 w-full last:border-0">
                        <p className="font-bold text-gray-800 text-sm">{paso.titulo}</p>
                        <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">{paso.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA especial — solo comercialización */}
            {s.ctaEspecial && (
              <div
                className="rounded-3xl p-7 relative overflow-hidden"
                style={{ background: s.light, border: `2px solid ${s.accent}20` }}
              >
                <span
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none"
                  style={{ background: s.accent }}
                />
                <div className="relative z-10">
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-3"
                    style={{ background: `${s.accent}15`, color: s.accent }}
                  >
                    Acción recomendada
                  </span>
                  <h3 className="font-extrabold text-xl text-gray-900 mb-2">
                    ¿Querés publicar tu propiedad?
                  </h3>
                  <p className="text-gray-500 text-sm mb-5 max-w-sm leading-relaxed">
                    Completá el formulario online con los datos de tu inmueble y nuestro agente lo evaluará en 24 a 48hs.
                  </p>
                  <Link
                    href="/servicios/publicar"
                    className="inline-flex items-center gap-2 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-md transition-all hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${s.g1}, ${s.g2})` }}
                  >
                    Publicar mi propiedad <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ─ SIDEBAR ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-6">

            {/* Por qué elegirnos */}
            <div className="bg-white rounded-3xl p-6 shadow-sm" style={{ border: "1px solid #e8f5e9" }}>
              <SectionHeader accent={s.accent} title="¿Por qué elegirnos?" small />
              <div className="mt-4 space-y-2">
                {s.beneficios.map((b, i) => {
                  const BIcon = b.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors hover:bg-gray-50 group cursor-default"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                        style={{ background: s.light }}
                      >
                        <BIcon size={14} style={{ color: s.accent }} />
                      </div>
                      <span className="text-[13px] text-gray-600 font-medium leading-snug">{b.texto}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tarjeta CTA WhatsApp */}
            <div
              className="rounded-3xl p-6 text-white relative overflow-hidden shadow-lg"
              style={{ background: `linear-gradient(135deg, ${s.g1} 0%, ${s.g2} 100%)` }}
            >
              <span className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
              <span className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
              <div className="relative z-10">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)" }}
                >
                  <MessageCircle size={18} />
                </div>
                <h3 className="font-extrabold text-lg mb-1">¿Te interesa?</h3>
                <p className="text-white/65 text-sm mb-5 leading-relaxed">
                  Consultanos sin compromiso. Un agente te responde a la brevedad.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white font-bold py-3 rounded-2xl text-sm w-full transition-all hover:bg-green-50 hover:-translate-y-0.5 hover:shadow-md"
                  style={{ color: s.accent }}
                >
                  <MessageCircle size={15} />
                  Consultar por WhatsApp
                </a>
              </div>
            </div>

            {/* Otros servicios */}
            <div className="bg-white rounded-3xl p-6 shadow-sm" style={{ border: "1px solid #e8f5e9" }}>
              <SectionHeader accent={s.accent} title="Otros servicios" small />
              <div className="mt-4 space-y-1">
                {Object.entries(serviciosData)
                  .filter(([key]) => key !== params.id)
                  .slice(0, 4)
                  .map(([key, sv]) => {
                    const SIcon = sv.icon;
                    return (
                      <Link
                        key={key}
                        href={`/servicios/${key}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 group transition-all"
                      >
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                          style={{ background: s.light }}
                        >
                          <SIcon size={13} style={{ color: s.accent }} />
                        </div>
                        <span className="flex-1 text-[13px] font-medium leading-tight">{sv.titulo}</span>
                        <ArrowRight
                          size={12}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: s.accent }}
                        />
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ── Helper component ──────────────────────────────────────────
function SectionHeader({ accent, title, small = false }: { accent: string; title: string; small?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-1 rounded-full shrink-0" style={{ background: accent, height: small ? "16px" : "22px" }} />
      <h2 className={`font-extrabold text-gray-900 ${small ? "text-sm" : "text-lg"}`}>{title}</h2>
    </div>
  );
}
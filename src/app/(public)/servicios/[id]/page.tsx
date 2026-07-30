import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { whatsappLink } from "@/modules/shared/lib/contact";
import { ServicioHero } from "./ServicioHero";
import {
  Home, Key, DollarSign, Briefcase, Megaphone, FileCheck,
  CheckCircle2, TrendingUp, Clock, Shield, Users,
  Star, FileText, MessageCircle, ArrowRight, HelpCircle,
} from "lucide-react";

/**
 * Detalle de un servicio.
 *
 * El contenido de cada servicio vive en `serviciosData` y hoy incluye, además
 * de los pasos y beneficios que ya existían:
 *  - `descripcion` ampliada (3 párrafos) con material real del rubro en Córdoba
 *  - `incluye`  → qué entrega concretamente el servicio
 *  - `persuasion` → el bloque que busca que la persona nos contacte; es el único
 *    que lleva una foto de gente, porque es donde la cercanía suma de verdad
 *  - `faq` → dudas reales que llegan por WhatsApp
 *  - `hero` / `galeria` → imágenes de apoyo
 *
 * Cada servicio conserva su propio verde (`g1`/`g2`/`light`/`accent`); lo que se
 * unificó es la estructura, los bordes y los espaciados con el resto del sitio.
 */

const serviciosData = {
  venta: {
    icon: Home,
    titulo: "Venta de Propiedades",
    tagline: "Acompañamos tu venta desde la tasación hasta la escritura, con un martillero matriculado a cargo.",
    hero: {
      src: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2400&auto=format&fit=crop",
      alt: "Casa con jardín y galería lista para salir a la venta",
      position: "center 55%",
    },
    descripcion: `Vender una propiedad en Córdoba no es publicar un aviso y esperar. Es definir un precio que el mercado convalide, presentar el inmueble de forma que se destaque entre decenas de avisos parecidos, filtrar consultas reales de las que no lo son, y sostener una negociación hasta la firma. Nuestro servicio de venta se ocupa de las cuatro cosas.

El punto de partida siempre es la tasación. Una propiedad publicada por encima de su valor de mercado se "quema": acumula semanas sin consultas, y cuando finalmente baja de precio los compradores ya la vieron pasar y sospechan que algo tiene. Nosotros arrancamos con un análisis comparativo de operaciones cerradas en la misma zona —no de precios publicados, que suelen estar inflados— para partir de un número que sostenga la negociación.

Desde ahí armamos la estrategia: fotografía profesional, publicación en los portales donde realmente busca el comprador de ese tipo de inmueble, difusión a nuestra base de interesados y coordinación de cada visita. Vos recibís un informe de cómo viene la venta —cuántas consultas, cuántas visitas, qué feedback dejó cada una— y no tenés que atender a ningún desconocido por teléfono.`,
    incluye: [
      "Tasación comparativa de mercado, sin cargo y sin compromiso",
      "Sesión de fotos profesional y recorrido virtual del inmueble",
      "Publicación en los principales portales y en nuestra web",
      "Filtrado de consultas: solo te llegan los interesados reales",
      "Coordinación y acompañamiento presencial de cada visita",
      "Negociación de la oferta y seguimiento hasta la escritura",
    ],
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
    persuasion: {
      titulo: "Del otro lado siempre hay una familia esperando",
      texto: "Cada propiedad que vendemos termina siendo la casa de alguien. Por eso no trabajamos con volumen: tomamos una cantidad de operaciones que podamos atender de verdad, con un agente asignado que conoce tu inmueble y te atiende siempre la misma persona. Contanos qué querés vender y te damos una devolución honesta, incluso si la respuesta es que conviene esperar.",
      imagen: "https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=1600&auto=format&fit=crop",
      alt: "Padre con sus hijos en el jardín de la casa que compraron",
    },
    faq: [
      { p: "¿La tasación tiene costo?", r: "No. La tasación previa a una venta es sin cargo y no te obliga a firmar nada con nosotros." },
      { p: "¿Cuánto tarda en venderse una propiedad?", r: "Depende de la zona, el tipo de inmueble y el precio de salida. Con un precio bien puesto, la mayoría de las operaciones se cierran dentro de los primeros tres meses." },
      { p: "¿Qué gastos tengo que afrontar como vendedor?", r: "Además de la comisión, se suelen contemplar el certificado de dominio, el libre deuda de impuestos y servicios y, según el caso, el impuesto a la transferencia. Te lo detallamos todo antes de empezar." },
    ],
    galeria: [
      { src: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=800&auto=format&fit=crop", alt: "Casa iluminada al atardecer" },
      { src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800&auto=format&fit=crop", alt: "Living amplio de una propiedad en venta" },
    ],
    whatsapp: "Venta de Propiedades",
    g1: "#0b7a4b", g2: "#16a34a", light: "#f0fdf4", lightText: "#166534", accent: "#0b7a4b",
  },

  alquiler: {
    icon: Key,
    titulo: "Alquiler de Propiedades",
    tagline: "Gestionamos tu alquiler de punta a punta: inquilino evaluado, contrato en regla y cobranza puntual.",
    hero: {
      src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2400&auto=format&fit=crop",
      alt: "Departamento luminoso listo para alquilar",
      position: "center 50%",
    },
    descripcion: `El riesgo real de alquilar no es que la propiedad quede vacía un mes: es entregarle las llaves a la persona equivocada. Un inquilino que deja de pagar puede costar meses de ingresos y un desgaste que ningún alquiler compensa. Por eso el corazón de este servicio es la evaluación previa, no la publicación.

Antes de firmar verificamos situación laboral, ingresos declarados y antecedentes crediticios de cada candidato, y revisamos la garantía propuesta —propietaria, seguro de caución o recibo de sueldo— para confirmar que sea ejecutable de verdad. Recién cuando el candidato pasa ese filtro avanzamos con el contrato.

Después de la firma seguimos nosotros: cobranza mensual con rendición detallada, control de que los servicios y expensas estén al día, seguimiento del estado del inmueble y gestión de renovaciones y ajustes según lo pactado. Si aparece un problema, lo resolvemos antes de que llegue a ser tuyo.`,
    incluye: [
      "Publicación y difusión hasta conseguir inquilino",
      "Evaluación crediticia, laboral y de antecedentes de cada candidato",
      "Revisión de la garantía ofrecida antes de aprobarla",
      "Contrato redactado según la normativa vigente",
      "Inventario del estado del inmueble al entregar y al recibir",
      "Cobranza mensual con rendición detallada de gastos",
    ],
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
    persuasion: {
      titulo: "Tu departamento, en manos de alguien que lo va a cuidar",
      texto: "Buena parte de quienes alquilan con nosotros son estudiantes que llegan a Córdoba y familias que se mudan por trabajo. Los conocemos, los entrevistamos y sabemos a quién le estamos entregando las llaves. Si tenés una propiedad parada, escribinos: te decimos en el día en cuánto se puede alquilar y qué haría falta para ponerla en valor.",
      imagen: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1600&auto=format&fit=crop",
      alt: "Agente entregando las llaves a una inquilina",
    },
    faq: [
      { p: "¿Qué tipo de garantía aceptan?", r: "Trabajamos con garantía propietaria en Córdoba, seguro de caución y, según el caso, recibo de sueldo con relación de dependencia. Evaluamos cada situación puntualmente." },
      { p: "¿Quién se ocupa si el inquilino deja de pagar?", r: "Nosotros. Iniciamos la gestión de cobro apenas se registra el atraso y te mantenemos informado en cada paso, sin que tengas que enfrentar la situación vos." },
      { p: "¿Puedo alquilar si la propiedad necesita arreglos?", r: "Sí. Te decimos qué conviene resolver antes de publicar y qué se puede dejar como está: no todo arreglo se recupera en el precio del alquiler." },
    ],
    galeria: [
      { src: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop", alt: "Llaves de un departamento en alquiler" },
      { src: "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800&auto=format&fit=crop", alt: "Cocina equipada de un departamento en alquiler" },
    ],
    whatsapp: "Alquiler de Propiedades",
    g1: "#0b7a4b", g2: "#0f766e", light: "#f0fdfa", lightText: "#134e4a", accent: "#0f766e",
  },

  tasaciones: {
    icon: DollarSign,
    titulo: "Tasaciones Profesionales",
    tagline: "Un valor fundamentado y por escrito, con validez ante bancos, escribanías y tribunales.",
    hero: {
      src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2400&auto=format&fit=crop",
      alt: "Casa moderna relevada para su tasación",
      position: "center 60%",
    },
    descripcion: `Una tasación no es una opinión sobre cuánto vale una casa: es un informe técnico que explica cómo se llegó a ese número y que tiene que poder defenderse frente a un banco, un juez o la otra parte de una sucesión. Nuestras tasaciones las firma un martillero matriculado y se entregan por escrito, con la metodología detallada.

El método parte del análisis comparativo de mercado: relevamos operaciones efectivamente cerradas en la zona en los últimos meses y las ajustamos por las diferencias concretas con tu inmueble —superficie cubierta y descubierta, antigüedad, estado de conservación, orientación, piso, luminosidad, expensas y situación documental—. Los precios de publicación se miran como referencia, pero no son la base: entre lo que se pide y lo que se paga suele haber una brecha importante.

El informe final incluye la descripción del inmueble, las operaciones comparables usadas, los ajustes aplicados y el valor resultante, con un rango de negociación razonable. Sirve tanto para poner una propiedad en venta con un número defendible como para presentar ante un banco por un crédito hipotecario, en una sucesión, en una división de bienes o en cualquier instancia que requiera un valor respaldado.`,
    incluye: [
      "Visita e inspección técnica del inmueble, coordinada a tu horario",
      "Relevamiento de superficies, estado de conservación y terminaciones",
      "Análisis comparativo con operaciones cerradas de la zona",
      "Revisión de la situación documental y su impacto en el valor",
      "Informe escrito con metodología, comparables y fundamentos",
      "Reunión de devolución para explicarte el informe y sus alcances",
    ],
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
    persuasion: {
      titulo: "Preferimos darte el número real, aunque no sea el que esperabas",
      texto: "Muchas tasaciones se inflan para conseguir la exclusividad de la venta, y el que termina perdiendo meses es el propietario. Nosotros preferimos decirte desde el primer día cuánto vale realmente tu propiedad y qué se puede hacer para mejorar ese valor. Si querés una segunda opinión sobre una tasación que ya te dieron, también te la damos.",
      imagen: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop",
      alt: "Tasadora repasando el informe con la propietaria",
    },
    faq: [
      { p: "¿En cuánto tiempo tengo el informe?", r: "Entre 48 y 72 horas hábiles desde la visita al inmueble, según la complejidad del caso." },
      { p: "¿Sirve para presentar en un banco o en una sucesión?", r: "Sí. El informe lo firma un martillero matriculado y es válido ante entidades bancarias, escribanías y en instancias judiciales o sucesorias." },
      { p: "¿Tasan terrenos y locales, o solo viviendas?", r: "Tasamos viviendas, departamentos, locales, oficinas, galpones y terrenos. Cada tipo se valúa con los comparables que le corresponden." },
    ],
    galeria: [
      { src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800&auto=format&fit=crop", alt: "Cálculo del valor de mercado de una propiedad" },
      { src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop", alt: "Análisis comparativo de operaciones de la zona" },
    ],
    whatsapp: "Tasaciones Profesionales",
    g1: "#0b7a4b", g2: "#4d7c0f", light: "#f7fee7", lightText: "#365314", accent: "#3f6212",
  },

  asesoramiento: {
    icon: Briefcase,
    titulo: "Asesoramiento Profesional",
    tagline: "Te ayudamos a decidir antes de firmar: qué comprar, cuándo vender y qué conviene en tu caso.",
    hero: {
      src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2400&auto=format&fit=crop",
      alt: "Equipo de asesores trabajando sobre una operación inmobiliaria",
      position: "center 45%",
    },
    descripcion: `La mayoría de los errores caros en el mercado inmobiliario no se cometen al firmar, sino antes: comprar en una zona sin averiguar qué se está construyendo enfrente, vender en el peor momento del año, aceptar una permuta sin entender cómo se valúa la diferencia, o comprometerse con una cuota que el ingreso no sostiene. El asesoramiento existe para que esas decisiones se tomen con información.

Trabajamos con tres perfiles muy distintos y a cada uno le corresponde una conversación distinta. Quien compra su primera vivienda necesita entender cuánto puede afrontar realmente entre anticipo, gastos de escrituración y mudanza. Quien invierte necesita comparar rendimiento por alquiler contra revalorización según la zona. Y quien está reorganizando un patrimonio familiar —una sucesión, una división de bienes— necesita ordenar primero la parte documental antes de pensar en vender.

No cobramos por conversar. La primera reunión es para entender tu situación y decirte con franqueza qué opciones tenés, incluso cuando la recomendación es no hacer nada por ahora. Si después decidís avanzar con una operación, seguimos acompañándote; si no, te quedás igual con el panorama claro.`,
    incluye: [
      "Reunión inicial de diagnóstico, sin cargo",
      "Análisis de tu capacidad real de compra o de tu rentabilidad esperada",
      "Comparación de zonas y tipos de propiedad según tu objetivo",
      "Orientación sobre créditos hipotecarios y gastos asociados",
      "Revisión de la documentación antes de que firmes nada",
      "Acompañamiento en la negociación y seguimiento posterior",
    ],
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
    persuasion: {
      titulo: "Una charla a tiempo evita un problema caro",
      texto: "Muchas de las consultas que recibimos empiezan con un “quería preguntar algo antes de firmar”. Esa llamada suele ser la que evita el error. Escribinos aunque todavía no tengas nada decidido: no hace falta que vengas con una propiedad elegida ni con el crédito aprobado para que podamos ayudarte a ordenar el panorama.",
      imagen: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1600&auto=format&fit=crop",
      alt: "Grupo de personas asesorándose antes de comprar",
    },
    faq: [
      { p: "¿El asesoramiento tiene costo?", r: "La reunión inicial de diagnóstico es sin cargo. Si el caso requiere un trabajo más extenso, te pasamos el presupuesto antes de empezar." },
      { p: "¿Me asesoran aunque compre una propiedad que no es de ustedes?", r: "Sí. Podemos revisar la documentación y acompañarte en la negociación de una propiedad publicada por otra inmobiliaria o por un particular." },
      { p: "¿Ayudan con créditos hipotecarios?", r: "Te orientamos sobre las líneas vigentes, los requisitos y los gastos que no siempre se ven al principio. La aprobación la resuelve el banco, pero llegás preparado." },
    ],
    galeria: [
      { src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=800&auto=format&fit=crop", alt: "Acuerdo cerrado entre las partes" },
      { src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop", alt: "Living de una propiedad evaluada con el asesor" },
    ],
    whatsapp: "Asesoramiento Profesional",
    g1: "#0b7a4b", g2: "#16a34a", light: "#f0fdf4", lightText: "#166534", accent: "#0b7a4b",
  },

  comercializacion: {
    icon: Megaphone,
    titulo: "Publicamos tu Propiedad en CercaTrova",
    tagline: "Cargá los datos de tu inmueble, lo revisamos y sale publicado en nuestro catálogo y en los portales.",
    hero: {
      src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2400&auto=format&fit=crop",
      alt: "Propiedad destacada publicada en el catálogo",
      position: "center 55%",
    },
    descripcion: `Si tenés una propiedad para vender o alquilar y querés que aparezca en nuestro catálogo, el camino es simple: completás el formulario con los datos del inmueble, un agente lo revisa y, si se aprueba, nos contactamos para coordinar la visita y la sesión de fotos. No hace falta que vengas a la oficina para empezar.

La revisión no es un trámite: sirve para detectar antes de publicar las cosas que después frenan una operación. Miramos que la situación documental esté clara, que el precio esté dentro de lo que la zona convalida y que la descripción no prometa algo que la propiedad no tiene. Un aviso que genera muchas consultas y ninguna oferta suele ser un aviso mal armado, y eso se corrige antes, no después.

Una vez publicada, tu propiedad aparece en nuestro catálogo web, se difunde en los portales inmobiliarios donde busca ese tipo de comprador y se envía a la base de usuarios que ya cargaron preferencias de búsqueda compatibles. Si alguien guardó una búsqueda que coincide con tu inmueble, le llega el aviso automáticamente.`,
    incluye: [
      "Formulario online: cargás la propiedad desde donde estés",
      "Revisión por un agente en 24 a 48 horas hábiles",
      "Visita y sesión de fotos profesional al aprobarse",
      "Redacción del aviso y publicación en el catálogo web",
      "Difusión en portales inmobiliarios y redes sociales",
      "Aviso automático a los usuarios cuya búsqueda coincida",
    ],
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
    persuasion: {
      titulo: "Empezá ahora y en 48 horas tenés una respuesta",
      texto: "No necesitás tener las fotos listas ni el precio decidido: con los datos básicos del inmueble alcanza para que un agente lo revise y te diga si está en condiciones de publicarse y en cuánto conviene ofrecerlo. El formulario te lleva unos minutos y no te compromete a nada.",
      imagen: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1600&auto=format&fit=crop",
      alt: "Propietaria que publicó su propiedad con nosotros",
    },
    faq: [
      { p: "¿Publicar tiene costo?", r: "No. La publicación en nuestro catálogo no tiene costo: la comisión se cobra recién cuando la operación se concreta." },
      { p: "¿Qué pasa si rechazan mi solicitud?", r: "Te explicamos el motivo. Casi siempre es algo corregible —falta documentación o el precio está fuera de mercado— y podés volver a enviarla." },
      { p: "¿Puedo publicar si ya está en otra inmobiliaria?", r: "Sí, salvo que hayas firmado una exclusividad vigente. Avisanos y lo revisamos antes de publicar." },
    ],
    galeria: [
      { src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop", alt: "Ambiente preparado para la sesión de fotos" },
      { src: "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=800&auto=format&fit=crop", alt: "Casa publicada en los portales inmobiliarios" },
    ],
    whatsapp: "Publicación y Comercialización",
    g1: "#0b7a4b", g2: "#0f766e", light: "#f0fdfa", lightText: "#134e4a", accent: "#0f766e",
    ctaEspecial: true,
  },

  legal: {
    icon: FileCheck,
    titulo: "Gestión Legal y Documental",
    tagline: "Revisamos títulos, deudas y gravámenes antes de que firmes, para que no aparezcan sorpresas después.",
    hero: {
      src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2400&auto=format&fit=crop",
      alt: "Firma de la documentación de una operación inmobiliaria",
      position: "center 50%",
    },
    descripcion: `La mayoría de las operaciones que se caen no se caen por el precio: se caen por un problema documental que aparece tarde. Una sucesión sin terminar, una hipoteca que figura cancelada pero nunca se levantó del registro, planos que no coinciden con lo construido o una inhibición sobre el titular pueden frenar una escritura que ya estaba acordada.

Nuestro trabajo es detectar todo eso antes. Pedimos el informe de dominio y el de inhibiciones en el Registro General de la Provincia, verificamos que quien firma sea efectivamente quien puede hacerlo, revisamos que la descripción del título coincida con la realidad física del inmueble y confirmamos que impuestos, servicios y expensas estén al día. Cada punto que aparece se informa por escrito, con lo que implica y cómo se resuelve.

A partir de ahí redactamos o revisamos el boleto de compraventa —qué se entrega, cuándo, con qué plazos y qué pasa si alguna de las partes no cumple— y coordinamos con la escribanía interviniente hasta la firma y la inscripción registral. Trabajamos con el escribano de tu confianza o te sugerimos uno si no tenés.`,
    incluye: [
      "Informe de dominio e inhibiciones en el Registro General",
      "Verificación de titularidad y capacidad de quien firma",
      "Control de deudas de impuestos, servicios y expensas",
      "Cotejo del título con la situación física y los planos del inmueble",
      "Redacción o revisión del boleto de compraventa",
      "Coordinación con la escribanía hasta la inscripción final",
    ],
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
    persuasion: {
      titulo: "Revisalo antes de dar la seña, no después",
      texto: "La seña es el momento en que el dinero deja de ser tuyo y empieza a ser difícil recuperarlo. Si estás por comprar y tenés dudas sobre la documentación, mandanos lo que tengas y lo revisamos: media hora de lectura puede ahorrarte meses de trámite. También trabajamos con propiedades que se compran a particulares, sin inmobiliaria de por medio.",
      imagen: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1600&auto=format&fit=crop",
      alt: "Operación cerrada con la documentación en regla",
    },
    faq: [
      { p: "¿Puedo contratarlos si compro sin inmobiliaria?", r: "Sí. Es uno de los casos donde más sentido tiene: en una operación entre particulares nadie revisa la documentación por vos." },
      { p: "¿Qué pasa si aparece una deuda o un gravamen?", r: "Te informamos qué es, cuánto representa y quién debería hacerse cargo, para que puedas negociarlo o desistir de la operación a tiempo." },
      { p: "¿Trabajan con mi escribano?", r: "Sí. Coordinamos con la escribanía que elijas; si no tenés una, te acercamos profesionales con los que trabajamos habitualmente." },
    ],
    galeria: [
      { src: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800&auto=format&fit=crop", alt: "Respaldo jurídico de la operación" },
      { src: "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?q=80&w=800&auto=format&fit=crop", alt: "Propiedad con los títulos verificados" },
    ],
    whatsapp: "Gestión Legal y Documental",
    g1: "#0b7a4b", g2: "#14532d", light: "#f0fdf4", lightText: "#166534", accent: "#0b7a4b",
  },
};

export default async function ServicioDetallePage({ params }: { params: Promise<{ id: string }> }) {
  // Next 15: `params` es una promesa y hay que esperarla antes de leerla.
  const { id } = await params;
  const s = serviciosData[id as keyof typeof serviciosData];
  if (!s) notFound();

  const whatsappUrl = whatsappLink(`¡Hola! Estoy interesado en el servicio de: ${s.whatsapp}`);

  return (
    <main className="min-h-screen bg-surface">

      {/* ══ HERO — mismo lenguaje visual que el de la landing ═════════ */}
      <ServicioHero
        image={s.hero.src}
        imageAlt={s.hero.alt}
        imagePosition={s.hero.position}
        eyebrow="Servicio Inmobiliario"
        titulo={s.titulo}
        tagline={s.tagline}
        accent={s.accent}
        whatsappUrl={whatsappUrl}
      />

      {/* ══ BODY ════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-3">

          {/* ─ COLUMNA PRINCIPAL ─────────────────────────────────── */}
          <div className="flex flex-col gap-6 lg:col-span-2">

            {/* Descripción */}
            <Card>
              <SectionHeader accent={s.accent} title="¿En qué consiste?" />
              <div className="mt-5 space-y-4">
                {s.descripcion.split("\n\n").map((p, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-ink-600">{p.trim()}</p>
                ))}
              </div>
            </Card>

            {/* Qué incluye */}
            <Card>
              <SectionHeader accent={s.accent} title="Qué incluye el servicio" />
              <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {s.incluye.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: s.accent }} />
                    <span className="text-sm leading-relaxed text-ink-600">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Imágenes de apoyo entre secciones — chicas y cuadradas, a propósito:
                acompañan, no compiten con el contenido. */}
            <div className="grid grid-cols-2 gap-4 sm:max-w-md">
              {s.galeria.map((img) => (
                <div
                  key={img.src}
                  className="relative aspect-square overflow-hidden rounded-2xl border border-ink-200/70 shadow-sm"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 640px) 45vw, 220px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Timeline de pasos */}
            <Card>
              <SectionHeader accent={s.accent} title="¿Cómo funciona?" />

              <div className="relative mt-6">
                {/* línea vertical */}
                <span
                  className="absolute top-4 bottom-4 left-4.75 w-px rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${s.accent}50, transparent)` }}
                />

                <div className="space-y-6">
                  {s.pasos.map((paso, i) => (
                    <div key={i} className="group flex items-start gap-5">
                      <div
                        className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-black shadow-sm transition-all duration-200 group-hover:scale-110 group-hover:shadow-md"
                        style={{ background: s.light, color: s.accent, border: `2px solid ${s.accent}20` }}
                      >
                        {paso.num}
                      </div>
                      <div className="w-full border-b border-ink-100 pt-1.5 pb-4 last:border-0">
                        <p className="text-sm font-bold text-ink-900">{paso.titulo}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-ink-500">{paso.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* ── Bloque persuasivo — el único con foto de gente ──
                Va acá, justo antes de las FAQ y del cierre, porque es el punto
                donde la persona ya entendió el servicio y está decidiendo si
                nos escribe o no. */}
            <div className="overflow-hidden rounded-3xl border border-ink-200/70 bg-white shadow-sm">
              <div className="relative h-56 w-full sm:h-64">
                <Image
                  src={s.persuasion.imagen}
                  alt={s.persuasion.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 640px"
                  className="object-cover"
                />
                {/* Degradado inferior: la foto se ve limpia arriba y engancha
                    con la tarjeta blanca abajo. */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-white via-white/40 to-transparent" />
              </div>

              <div className="-mt-6 px-7 pb-7">
                <span
                  className="mb-4 block h-1.5 w-14 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${s.g1}, ${s.g2})` }}
                />
                <h2 className="text-xl font-bold tracking-tight text-ink-900">
                  {s.persuasion.titulo}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                  {s.persuasion.texto}
                </p>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${s.g1}, ${s.g2})` }}
                >
                  <MessageCircle size={15} />
                  Hablar con un agente
                </a>
              </div>
            </div>

            {/* Preguntas frecuentes */}
            <Card>
              <SectionHeader accent={s.accent} title="Preguntas frecuentes" />
              <div className="mt-5 divide-y divide-ink-100">
                {s.faq.map((f, i) => (
                  <div key={i} className="py-4 first:pt-0 last:pb-0">
                    <p className="flex items-start gap-2.5 text-sm font-bold text-ink-900">
                      <HelpCircle size={15} className="mt-0.5 shrink-0" style={{ color: s.accent }} />
                      {f.p}
                    </p>
                    <p className="mt-1.5 pl-6.25 text-sm leading-relaxed text-ink-500">{f.r}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* CTA especial — solo comercialización */}
            {'ctaEspecial' in s && s.ctaEspecial && (
              <div
                className="relative overflow-hidden rounded-3xl p-7"
                style={{ background: s.light, border: `2px solid ${s.accent}20` }}
              >
                <span
                  className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20"
                  style={{ background: s.accent }}
                />
                <div className="relative z-10">
                  <span
                    className="mb-3 inline-block rounded-full px-3 py-1 text-[11px] font-bold tracking-widest uppercase"
                    style={{ background: `${s.accent}15`, color: s.accent }}
                  >
                    Acción recomendada
                  </span>
                  <h3 className="mb-2 text-xl font-bold text-ink-900">
                    ¿Querés publicar tu propiedad?
                  </h3>
                  <p className="mb-5 max-w-sm text-sm leading-relaxed text-ink-500">
                    Completá el formulario online con los datos de tu inmueble y nuestro agente lo evaluará en 24 a 48hs.
                  </p>
                  <Link
                    href="/publicar"
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg"
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
            <Card compact>
              <SectionHeader accent={s.accent} title="¿Por qué elegirnos?" small />
              <div className="mt-4 space-y-2">
                {s.beneficios.map((b, i) => {
                  const BIcon = b.icon;
                  return (
                    <div
                      key={i}
                      className="group flex cursor-default items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-surface"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                        style={{ background: s.light }}
                      >
                        <BIcon size={14} style={{ color: s.accent }} />
                      </div>
                      <span className="text-[13px] leading-snug font-medium text-ink-600">{b.texto}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Tarjeta CTA WhatsApp */}
            <div
              className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${s.g1} 0%, ${s.g2} 100%)` }}
            >
              <span className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-white/10" />
              <span className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5" />
              <div className="relative z-10">
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)" }}
                >
                  <MessageCircle size={18} />
                </div>
                <h3 className="mb-1 text-lg font-bold">¿Te interesa?</h3>
                <p className="mb-5 text-sm leading-relaxed text-white/75">
                  Consultanos sin compromiso. Un agente te responde a la brevedad.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ color: s.accent }}
                >
                  <MessageCircle size={15} />
                  Consultar por WhatsApp
                </a>
              </div>
            </div>

            {/* Otros servicios */}
            <Card compact>
              <SectionHeader accent={s.accent} title="Otros servicios" small />
              <div className="mt-4 space-y-1">
                {Object.entries(serviciosData)
                  .filter(([key]) => key !== id)
                  .slice(0, 4)
                  .map(([key, sv]) => {
                    const SIcon = sv.icon;
                    return (
                      <Link
                        key={key}
                        href={`/servicios/${key}`}
                        className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-ink-500 transition-all hover:bg-surface hover:text-ink-900"
                      >
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                          style={{ background: s.light }}
                        >
                          <SIcon size={13} style={{ color: s.accent }} />
                        </div>
                        <span className="flex-1 text-[13px] leading-tight font-medium">{sv.titulo}</span>
                        <ArrowRight
                          size={12}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ color: s.accent }}
                        />
                      </Link>
                    );
                  })}
              </div>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

// ── Helpers ───────────────────────────────────────────────────
/** Tarjeta blanca estándar del sitio: mismos bordes y sombra que el resto. */
function Card({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div
      className={`rounded-3xl border border-ink-200/70 bg-white shadow-sm ${compact ? "p-6" : "p-8"}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ accent, title, small = false }: { accent: string; title: string; small?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-1 shrink-0 rounded-full" style={{ background: accent, height: small ? "16px" : "22px" }} />
      <h2 className={`font-bold tracking-tight text-ink-900 ${small ? "text-sm" : "text-lg"}`}>{title}</h2>
    </div>
  );
}

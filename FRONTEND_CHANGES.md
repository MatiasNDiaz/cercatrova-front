# FRONTEND_CHANGES.md — Adaptación al backend NestJS post-hardening

Registro de cambios del refactor de alineación con `API_CONTRACT.md` (repo del backend).
Formato: por bloque → archivo / problema / solución / estado.

---

# PARTE 2 — Fundaciones de rediseño UI/UX (sesión de diseño)

> ## ⚠️ LEER PRIMERO: estado de adopción de las fundaciones
>
> Las 3 fundaciones (tokens de color, `ConfirmDialog`, `Field`/`Input`/`Select`) se
> crearon en la sesión de diseño **sin usarse en ningún lado**, y se van adoptando
> por partes en las sesiones siguientes. Estado actual:
>
> | Pieza | Estado de adopción |
> |---|---|
> | `ConfirmDialog` | ✅ **migrado 8/8** — no queda ninguna copia manual (ver Bloque UI-5) |
> | Tokens de color | 🟡 **parcial** — `surface-deep` + los focos de `Input`/`Select`. Los 581 usos de `#0b7a4b` siguen hardcodeados |
> | `Field`/`Input`/`Select` | ✅ **migrado 3/3** — no queda ninguna definición local (ver Bloque UI-7) |
>
> La migración restante se hace **página por página**, para que cada sesión quede
> revisable y no se genere un diff gigante imposible de auditar.

---

## Bloque UI-1 — Tokens de color

### `src/app/globals.css`
- **Problema:** `#0b7a4b` aparecía hardcodeado **581 veces en 35 archivos**, junto con
  4 variantes de verde casi idénticas (`#0f8b57`, `#14a366`, `#14965f`, `#0f8c58`) y
  5 grises de fondo distintos, sin ninguna variable central. Tailwind v4 no usa
  `tailwind.config`, así que no había dónde definirlos.
- **Sintaxis confirmada (no asumida):** Tailwind **4.1.18**; se verificó contra
  `node_modules/tailwindcss/theme.css`, que declara sus propios tokens con
  `@theme default { --color-red-50: … }`. La forma correcta en v4 es un bloque
  `@theme { }` en el CSS, después de `@import "tailwindcss"` — **no** la config JS de v3.
- **Solución:** tres grupos de tokens en `@theme`, que generan utilidades
  automáticamente (`bg-brand-700`, `text-ink-500`, `border-brand-700/20`, `from-brand-600`…).

**Paleta = la del logo: verde + negro/gris + blanco. Sin acento.**
(Se evaluó sumar un acento cálido; se descartó por decisión de marca — el logo no
tiene ningún color fuera de esa terna.)

| Grupo | Tokens | Nota |
|---|---|---|
| Verde | `--color-brand-50` … `--color-brand-950` + alias `--color-brand` | escala de 11 pasos a hue ~155° |
| Negro/gris | `--color-ink-50` … `--color-ink-950` | neutros con un dejo verde mínimo; `ink-950` = negro del logo |
| Superficies | `--color-surface`, `--color-surface-alt`, `--color-surface-deep` | blanco puro NO tiene token: sigue siendo `bg-white` |
| Gradientes | `--gradient-brand`, `--gradient-brand-hover` (en `:root`) | `style={{ background: 'var(--gradient-brand)' }}` |

**Decisión clave — los pasos 500/600/700/800 del verde son los tonos EXACTOS que el
proyecto ya usa**, no aproximaciones:

| Token | Hex | Qué era antes |
|---|---|---|
| `brand-500` | `#14a366` | extremo claro de los gradientes (31 usos) |
| `brand-600` | `#0f8b57` | inicio de gradientes + hovers (73 usos) |
| `brand-700` | `#0b7a4b` | **el verde de marca — 581 usos** |
| `brand-800` | `#085031` | hover oscuro / pressed |

Esto hace que migrar un archivo sea un reemplazo 1:1 (`text-[#0b7a4b]` → `text-brand-700`)
**sin ningún cambio visual**, en vez de un rediseño encubierto. Los tonos sueltos
`#14965f` / `#0f8c58` / `#0d7a4d` colapsan en `brand-600`/`brand-700` al migrar (son
diferencias de 2-4% de luminancia, imperceptibles).

**Por qué la escala neutra se llama `ink` y no `gray`:** nombrarla `gray` **pisaría** la
escala nativa de Tailwind y cambiaría silenciosamente cada `text-gray-*` ya existente
en el proyecto. `ink-*` convive con `gray-*` sin tocar nada.

**Lo que NO se tocó, según lo pedido:** los grises de texto (`text-gray-*`) y el rojo
de error/favoritos (`text-red-*`) siguen usando la escala nativa de Tailwind. Los
colores de marcas ajenas (WhatsApp `#25d366`, Facebook `#1877f2`, gradiente de
Instagram) tampoco se tocaron ni tienen token.

**✅ RESUELTO (ver Bloque UI-5) — el tono que no mapeaba limpio:** el fondo del dashboard
admin era `#cbd8cd`, más oscuro que el de usuario (`#dde3dd`). Se decidió **unificarlos en
uno solo usando el más oscuro**: `--color-surface-deep` = `#cbd8cd`, aplicado a las dos
zonas. Es un cambio visual intencional y aprobado (el dashboard de usuario quedó un poco
más oscuro). No hizo falta un paso `surface-deepest`.

- **Estado:** ✅ definido — adopción **parcial**: `surface-deep` ya está en uso (2 archivos);
  los 581 usos de `#0b7a4b` siguen hardcodeados, pendientes de migrar página por página.

---

## Bloque UI-2 — `<ConfirmDialog />`

### `src/modules/shared/ui/ConfirmDialog.tsx` (NUEVO)
- **Problema:** el mismo modal de confirmación (`toast.custom` con ícono + texto + 2 botones)
  está reimplementado **8 veces**, cada copia con sus propias clases: 3 de logout
  (`dashboard/layout.tsx`, `dashboardAdmin/layout.tsx`, `NavbarPrivate.tsx`) y 5 de borrado
  (`dashboardAdmin/{usuarios,usuarios/[id],solicitudes,propiedades}/page.tsx`,
  `PropertyDetail.tsx`). Visualmente quedaban genéricos.
- **Solución:** una función `confirmDialog({ title, message, confirmLabel, cancelLabel, variant, icon, onConfirm, onCancel })`
  que dispara el mismo patrón `toast.custom`, con **diseño compacto de ícono lateral**
  (elegido sobre la alternativa centrada): ícono 44px a la izquierda, texto alineado a
  la izquierda, botones abajo a la derecha. Ancho 420px.
  - Fondo con `backdrop-blur` + oscurecido `ink-950/40`.
  - Ícono con entrada animada (spring de Framer Motion, delay 60ms) y card con
    entrada spring / salida suave de 160ms — no aparece ni desaparece de golpe.
  - `variant: 'danger'` → rojo del proyecto (`red-600`); `variant: 'default'` →
    gradiente de marca vía `var(--gradient-brand)`.
  - Botones `rounded-xl`, más anchos que altos, con hover sutil (`brightness`/tono) y
    `active:scale-[0.98]`.
- **Detalle técnico que vale documentar:** el fondo se renderiza con `createPortal` a
  `document.body` **a propósito**. Sonner aplica `transform` al contenedor del toast, y
  un ancestro con `transform` convierte `position: fixed` en relativo a ese ancestro —
  sin el portal, el "fondo de pantalla completa" quedaría encerrado dentro del modal.
- **Mejoras de comportamiento respecto de las 8 copias actuales:**
  - `duration: Infinity` — las copias de hoy usan 5-10s, o sea que **el modal de
    confirmación desaparece solo mientras el usuario lo está leyendo**. Eso es un bug
    real del código actual, no una preferencia estética.
  - `onConfirm` puede ser `async`: el botón muestra spinner y el modal se cierra recién
    cuando la promesa resuelve (hoy las copias cierran primero y ejecutan después).
  - Se cierra con `Escape` y con click en el fondo.
  - `role="alertdialog"` + `aria-modal`.
- **Nota de firma:** `onConfirm` es `() => void | Promise<void>`. Un one-liner como
  `onConfirm: () => toast.success('...')` **no compila** (toast devuelve un id) — hay que
  usar cuerpo con llaves. Es intencional: mantiene el contrato estricto.
- **Estado:** ✅ creado y **✅ migrado 8/8** — ver Bloque UI-5 para el detalle de la
  adopción. No queda ninguna copia manual del modal en el proyecto.

---

## Bloque UI-3 — `<Field />` / `<Input />` / `<Select />`

### `src/modules/shared/ui/{Field,Input,Select}.tsx` (NUEVOS)
- **Problema:** `Field` + `inputCls`/`selectCls` duplicados en 3 archivos
  (`PropertyForm.tsx`, `publicar/page.tsx`, `preferencias/page.tsx`).
- **Canon elegido:** 2 de las 3 copias (`PropertyForm` y `preferencias`) eran idénticas
  (`label` en `text-xs font-bold text-gray-700`, input con `placeholder:text-gray-400`);
  `publicar` difería mínimamente (`font-semibold text-gray-800`, sin `hint`). Se tomó la
  versión mayoritaria como canónica.
- **Solución:** `Field` (label + children + `hint`/`error`/`required`/`htmlFor`), `Input`
  y `Select`, ambos aceptando todas las props nativas + `invalid` para el estado de error.
  `inputBaseClasses` y `selectBaseClasses` se exportan para casos donde no se puede usar
  el componente (ej. `<textarea>`).
- **Apariencia: idéntica a la actual, a propósito** (fondo gris que blanquea al foco). El
  único cambio en el string de clases es que el color de foco sale de `brand-700` en vez
  del hex `#0b7a4b` — **mismo valor exacto**, cero diferencia visual. El rediseño visual
  de inputs queda para una sesión aparte.
- **⚠️ Bug heredado, mantenido a propósito:** las 3 copias usan `appearance-none` en el
  `<select>`, que **saca la flecha nativa sin poner ninguna en su lugar** — el control
  queda sin indicador de que es desplegable. Se replicó igual para no cambiar el diseño
  en esta sesión, pero está documentado en el propio archivo para resolverlo cuando
  toquemos el diseño de inputs.
- **No incluido:** `SectionTitle` también está triplicado en esos mismos 3 archivos, pero
  quedó fuera del alcance pedido para esta sesión. Candidato obvio para la próxima.
- **Estado:** ✅ creados y **✅ migrados 3/3** — ver Bloque UI-7.

---

## Bloque UI-4 — Ruta temporal de preview

### `src/app/preview-ui/page.tsx` (NUEVO — TEMPORAL, BORRAR AL CERRAR EL REDISEÑO)
- **Para qué:** ver las 3 piezas funcionando de verdad (no en capturas) mientras se
  construyen, dado que ninguna está montada en el producto todavía.
- **Cómo:** `npm run dev` → `http://localhost:3000/preview-ui`. Muestra las escalas
  `brand`/`ink`/superficies como swatches con su hex y su equivalencia con los tonos
  viejos, el gradiente de marca, los 3 disparadores de `ConfirmDialog`
  (`danger` / `default` / `onConfirm` async con spinner) y los campos de formulario con
  y sin estado de error.
- **Nota:** es la única pieza de esta sesión que sí se "usa" — y es descartable. Borrar
  la carpeta `src/app/preview-ui/` cuando el rediseño esté cerrado.
- **Estado:** ✅ creada — temporal.

---

## Bloque UI-5 — Migración de `ConfirmDialog` a sus 8 usos reales

Primera sesión de adopción: se reemplazaron **las 8 implementaciones manuales** de
`toast.custom` por `confirmDialog()`. **Ya no queda ninguna copia manual** — verificado
por grep: los únicos `toast.custom` / `toast.dismiss` del proyecto están **dentro** de
`ConfirmDialog.tsx`.

### Decisión previa resuelta: `surface-deep` unificado
- **Contexto:** el Bloque UI-1 dejó pendiente que el fondo del dashboard admin
  (`#cbd8cd`) no mapeaba limpio contra `surface-deep` (`#dde3dd`, dashboard de usuario).
- **Resuelto:** se unifican en **uno solo, usando el más oscuro (`#cbd8cd`)**.
  `--color-surface-deep` pasó a `#cbd8cd` y los dos layouts ahora usan `bg-surface-deep`
  en vez de sus hex literales.
- **⚠️ Es un cambio visual intencional y aprobado:** el dashboard de **usuario** se ve un
  poco más oscuro que antes. No es una regresión.

### Archivos migrados

| # | Archivo | Caso | `variant` |
|---|---|---|---|
| 1 | `src/app/(private)/dashboard/layout.tsx` | logout | `default` |
| 2 | `src/app/(admin)/dashboardAdmin/layout.tsx` | logout | `default` |
| 3 | `src/modules/shared/ui/NavbarPrivate.tsx` | logout | `default` |
| 4 | `src/app/(admin)/dashboardAdmin/usuarios/page.tsx` | eliminar usuario | `danger` |
| 5 | `src/app/(admin)/dashboardAdmin/usuarios/[id]/page.tsx` | eliminar solicitud | `danger` |
| 6 | `src/app/(admin)/dashboardAdmin/solicitudes/page.tsx` | eliminar solicitud | `danger` |
| 7 | `src/app/(admin)/dashboardAdmin/propiedades/page.tsx` | eliminar propiedad | `danger` |
| 8 | `src/app/(public)/properties/[id]/PropertyDetail.tsx` | eliminar comentario | `danger` |

### Cambios de comportamiento que trae la migración (todos deseados)
- **Los modales ya no se auto-cierran.** Las 8 copias usaban `duration` de 5s / 10s (y
  la de `PropertyDetail` ni siquiera lo seteaba, así que caía en el default de ~4s):
  **el modal de confirmación desaparecía solo mientras el usuario lo leía.** Ahora es
  `duration: Infinity`. Este era un bug real del código anterior.
- **El botón de confirmar espera a la request.** Antes todas las copias hacían
  `toast.dismiss(t)` y *después* disparaban la llamada; ahora `onConfirm` es async, el
  botón muestra spinner y el modal se cierra cuando la promesa resuelve.
- **Se cierra con Escape y con click en el fondo** (antes no).
- **Orden de botones normalizado.** Los 3 modales de logout tenían el botón prominente
  verde en *"No, me quedo"* (izquierda) y la acción real *"Sí, salir"* en gris a la
  derecha. Ahora se sigue la convención estándar: cancelar en gris a la izquierda,
  confirmar destacado a la derecha. Los textos de los botones se conservaron.

### Detalles de la migración
- **Datos dinámicos en el mensaje:** los casos que mostraban un dato variable (nombre de
  usuario, `#id` de solicitud, título de propiedad) lo hacían en una línea aparte del JSX.
  Se resolvió **armando el string de `message` antes de llamar** a `confirmDialog()`, sin
  tocar el componente compartido.
- **Fallback de nombre eliminado:** los modales de logout usaban `user?.name || "Matias"`
  / `|| "Admin"` / `|| "Usuario"` — o sea que un usuario sin nombre veía el saludo
  *"¡Esperamos verte pronto, Matias!"*. Ahora, si no hay nombre, se usa una segunda
  redacción sin saludo personalizado.
- **`handleDelete` de `propiedades/page.tsx`** estaba declarado `async` sin ningún `await`
  en su cuerpo; se sacó el `async` (el trabajo asíncrono vive ahora en `onConfirm`).
- **Los `catch` se dejaron exactamente como estaban** (mensajes hardcodeados tipo
  `'No se pudo eliminar'`), para que el diff de esta sesión sea puramente mecánico y
  auditable. **Pendiente:** migrarlos a `getErrorMessage()` como en el resto del proyecto
  — `usuarios/[id]/page.tsx` ya importa el helper y lo usa en otras funciones, así que ahí
  la inconsistencia queda dentro del mismo archivo.

### ⚠️ Efecto colateral medido: +40 kB de JS compartido
El build pasa, pero el **First Load JS compartido por todas las rutas subió de 185 kB a
225 kB**. Causa: `ConfirmDialog` importa `framer-motion`, y ahora lo importan
`NavbarPrivate` y los dos layouts de dashboard — es decir, quedó en el chunk compartido
de **toda** la app, incluidas las páginas públicas que antes no cargaban framer-motion.

Antes de esta migración framer-motion estaba instalado pero prácticamente sin uso, así
que el costo no se notaba. Opciones si molesta (ninguna aplicada todavía):
1. Cargar `ConfirmDialog` con `next/dynamic` (`ssr: false`) — el modal no se necesita en
   el primer render de ninguna página.
2. Reemplazar las 2 animaciones de framer-motion por transiciones CSS + `@keyframes`;
   el componente usa spring en la entrada del ícono y de la card, nada que no se pueda
   aproximar con CSS.

No se decidió acá porque es una compensación de performance vs. animación que conviene
mirar junto con el resto del rediseño.

- **Estado:** ✅ 8/8 migrados — 0 copias manuales restantes.

---

## Bloque UI-6 — Fix de `searchParams` (Next.js 15)

### `src/app/(public)/properties/page.tsx`
- **Problema:** el Server Component leía `searchParams.page`, `searchParams.limit` y
  `{...searchParams}` de forma directa. En Next.js 15 `searchParams` es una **Promise**;
  accederla sin `await` tiraba warning en consola (la página igual funcionaba).
- **Solución:** se tipó la prop como `Promise<Record<string, string | string[] | undefined>>`
  y se agregó `const params = await searchParams;` al inicio del componente.
- **Bonus (equivalente en runtime):** el spread estaba **después** de `page`/`limit`, así
  que pisaba los valores numéricos con el string crudo de la URL — el `Number(...) || 1`
  quedaba anulado cuando el parámetro venía en la URL. Como axios serializa ambos al mismo
  query string (`?page=2`), el resultado en la red era idéntico; igual se movió el spread
  al principio para que el código haga lo que aparenta hacer.
- **Verificado:** filtros y paginación siguen funcionando igual (la página es un fetch
  server-side que pasa `initialItems`/`initialTotal` a `PropertiesCatalog`, que maneja el
  resto client-side vía `usePropertyFilters`).
- **Estado:** ✅

---

## Bloque UI-6b — `getErrorMessage()` en los `catch` de los `onConfirm`

- **Problema:** al migrar a `ConfirmDialog` (Bloque UI-5) los `catch` se dejaron
  deliberadamente intactos, con mensajes hardcodeados (`'No se pudo eliminar'`), para que
  aquel diff fuera puramente mecánico. Quedó inconsistente con el resto del proyecto, que
  usa `getErrorMessage()` desde el Bloque A — y sobre todo dentro de
  `usuarios/[id]/page.tsx`, que ya usaba el helper en otras funciones del mismo archivo.
- **Solución:** los `catch` pasaron de `catch { toast.error('...') }` a
  `catch (error) { toast.error(getErrorMessage(error)) }`. Ahora el usuario ve el motivo
  real del backend (ej. un 409 por integridad referencial) en vez de un genérico.

| Archivo | Acción |
|---|---|
| `dashboardAdmin/usuarios/page.tsx` | eliminar usuario |
| `dashboardAdmin/usuarios/[id]/page.tsx` | eliminar solicitud |
| `dashboardAdmin/solicitudes/page.tsx` | eliminar solicitud |
| `dashboardAdmin/propiedades/page.tsx` | eliminar propiedad |
| `properties/[id]/PropertyDetail.tsx` | eliminar comentario |

**⚠️ Son 5 casos, no 8.** El pedido hablaba de "los 8 `onConfirm`", pero **los 3 de logout
no tienen `catch`**: llaman a `AuthContext.logout()`, que ya captura sus propios errores
internamente (Bloque C: un 401 es éxito silencioso y cualquier otro error igual limpia la
sesión local) y **nunca rechaza**. Agregarles un `catch` sería código inalcanzable, así que
se dejaron como están.

- **Estado:** ✅ 5/5.

---

## Bloque UI-7 — Migración de `Field`/`Input`/`Select` a sus 3 usos reales

Se eliminaron las 3 definiciones locales duplicadas. Verificado por grep: no queda ningún
`inputCls`/`selectCls`/`inputClass`/`selectClass` ni ningún `function Field` en `src/app/`.

| # | Archivo | Migrado |
|---|---|---|
| 1 | `dashboardAdmin/propiedades/PropertyForm.tsx` | 9 inputs, 3 selects, 1 textarea |
| 2 | `dashboard/preferencias/page.tsx` | 3 inputs, 2 selects |
| 3 | `publicar/page.tsx` | 10 inputs, 4 selects, 1 textarea |

### Campos que NO usan `<Input>` (a propósito, no es un olvido)
Los inputs con **algo superpuesto adentro** (un `$` o un ícono) necesitan `pl-8`/`pl-9` en
vez del `px-4` que trae la clase base. Como el proyecto **no usa `tailwind-merge`**, pasar
`pl-9` por `className` dejaría `px-4` y `pl-9` compitiendo, y el ganador dependería del
orden en el CSS generado — no del orden en el atributo. Se dejaron como `<input>` explícito
con su string de clases actual, cada uno con un comentario que explica por qué:
- `PropertyForm.tsx`: precio (prefijo `$`).
- `preferencias/page.tsx`: 4 inputs con ícono (`Bed`/`Bath`/`Ruler`/`Hourglass`) + precio.

Se resuelven solos el día que exista un `<Input icon={...} />` o se adopte `tailwind-merge`.
No se tocó el componente compartido para acomodar estos casos.

### Los `<textarea>` usan `inputBaseClasses`
No hay componente `<Textarea>`, así que los 2 textareas usan la constante exportada:
`` `${inputBaseClasses} border-gray-200 focus:border-brand-700 resize-none` ``. Ojo: las
clases de borde van aparte porque `inputBaseClasses` trae `border` sin color (el color lo
aplica el componente según `invalid`).

### ⚠️ Diferencias visuales reales (chicas, pero las hay)
La migración **no** es 100% pixel-idéntica en 2 de los 3 archivos, porque sus copias locales
diferían del canon elegido en el Bloque UI-3:

1. **`publicar/page.tsx`** — era el outlier ya identificado en UI-3:
   - Label: `font-semibold text-gray-800` → **`font-bold text-gray-700`** (canon).
   - Los inputs **ganan `placeholder:text-gray-400`**, que su `inputClass` local no tenía.
2. **`preferencias/page.tsx`** — su `Field` local tenía `mt-0.5` en el hint que el canónico
   no tiene: el texto de ayuda queda **2px más pegado** al campo, en 5 lugares.

Ambas son consecuencia directa de unificar en la versión mayoritaria (decisión ya tomada en
UI-3), no efectos secundarios accidentales. `PropertyForm.tsx` sí quedó pixel-idéntico.

### Otros arreglos menores incluidos
- `publicar/page.tsx` tenía **4 selects con `aria-label='a'`** (literalmente la letra "a"
  como etiqueta accesible). Se reemplazaron por el texto real del campo.
- Se conservaron los asteriscos escritos a mano en los labels (`"Localidad *"`) en vez de
  pasar a la prop `required` del `Field` compartido, porque `required` renderiza un
  asterisco **rojo** y eso sí habría cambiado el aspecto.

- **Estado:** ✅ 3/3 migrados — 0 definiciones locales restantes.
- **Fuera de alcance (pedido explícito):** `SectionTitle` sigue triplicado en los mismos 3
  archivos. Es lo único duplicado que queda de este grupo.

---

## Bloque LANDING — Rediseño completo de `/`

Rediseño de la landing con los tokens y componentes ya creados. **No se tocó ninguna
otra página**: `/properties`, `/servicios/:id` y los dashboards quedan igual (la única
excepción es un cambio de 2 líneas en `servicios/[id]/page.tsx` para usar el helper de
WhatsApp centralizado).

### Ritmo vertical y fondos — decisión de layout
Se preguntó si el espacio entre secciones conviene arriba, abajo o ambos. **Se aplicó
padding simétrico** (`py-24 md:py-28`) dentro de cada sección, en vez de márgenes puestos
por la página. Es lo estándar hoy y tiene dos ventajas concretas:
- La separación entre dos secciones cualesquiera es **siempre la misma**, porque sale de
  sumar el padding inferior de una y el superior de la siguiente — no depende del orden.
- Cada sección es autocontenida: se puede reordenar, quitar o reutilizar sin arrastrar
  márgenes ajenos ni dejar huecos.

Los fondos **alternan** para que cada bloque se lea como una unidad sin líneas divisorias:
`blanco → surface → gradiente de marca → blanco → surface → blanco`. Por eso `main` ya no
lleva `bg-[#e5e7e5]`.

Todas las secciones usan el mismo encabezado (`SectionHeading`): eyebrow tipo pill + `h2`
+ subtítulo. Reemplaza el patrón "eyebrow + h2 + barra verde de 0.5px" que estaba copiado
en 5 archivos.

### Componentes nuevos

| Archivo | Para qué |
|---|---|
| `landing/components/SectionHeading.tsx` | Encabezado unificado de sección (antes duplicado ×5) |
| `landing/components/Reveal.tsx` | Wrapper de entrada al scroll (fade + slide) con framer-motion |
| `landing/components/FeaturedPropertyCard.tsx` | Tarjeta de propiedad para destacadas, con badge de rating |
| `landing/components/Confianza.tsx` | Sección nueva de contadores animados |
| `shared/lib/contact.ts` | `WHATSAPP_NUMBER` + `whatsappLink()` centralizados |
| `types/swiper-css.d.ts` | Declaración ambiental para los imports de CSS de Swiper |

### §1 — Hero (`landing/components/Slider.tsx`)
- **Carrusel migrado a Swiper** (`Autoplay` + `EffectFade` + `Navigation` + `Pagination`),
  con fade de 900ms y autoplay de 5.5s. Antes era `useState` + `setInterval` a mano.
- **GSAP eliminado de este componente.** Era el **único archivo del proyecto** que
  importaba `gsap` (verificado por grep), así que la dependencia queda sin uso. Las
  entradas de texto ahora las hace framer-motion, que ya se usa en el resto de la landing.
  `gsap` sigue en `package.json` — se puede desinstalar, no lo hice para no tocar deps.
- **Se quitó `HeaderSearch`** del árbol del hero (ver §8).
- **Dos CTAs**, ambos `rounded-2xl` y más anchos que altos (`px-9 py-4`):
  - Primario: "Ver propiedades" → `/properties`, con `var(--gradient-brand)` y hover que
    eleva + intensifica la sombra.
  - Secundario: outline blanco sobre la foto. **Cambia según sesión**: sin sesión es
    "Iniciar sesión" → `/login`; con sesión es "Ir a mi panel" → `/dashboardAdmin` o
    `/dashboard` según `user.role`. Mientras `isLoading` no se renderiza, para no mostrar
    "Iniciar sesión" y cambiarlo un instante después.
- **Contraste:** capa plana `ink-950/55` + gradiente `from-ink-950/85`. El texto blanco
  queda legible sobre cualquiera de las 4 fotos.
- **Imágenes:** Unsplash, **las 4 verificadas** (ver nota de imágenes abajo).

### §2 — Propiedades destacadas (`Featuredproperties.tsx` + `FeaturedPropertyCard.tsx`)
- **Cambio de endpoint:** pasa de `GET /properties/filter` a **`GET /properties`**
  (`propertiesService.getAll`, método nuevo). Motivo: `ratingAverage` **solo viene en
  `GET /properties` y `GET /properties/:id`** — con el endpoint anterior era imposible
  ordenar por valoración.
- **Orden:** `ratingAverage` desc → `created_at` desc. Ese segundo criterio hace que, si
  hay empates o pocas propiedades valoradas, **la lista se complete sola con las más
  recientes** hasta llegar a 4, sin lógica extra de relleno.
- **4 tarjetas** en grilla `1 / 2 / 4` columnas (`sm` / `xl`).
- `FeaturedPropertyCard` es **nuevo y aparte de `PropertyCard`**, a propósito: muestra el
  badge de rating (la del catálogo no lo tiene) y usa el tipo canónico de
  `shared/types/api` (el del catálogo usa el tipo viejo del módulo, sin `ratingAverage`).
  **No se tocó `PropertyCard`**, así que el catálogo queda intacto.
- Se mantiene el manejo de error del "Extra" (try/catch → estado vacío) para que el
  prerender no explote si el backend está caído durante el build.

### §3 — Servicios (`Servicios.tsx`)
- **Se eliminaron ~170 líneas de CSS inyectado** con `dangerouslySetInnerHTML` (tarjeta 3D
  con `rotate3d`, capa "glass" y botones burbuja). Además de estético, el CSI viejo fijaba
  `width: 320px; height: 350px`, así que **las tarjetas no eran responsivas y el texto se
  cortaba** en las descripciones más largas.
- Los 6 servicios (incluida **"Gestión Legal y Documental"**) ya estaban en el array, así
  que la grilla queda **3 + 3** en desktop, como se pidió.
- **Dos botones por tarjeta:** "Ver detalle" → `/servicios/:id`, y "Consultar" → WhatsApp
  con mensaje pre-armado que **nombra el servicio puntual**.

### §4 — Reseñas (`Reseñas.tsx`)
- **Migrado a Swiper con efecto `coverflow`**; el bloque `<style dangerouslySetInnerHTML>`
  del carrusel circular 3D **se eliminó por completo**.
- Motivo funcional, no solo estético: el carrusel viejo rotaba en 3D de forma continua
  (`@keyframes rotating` 35s), así que **buena parte de las tarjetas estaba de espaldas o
  muy inclinada y el texto era ilegible durante la mayor parte del ciclo**. Coverflow
  mantiene siempre una tarjeta al frente.
- Card rediseñada: ícono de comilla, texto, estrellas, y avatar + nombre abajo.
- Los 10 testimonios siguen hardcodeados (no vienen del backend).

### §5 — Presentación del agente (`Nosotros.tsx`)
- **El efecto de deslizamiento en hover se conservó**, como se pidió — es la interacción
  que define la sección. Se modernizó alrededor: easing `cubic-bezier(0.22,1,0.36,1)`,
  duración pareja entre ancho y contenido, tipografía y colores a tokens.
- **Bug arreglado de paso:** los tags tenían un `<span>` vacío con `opacity-0` que no
  mostraba nada nunca (parecía que faltaba un ícono). Ahora tienen ícono real de lucide.
- Las fotos son **las mismas de siempre** (`/imagenesPapucho/*`), como se indicó.

### §6 — Contador de confianza (`Confianza.tsx`) — SECCIÓN NUEVA
- 4 métricas con números que suben al entrar en viewport, sobre el gradiente de marca.
- **Sin dependencias nuevas:** `useInView` de framer-motion (ya instalado) +
  `requestAnimationFrame` con easing `easeOutCubic`. Respeta `prefers-reduced-motion`.
- **Los valores son copy de marketing, no datos de la DB** — decisión explícita: traer el
  total real con `GET /properties` haría que la cifra **baje** si se despublican
  propiedades (queda raro ver "250" un día y "180" al siguiente) y suma una request
  bloqueante a la landing. Si se quiere el número real, la fuente natural es `GET /stats/*`,
  que el backend ya expone y el frontend todavía no consume.

### §7 — FAQ (`RealEstateFAQ.tsx`)
- **Corrección de contenido pedida:** la ley de martilleros y corredores de Córdoba es la
  **7191**, no la 9445. Corregido en las **2** respuestas donde aparecía (gastos de compra
  y rol del martillero).
- **Acordeón con altura real animada** (`AnimatePresence` + `height: 'auto'`). Antes era
  `max-h-125` fijo, que además de animar raro **recortaba cualquier respuesta más larga
  que ese alto**.
- **Bug arreglado:** las preguntas ocultas se renderizaban con `absolute`/`invisible`
  (seguían en el DOM y podían superponerse). Ahora simplemente no se montan.
- Chevron que rota 180° + ícono que invierte fondo al abrir.

### §8 — Filtro fuera de la landing
- `HeaderSearch` (y con él `FiltersPanel`) **se sacó del hero**. La cadena
  `page.tsx → PropertySlider → HeaderSearch → FiltersPanel` ya no existe.
- **Verificado por grep:** `FiltersPanel` queda **únicamente** en
  `(public)/properties/Propertiescatalog.tsx`, que lo importa directo. No se tocó ahí.
- **⚠️ `HeaderSearch.tsx` quedó sin ningún uso** (grep: solo su propia definición).
  **No se borró** — se dejó a la espera de confirmación, según lo pedido.
- Efecto lateral positivo: el `<Suspense>` que hubo que agregarle a `HeaderSearch` para que
  `/` prerenderizara (ver tabla del "Extra") ya no es necesario para la landing, porque
  `useSearchParams` salió del árbol de `/`. `/` sigue siendo estático (○) en el build.

### Nota de imágenes — VERIFICADAS, no inventadas
El prompt ofrecía usar `source.unsplash.com` como fallback si no se podían verificar URLs.
**No se usó, y conviene saber por qué: ese endpoint fue dado de baja por Unsplash**, así
que no era una alternativa viable. En su lugar se verificó cada URL una por una
(descarga + inspección visual del contenido):

| Sección | URL | Verificado |
|---|---|---|
| Hero 1 | `photo-1600585154340-be6161a56a0c` | ✅ casa moderna, madera y vidrio |
| Hero 2 | `photo-1545324418-cc1a3fa10c00` | ✅ fachada de departamentos con balcones |
| Hero 3 | `photo-1600607687939-ce8a6c25118c` | ✅ living interior luminoso |
| Hero 4 | `photo-1512917774080-9991f1c4c750` | ✅ casa blanca moderna con pileta |
| Reseñas | `i.pravatar.cc/120?u=N` | ✅ retratos reales y diversos |

Detalle: la primera elección para el Hero 2 (`photo-1600596542815-ffad4c1539a9`) **se
descartó tras verla** — era otra villa blanca con pileta, casi idéntica al Hero 4, y no
acompañaba el copy urbano de Nueva Córdoba. Se reemplazó por la fachada de departamentos.

Los avatares siguen en `i.pravatar.cc` vía `<img>` plano (como ya estaban) en vez de pasar
a Unsplash: funcionan, son retratos diversos, y **evita agregar un host nuevo a
`next.config.ts`**. `images.unsplash.com` ya estaba en `remotePatterns`.

### Lo que NO se tocó
- **El botón "volver arriba"** de `globals.css` (`.button`) — intacto, como se pidió.
- **No se agregó** ningún botón flotante de WhatsApp.
- `LoadingWrapper` / `Loadingpage` (la pantalla de carga 3D con three.js) — sin cambios.
- La paleta: **solo** tokens `brand-*`, `ink-*`, `surface*` y blanco. Los únicos hex
  literales nuevos son `#25d366` (WhatsApp, marca ajena) en el hover del botón de consulta,
  y los dos verdes de marca dentro de los `<style>` de bullets de Swiper (que no pueden
  usar clases de Tailwind).

- **Estado:** ✅ build OK, 22/22 páginas, `/` estático.

---

## Bloque LANDING (continuación) — Tanda de pulido sobre feedback real

Ajustes hechos después de ver la página rediseñada en el navegador.

### §1 — Sistema de fondos replanteado
**Problema:** el contraste entre secciones era casi imperceptible — `bg-white` y
`bg-surface` (`#f5f7f5`) se diferencian en ~4% de luminancia.

**Solución:** se sumó una **tercera superficie**, un verde profundo con textura, y se
rediseñó el ritmo completo de las 8 secciones en conjunto:

| # | Sección | Fondo |
|---|---|---|
| 1 | Hero | Imagen + overlay `ink-950` |
| 2 | Estudiantes (nueva) | **`.surface-brand-deep`** |
| 3 | Destacadas | `surface` (gris) — tarjetas blancas |
| 4 | Servicios | Blanco |
| 5 | Trayectoria | **`.surface-brand-deep`** (ancla) |
| 6 | Reseñas | `brand-50` (verde muy claro) |
| 7 | Nosotros | Blanco |
| 8 | FAQ | `surface` (gris) |
| — | Footer | **`.surface-brand-deepest`** |

Dos clases nuevas en `globals.css`. **No son planas**, como se pidió: combinan un
gradiente diagonal apagado, dos halos radiales y una trama de puntos en `::before`.
- `.surface-brand-deep` → `#074c2f → #063923 → #042a19`
- `.surface-brand-deepest` → variante más oscura, solo para el footer

Se usa `::before` para la trama porque `background-image` ya está ocupado por los
gradientes; ambas variantes comparten la regla para poder usarse por separado.

### §2 — Hero: bug de imágenes + franja de estudiantes

**🐛 BUG CORREGIDO — las imágenes no se veían.** Consola:
`Image has fill and a height value of 0... parent element has not been styled to have a set height`.

*Causa:* el `<Swiper>` iba `absolute inset-0` y los slides dependían del CSS propio de
Swiper para heredar altura. `.swiper-slide` quedaba en **0px**, así que `<Image fill>` no
tenía contenedor con alto y no renderizaba nada.

*Fix:* la altura se propaga **explícitamente en toda la cadena**, y el Swiper dejó de ser
`absolute` (ahora participa del flujo y toma el alto real de la sección; el texto es el que
pasó a estar superpuesto):

```
section  h-160 / md:h-180   ← altura fija, ya no min-h
  └ Swiper            h-full  +  [&_.swiper-wrapper]:h-full  +  [&_.swiper-slide]:h-full
      └ div interno   relative h-full
          └ <Image fill>
```

*Verificado a nivel CSS* en el build — la regla se genera:
```css
.[&_.swiper-slide]:h-full .swiper-slide,
.[&_.swiper-wrapper]:h-full .swiper-wrapper { height: 100% }
```
y las 15 URLs de imagen aparecen en el HTML prerenderizado de `/`.

**Franja de estudiantes (`EstudiantesBand`).** Se eligió **una franja debajo del carrusel
en vez de un 5º slide**: como slide habría aparecido 1 de cada 5 rotaciones (el mensaje se
perdería) y habría competido con el CTA principal. Como franja fija está siempre visible y
además funciona de transición entre el hero oscuro y el resto de la página.
El CTA apunta a `/properties?search=Nueva+Córdoba` — se verificó que `usePropertyFilters`
lee el param `search`, así que el catálogo abre ya filtrado por la zona universitaria.

### §3 y §4 — CTAs: un solo componente (`CtaButton.tsx`)
**Problema:** había tres lenguajes de botón distintos en la misma página — el hero con
gradiente y **barrido de brillo permanente**, "Ver todas las propiedades" repitiendo el
gradiente, y "Ver detalle" de servicios en **negro** (`ink-900`).

**Solución:** un componente con tres variantes, usado en toda la landing:
- `primary` → **verde sólido `brand-700`**, sin gradiente. Sombra presente pero sobria.
  El barrido de luz **existe pero solo se dispara en hover** (`-translate-x-full` →
  `translate-x-full`); en reposo el botón es verde plano.
- `outlineLight` → contorno blanco, para fondos oscuros (hero, verde profundo).
- `outlineDark` → contorno verde, para fondos claros.

Todos comparten geometría (`rounded-xl`, `px-8 py-4`), peso `bold` y la misma respuesta
al hover (elevación + sombra + `active:scale-[0.98]`).

**Posición fija de los CTAs del hero:** el bloque de título + subtítulo tiene ahora
`min-h-64 md:min-h-68`. Antes los botones se movían verticalmente en cada cambio de slide,
porque los 4 textos tienen distinto largo.

### §5 — Trayectoria con vida
Los 4 números flotaban sueltos sobre el verde. Ahora cada métrica vive en su **tarjeta
glass** (`bg-white/[0.07]` + `backdrop-blur` + borde), con hover que eleva la tarjeta,
escala el ícono e **invierte sus colores** (de verde claro sobre translúcido a
`brand-800` sobre blanco). Jerarquía de color explícita: número en blanco puro,
label en `brand-200`.

### §6 — Reseñas
- **Más verde:** fondo de sección `brand-50`, barra superior con el gradiente de marca en
  cada tarjeta, comilla `brand-300`, anillo `brand-600` en el avatar y chip verde de operación.
- **Info nueva por testimonio:** **operación** (Compra / Venta / Alquiler / Tasación) y
  **zona** de Córdoba, para que el testimonio sea creíble y no un texto suelto.
- **Fotos reales:** se reemplazó `i.pravatar.cc` por **10 retratos de Unsplash**, todos
  verificados uno por uno (ver nota de imágenes). Variados en edad, género y origen.
  Se usa `next/image` porque `images.unsplash.com` ya estaba en `remotePatterns`.

### §7 — Tarjeta de Destacadas
- **`FavoriteButton` quitado SOLO de esta sección.** Verificado por grep: el componente
  sigue usándose en `PropertyCard` (catálogo `/properties`), donde funciona igual que
  siempre. Motivo: la landing es la puerta de entrada y el corazón empujaba a `/login` a
  quien todavía no tiene cuenta.
- **Signo `$`** antes del precio, con separador de miles `es-AR`.
- **Tono más empresarial:** `rounded-xl` en vez de `rounded-3xl`, borde `ink-200`,
  imagen más alta (`h-64`) y padding mayor. El contenedor de la sección pasó a
  `max-w-350` (1400px) para que las 4 tarjetas tengan cuerpo.
- Las tarjetas son **blancas sobre fondo gris**, así se despegan del fondo de verdad y no
  dependen solo de la sombra.
- Al no usar más `FavoriteButton`, el archivo **dejó de necesitar `'use client'`**.

### §8 — Píldoras de título
Eran `bg-brand-50` (`#eff9f4`) — prácticamente invisibles sobre blanco. Ahora son
**`bg-brand-700` sólido con texto blanco** y una sombra suave. Tienen presencia real sin
competir con el `h2`, porque son chicas. En las secciones de fondo verde la píldora usa
`bg-white/15` con borde, por contraste.

### §9 — Footer rediseñado
- **Se eliminó el arco SVG** de curvas grises/blancas superior y el verde plano `#0b7a4b`.
  Ahora usa `.surface-brand-deepest`, misma familia que el resto: el footer **cierra** la
  página en vez de cortarla.
- **Se eliminaron los 8 círculos decorativos y los 2 grids de puntos SVG** dibujados a mano
  (≈35 líneas de JSX): la textura la da la clase CSS.
- **Enlaces reorganizados:** 3 columnas claras (Navegación / Servicios / Contacto) sobre
  una grilla de 12, en vez de anchos dispares. Se sumaron enlaces que faltaban (FAQ,
  Asesoramiento, Publicar mi propiedad).
- **Redes sociales rediseñadas:** contenedores circulares neutros que **se tiñen del color
  real de cada marca al hacer hover**, en vez de estar siempre a todo color compitiendo
  entre sí y con el verde del fondo. Los colores de marca ajena (`#25d366`, `#1877f2`,
  gradiente de Instagram) se conservan intactos.
- **La información no cambió:** WhatsApp, Instagram, Facebook, dirección, mapa y matrícula
  son exactamente los mismos. Solo cambia el diseño.
- El `iframe` del mapa ganó un `title` (faltaba, es requisito de accesibilidad).
- El componente dejó de ser `'use client'`: no usa ningún hook.

### Nota de imágenes — 15 URLs verificadas
Todas las imágenes nuevas se verificaron **descargándolas y mirándolas**, no asumiendo que
existieran: 4 del hero + 1 de la franja de estudiantes + 10 retratos de reseñas.
Un caso concreto: la primera candidata a foto de estudiantes y varias de los retratos se
eligieron sobre alternativas descartadas al verlas.

- **Estado:** ✅ build OK, 22/22 páginas, `/` sigue estático.

---

## Bloque LANDING (tanda de ajustes) — pulido sobre feedback en navegador

Cuatro ajustes puntuales después de ver la landing renderizada.

### 1 — Botones del Hero medían distinto (`CtaButton.tsx`)
- **Causa (ya diagnosticada):** la variante `primary` ("Ver propiedades") no tenía borde y
  la `outlineLight` ("Iniciar sesión") tenía `border-2`. Esos 4px (2 por lado) hacían que
  el segundo botón se viera más grande en la misma fila.
- **Solución:** el `border-2` se movió a la clase `BASE`, así las **tres** variantes
  reservan el mismo box de borde; `primary` solo sobreescribe el color a
  `border-transparent`. **No se restó padding a mano** — si mañana cambia el grosor del
  borde, siguen quedando parejos solos.
- Verificado: ambos botones del hero comparten `BASE` (con `border-2`) y difieren solo en
  color de borde, así que miden idéntico.

### 2 — Nueva sección "Publicá tu propiedad" (`PublicarPropiedad.tsx`)
- **Ubicación:** entre `FeaturedProperties` y `Servicios` (confirmado en `page.tsx`).
- **Formato:** imagen como tarjeta flotante (redondeada + sombra + `ring`) a un lado, con
  una tarjetita "Publicación asistida" superpuesta; texto + lista de 3 bullets + CTA
  `primary` "Publicar mi propiedad" → `/publicar` al otro. Entra con `Reveal` (el mismo
  framer-motion del resto, no un sistema nuevo).
- **Fondo elegido: `bg-brand-50` (verde muy claro).** Queda entre la Destacadas de arriba y
  la Servicios blanca de abajo sin repetir ninguno de los dos, y deja resaltar la tarjeta
  de imagen blanca y el texto oscuro. Ritmo resultante:
  Hero → Destacadas(gris) → **Publicar(brand-50)** → Servicios(blanco) → Trayectoria(verde
  profundo) → Reseñas(brand-50) → Nosotros(blanco) → FAQ(gris) → Footer(verde).
- **⚠️ Imagen — no encontré la exacta que se pidió.** El brief era un *hombre solo,
  sonriendo, con la laptop de espaldas a la cámara, en su casa*. Tras revisar ~18 fotos de
  Unsplash (verificándolas visualmente una por una), no apareció ninguna con esa
  combinación exacta: las de un hombre solo eran retratos sin laptop; las de laptop-de-
  espaldas + gesto de disfrute eran de una mujer o de grupos/oficina. Se usó
  `photo-1600880292203-757bb62b4baf` (hombre sonriendo con laptop, ambiente cálido y
  profesional): cumple "hombre + sonriendo + laptop + facilidad/éxito", pero **son dos
  personas y el encuadre no es "monitor de espaldas"**. La alternativa que sí clava la
  composición y el mood (persona de frente, laptop de espaldas, gesto de disfrute en un
  living) es `photo-1584697964358-3e14ca57658b`, **pero es una mujer**. Cambiar la imagen
  es una línea (`src=` en `PublicarPropiedad.tsx`).

### 3 — Marca de agua en las tarjetas de Servicios (`Servicios.tsx`)
- Las 6 tarjetas se veían muy vacías. Se agregó, **detrás del contenido** (`z-0`, con el
  contenido envuelto en `relative z-10`):
  - la palabra **"CERCA"** en la fuente serif de marca (`var(--font-heading)` = Playfair),
    `font-black`, en `brand-100/60`, anclada abajo a la derecha y recortada por el
    `overflow-hidden` de la card;
  - un ícono `Building2` grande (120px) en `brand-50`, arriba a la derecha, que se
    intensifica apenas en hover.
- Ambos son `pointer-events-none` y `aria-hidden`; el ícono/título/descripción/botones no
  pierden legibilidad.

### 4 — Trayectoria: tarjetas blancas + marca de agua "CT" (`Confianza.tsx`)
- Cada una de las 4 métricas pasó de tarjeta "glass" translúcida a **tarjeta blanca** con
  sombra propia. Al cambiar el fondo a blanco se invirtieron los colores de texto para
  mantener contraste: número en `brand-700`, label en `ink-500`, ícono en `brand-50` que
  se vuelve `brand-700`→blanco en hover.
- Detrás de las tarjetas, sobre el verde profundo, se agregó una marca de agua **"CT"**
  gigante (`text-[28rem]`, Playfair, `text-white/6`) anclada a la derecha — apenas un verde
  más claro, decorativa, en `z-0`. Las tarjetas van en `z-10`.
- **Las animaciones de contador NO se tocaron:** `useInView` + `requestAnimationFrame`
  siguen igual; solo cambió el contenedor visual.

### Nota — `bg-gray-150` en Destacadas y FAQ (no introducido acá)
Un cambio previo puso `bg-gray-150` en `Featuredproperties` y `RealEstateFAQ`, pero
**`gray-150` no es un step de la escala de Tailwind** (va 100 → 200). Esa clase no genera
ninguna regla, así que esas dos secciones hoy toman el color del `body` (`#f2f1f1`) que se
ve por detrás — se ven gris claro **por accidente**, no por el token. Funciona visualmente
pero es frágil: si algún día el `body` cambia de color, esas secciones cambian con él. Si
la intención es un gris estable, conviene o definir `--color-gray-150` en `@theme`, o usar
`bg-surface` (que ya existe, `#f5f7f5`). **Se dejó como está** (fue un cambio intencional),
solo queda anotado.

- **Estado:** ✅ build OK, 23/23 páginas (la sección nueva no agrega ruta; el conteo subió
  porque el grupo `(auth)` sumó su layout en una sesión anterior), `/` sigue estático.

---

## Bloque LANDING (ritmo de fondos + fotos) — ajuste estructurado

Dos cambios pedidos, aplicados tras aprobación explícita del plan.

### Verificación previa
Antes de tocar nada se corrió `tsc` + `lint` + `build` para confirmar que los ajustes
manuales previos del usuario (sección "Publicá tu propiedad", tarjetas de Servicios
revertidas, botones del Hero parejos) no habían roto nada. Resultado: TSC limpio, build
exit 0, y solo warnings de lint **preexistentes** (imports sin usar en dashboard/admin),
ninguno en los archivos editados a mano. Nada roto.

### 1 — Ritmo de fondos predecible + fix de `gray-150`
**Problema:** dos secciones (`Featuredproperties` y `RealEstateFAQ`) usaban `bg-gray-150`,
que **no es un step de la escala de Tailwind** (va 100 → 200). Esa clase no generaba
ninguna regla, así que ambas tomaban el color del `body` (`#f2f1f1`) por detrás — se veían
gris por accidente, y era frágil (dependían del `body`).

**Solución (plan aprobado):** alternancia predecible **Blanco / Verde-claro** en las
secciones de contenido, con el verde oscuro (`.surface-brand-deep`) como puntuación. Solo
cambiaron 2 secciones; el resto quedó igual, respetando el `brand-50` bloqueado de "Publicá
tu propiedad". Mapa final de fondos, en orden real de `page.tsx`:

| # | Sección | Fondo final |
|---|---|---|
| 1 | Hero | `bg-ink-950` + imagen (oscuro) |
| 2 | Franja estudiantes | `.surface-brand-deep` (verde oscuro) |
| 3 | Destacadas | **`bg-white`** *(era `gray-150` roto)* |
| 4 | Publicá tu propiedad | `bg-brand-50` *(bloqueado, sin cambios)* |
| 5 | Servicios | `bg-white` |
| 6 | Trayectoria | `.surface-brand-deep` (verde oscuro) |
| 7 | Reseñas | `bg-brand-50` |
| 8 | Agente | `bg-white` |
| 9 | FAQ | **`bg-brand-50`** *(era `gray-150` roto)* |

Las secciones de contenido (3,4,5,7,8,9) quedan en alternancia perfecta
**Blanco–Verde–Blanco–Verde–Blanco–Verde**, separadas por el verde oscuro de estudiantes
(2) y trayectoria (6). Ya no queda ningún `gray-150` en el proyecto (verificado por grep).

**Nota:** blanco ↔ `brand-50` es una alternancia sutil a propósito (el brand-50 es un verde
muy pálido). Se eligió sobre la variante de más contraste (`bg-surface` gris) para no tocar
Servicios/Agente, que están diseñados sobre blanco puro.

### 2 — Fotos de personas en FAQ y Trayectoria
Se identificaron las secciones sin foto de personas (Destacadas, Servicios, Trayectoria,
FAQ). Se sumó foto a **FAQ** y **Trayectoria** (elección del usuario). Las 2 imágenes se
verificaron descargándolas y mirándolas antes de usarlas.

- **FAQ (`RealEstateFAQ.tsx`)** — de 1 columna centrada pasó a **2 columnas**: foto a la
  izquierda (sticky en desktop), acordeón a la derecha; apiladas en mobile. Imagen: un
  **apretón de manos cerrando una operación** (`photo-1521791136064-...`), con overlay
  verde y el texto "Más de 7 años cerrando operaciones con confianza". El acordeón conserva
  toda su lógica (`showAll`, `AnimatePresence`); el botón "ver más" pasó a alinearse a la
  izquierda dentro de su columna.
- **Trayectoria (`Confianza.tsx`)** — de 4 stats en fila pasó a **2 columnas**: foto de una
  **familia feliz frente a su hogar** (`photo-1609220136736-...`, con cerca blanca) a la
  izquierda, las 4 métricas en grilla 2×2 a la derecha. **Los contadores NO se tocaron**
  (`useInView` + `requestAnimationFrame` intactos); solo se reacomodó el contenedor. La
  marca de agua "CT" y el fondo verde profundo se mantienen.

- **Estado:** ✅ build OK, 23/23 páginas, `/` sigue estático.

---

## Nota de tooling — `NEXT_DIST_DIR` en `next.config.ts`

En Windows, `npm run build` se cuelga indefinidamente si hay un `npm run dev` corriendo:
ambos pelean por el directorio `.next` (se reprodujo varias veces; el build quedaba
trabado sin avanzar de la primera línea, y aparecía `EPERM: operation not permitted,
open '.next\trace'`).

Se agregó a `next.config.ts`:
```ts
distDir: process.env.NEXT_DIST_DIR || '.next',
```
**Sin la variable el comportamiento es exactamente el de siempre.** Para verificar un
build con el dev server levantado:
```bash
NEXT_DIST_DIR=.next-verify npm run build
```
Conviene agregar `.next-*` al `.gitignore` si se usa seguido. Si se prefiere no tener
este escape hatch, se puede revertir esa línea sin ningún otro cambio.

---

## Bloque A — Cliente de API centralizado

### `src/modules/shared/types/api.ts` (NUEVO)
- **Problema:** no existía ningún tipado del contrato real de la API; cada módulo definía shapes parciales y desactualizados, y la mayoría de las llamadas quedaban en `any` implícito.
- **Solución:** archivo canónico con los tipos de la sección 17 del contrato (enums con valores exactos, entidades, DTOs, shapes de error) + la tabla `VALID_REQUEST_TRANSITIONS` para las transiciones de estado de solicitudes. Decisión: archivo central (no distribuido por módulo) porque `User`, `Property` y los enums cruzan todos los módulos; los `interfaces/` existentes re-exportan desde acá lo que se superpone, así no se rompen los imports actuales.
- **Estado:** ✅

### `src/modules/shared/lib/authEvents.ts` (NUEVO)
- **Problema:** el interceptor de axios necesita limpiar la sesión del `AuthContext` ante un 401, pero `axios.ts` no puede importar el contexto (dependencia circular: AuthContext → auth.service → axios).
- **Solución:** registro de callback mínimo (`setOnUnauthorized`/`emitUnauthorized`). El `AuthProvider` registra el handler al montar (limpia `user`, toast "Tu sesión expiró", redirect a `/login`) y lo desregistra al desmontar.
- **Estado:** ✅

### `src/modules/shared/lib/apiError.ts` (NUEVO)
- **Problema:** ningún `catch` del proyecto leía el error real del backend — todos mostraban strings hardcodeados.
- **Solución:** `getErrorMessage(error)`: message string del backend → tal cual; array de class-validator → une los primeros 3 con " · "; 429 → "Demasiados intentos, esperá un momento e intentá de nuevo."; sin response → "No pudimos conectar con el servidor, intentá de nuevo.". También `getErrorStatus(error)` para lógica condicional por status (ej. 401 en logout, 409 en perfil).
- **Estado:** ✅

### `src/modules/shared/lib/validateImage.ts` (NUEVO)
- **Problema:** ninguna subida de imagen validaba tipo/tamaño client-side; el usuario esperaba el 400/502 del backend.
- **Solución:** `validateImageFile(file)` → error legible si no es `image/*` o pesa > 5MB (límites del backend), `null` si es válido. Se usa en perfil (ambos) y PropertyForm (Bloque E).
- **Estado:** ✅

### `src/modules/shared/lib/axios.ts`
- **Problema:** sin interceptores; un 401 por sesión expirada en medio de la navegación dejaba al usuario en estado inconsistente (UI logueada, backend rechazando).
- **Solución:** interceptor de respuesta: 401 → `emitUnauthorized()` (limpieza + redirect a `/login`), **excepto** para todos los endpoints `/auth/*` (el 401 de `/auth/me` en hidratación es esperado; el de `/auth/login` es "credenciales inválidas"; el de `/auth/logout` es "sesión ya cerrada" = éxito; los futuros 401 de `/auth/google` son errores propios del flujo). 429 y el resto de los status pasan intactos al `catch` del componente.
- **Estado:** ✅

### `src/modules/shared/context/AuthContext.tsx`
- **Problema:** no registraba el handler de 401; `logout()` fallaba visiblemente si el backend devolvía 401 (sesión ya revocada); `console.log` de debug con el rol; sin forma de redirigir a otro destino tras logout (necesario para el flujo de cambio de password del Bloque D).
- **Solución:** registra/desregistra el callback de `authEvents`; `logout(redirectTo = '/')` con parámetro; 401 en logout = éxito silencioso, otros errores se loguean pero igual se limpia el estado local (el usuario nunca queda "atrapado" logueado); eliminado el `console.log` de debug.
- **Estado:** ✅

### `src/modules/auth/interface/auth.interfaces.ts`
- **Problema:** `AuthUser` desactualizado (sin `profileIncomplete`, `notifyBroadcast`, etc.); `LoginFormData` tenía un campo extra `user?` que, de haberse enviado, el backend ahora rechazaría con 400 (`forbidNonWhitelisted`).
- **Solución:** `AuthUser = User` (alias del tipo canónico), `LoginResponse`/`RegisterResponse` re-exportados del contrato, `LoginFormData` reducido a `{ email, password }` exactos del `LoginDto`.
- **Estado:** ✅

### `src/modules/properties/interfaces/operation-type.ts` y `status-property.ts`
- **Problema:** enums duplicados respecto del contrato; `status-property.ts` además contenía `IPropertyFilter`, un duplicado viejo de `PropertyFilters` sin ningún uso en el repo.
- **Solución:** ambos archivos pasan a re-exportar los enums canónicos de `api.ts` (mismos valores exactos — sin cambio de comportamiento); `IPropertyFilter` eliminado (0 usos verificados por grep).
- **Estado:** ✅

---

## Bloque B — Auth: bugs de contrato

### `POST /users` con `role`
- **Verificado:** ningún flujo del frontend llama a `POST /users` (solo existe `/auth/register`). Nada que cambiar.
- **Estado:** ✅ (no aplica)

### Login devuelve 401 (antes 400) para credenciales inválidas
- **Verificado:** el catch de `LoginForm` no dependía del status específico; ahora además muestra el mensaje real ("Credenciales inválidas") vía `getErrorMessage` (Bloque E). El interceptor excluye `/auth/*` del redirect por 401, así que este 401 llega al formulario y no dispara redirección.
- **Estado:** ✅

### `POST /auth/logout` requiere sesión válida
- **Solución:** en `AuthContext.logout()`, un 401 se trata como éxito silencioso (la sesión ya estaba cerrada). Cualquier otro error también limpia el estado local igualmente — el usuario nunca queda atrapado logueado.
- **Estado:** ✅

### Invalidación de tokens pre-hardening
- Los tokens viejos dan 401 en la próxima request → lo cubre el interceptor del Bloque A (limpieza + toast "Tu sesión expiró" + redirect a `/login`). Sin código adicional.
- **Estado:** ✅ (cubierto por Bloque A)

---

## Bloque C — Favoritos: rutas rotas reparadas

### `src/modules/shared/ui/Favoritebutton.tsx` y `src/app/(private)/dashboard/favoritos/page.tsx`
- **Problema:** usaban `GET /favorites/:userId` y `DELETE /favorites/:userId/:propertyId`, rutas que ya no existen — favoritos estaba roto en producción.
- **Solución:** `GET /favorites` y `DELETE /favorites/:propertyId` (el userId sale del token en el backend). Catches migrados a `getErrorMessage` (ej. el 409 "La propiedad ya está en favoritos" ahora se ve tal cual).
- **Estado:** ✅

---

## Bloque D — Perfil: migración a PATCH /users/me

### `src/app/(private)/dashboard/perfil/page.tsx` y `src/app/(admin)/dashboardAdmin/perfil/page.tsx`
- **Problema:** usaban `PATCH /users/:id`; además, tras cambiar la contraseña el backend revoca la sesión y la UI seguía como si nada (la siguiente acción daba 401 sorpresivo).
- **Solución:** datos personales y password van a `PATCH /users/me`. Tras cambio de password exitoso: toast "Contraseña actualizada. Iniciá sesión de nuevo..." + `logout('/login')` (el POST /auth/logout dará 401 porque la sesión ya fue revocada — se trata como éxito, ver Bloque B). El quirk del contrato (la respuesta del PATCH con password incluye el hash bcrypt) no afecta: nunca se pasa ese campo a `updateUser()`. La subida de foto sigue en `PATCH /users/:id/photo` (el contrato no tiene variante `/me` para foto). Errores con `getErrorMessage` (ej. 409 "Ese email no está disponible", 502 de Cloudinary).
- **Estado:** ✅
- **Pendiente anotado:** el perfil sigue duplicado entre dashboard y dashboardAdmin — candidato a unificarse en un componente compartido en una sesión futura.

---

## Bloque E — Errores reales del backend en formularios

### `LoginForm.tsx` / `RegisterForm.tsx`
- Catch del submit migrado a `getErrorMessage`: muestra "Credenciales inválidas" (401), "No se pudo completar el registro..." (400), o "Demasiados intentos..." (429, límite 5/min de `/auth/*`). La validación de forma (zod) sigue mostrando errores inline por campo como antes. Eliminados los `console.assert` de debug.
- **Estado:** ✅

### `PropertyForm.tsx` (alta/edición admin)
- Catch del submit y de set-cover migrados a `getErrorMessage` — el 400 del `JsonToDtoPipe` con detalle de campos (array de class-validator) se muestra unido (primeros 3), igual que el 404 de tipo inexistente y el 502 de Cloudinary. `addFiles` ahora valida cada archivo con `validateImageFile` (image/* y ≤ 5MB) antes de aceptarlo, con toast inmediato por archivo rechazado.
- **Estado:** ✅

### Perfil (ambos)
- Cubierto en Bloque D (409 de email, 502 de foto) + validación client-side de la foto antes de subir.
- **Estado:** ✅

### `src/app/(private)/publicar/page.tsx` (solicitud de publicación)
- Catch migrado a `getErrorMessage` (los enums del DTO tienen mensajes custom en español que listan los valores permitidos).
- **Fix de contrato extra:** el select de tipo de propiedad ofrecía `Cochera` y `Otro`, que NO existen en `TipoPropiedadRequest` → elegirlos daba 400 seguro. Alineado a los 6 valores del enum; agregado `Regular` que faltaba en estados de conservación.
- **Estado:** ✅

---

## Bloque F — Panel admin: seguridad y transiciones

### `src/middleware.ts`
- **Problema (bug pre-existente):** protegía `/admin/:path*`, pero la zona admin real es `/dashboardAdmin` → el middleware no protegía NADA de esa zona (ni autenticación ni rol a nivel servidor). Además `isAdminZone` y el redirect post-login de `/login` apuntaban a `/admin`.
- **Solución:** matcher con `/dashboardAdmin/:path*` (se eliminó `/admin`, no se usa); `isAdminZone = startsWith('/dashboardAdmin')` (y `isPrivateZone` lo excluye para no solaparse); redirect de usuarios logueados en `/login` → `/dashboardAdmin` o `/dashboard` según rol. Nota dejada en comentario: `decodeJwt` NO verifica firma — es solo UX, la autorización real es del backend.
- **Estado:** ✅

### `GET /stats/*` requiere ADMIN
- **Verificado:** el frontend no llama a ningún endpoint `/stats/*` — el dashboard admin calcula métricas client-side desde `GET /users` + `GET /properties` + `GET /property-requests`, que ya se llaman dentro del layout admin (gate por rol). Nada que cambiar.
- **Estado:** ✅ (no aplica)

### Transiciones de estado de solicitudes — `solicitudes/page.tsx` y `usuarios/[id]/page.tsx`
- **Problema:** la UI ofrecía transiciones ilegales (ej. "Aceptar" desde `rechazado`, "Rechazar" desde `aceptado`) que ahora dan 409.
- **Solución:** tabla `VALID_REQUEST_TRANSITIONS` en `types/api.ts` + helper `canTransition()`; los botones rápidos y el picker expandido solo muestran transiciones válidas desde el estado actual; en estados terminales el picker muestra "Estado terminal — no admite más cambios". El catch igualmente muestra el 409 real del backend por si hay carrera (otro admin cambió el estado en paralelo).
- **Estado:** ✅

### `DELETE /property-types` con 409
- **Verificado:** no existe UI de gestión de tipos de propiedad en el frontend (solo `GET /property-types`). Nada que cambiar; si se agrega esa UI a futuro, usar `getErrorMessage` mostrará el 409 correctamente.
- **Estado:** ✅ (no aplica)

---

## Bloque G — Campos nuevos

### `notifyBroadcast` — `src/app/(private)/dashboard/perfil/page.tsx`
- Toggle "Novedades de propiedades por email" en el perfil del usuario: `PATCH /users/me { notifyBroadcast }`, actualización optimista con revert si falla, sincroniza el contexto. Se agregó solo al perfil de usuario (el broadcast apunta a usuarios finales); agregar al perfil admin es trivial si se quiere.
- **Estado:** ✅

### `profileIncomplete` — `src/modules/shared/context/AuthContext.tsx`
- Tras un login exitoso, si `user.profileIncomplete === true` se muestra un toast informativo (8s) invitando a completar teléfono y contraseña desde "Editar Perfil". El mismo aviso servirá para el flujo de Google del Bloque H.
- **Estado:** ✅

---

## Extra — Reparaciones del build (errores pre-existentes, no causados por el refactor)

`npm run build` estaba roto de antes en varios puntos; se reparó todo para poder verificar cada bloque:

| Archivo | Problema | Fix |
|---|---|---|
| `src/app/(user)/layout.tsx` | archivo vacío → "is not a module" | layout passthrough mínimo (carpeta candidata a eliminarse) |
| `src/app/(private)/dashboard/layout.tsx` | `icon: any` (error de lint) | `React.ElementType` |
| `src/app/(public)/servicios/[id]/page.tsx` | `s.ctaEspecial` no existe en todos los miembros de la unión | narrowing con `'ctaEspecial' in s` |
| `src/modules/landing/components/Featuredproperties.tsx` | `page: '1'` string vs number; además el prerender explotaba si el backend estaba caído durante el build | números + try/catch con estado vacío |
| `src/modules/landing/components/RealEstateFAQ.tsx` | `useState(null)` sin genérico | `useState<number \| null>(null)` |
| `src/modules/landing/components/Reseñas.tsx` | CSS custom properties (`--quantity`) sin cast | `as React.CSSProperties` |
| `src/modules/landing/components/Servicios.tsx` | prop `service` sin tipo | `(typeof services)[number]` |
| `src/modules/properties/components/HeaderSearch.tsx` | `SearchBar`/`FiltersPanel` usan `useSearchParams` sin Suspense → fallaba el prerender de `/` | envueltos en `<Suspense>` |
| `src/modules/properties/services/properties.service.ts` | respuesta sin tipar (`any` en cascada) | `FilteredPropertiesResponse` tipado |

---

## Pendientes para sesiones futuras

1. ~~**Bloque H — Login con Google**~~ → ✅ **completo**, ver el bloque al final del documento.
2. **Unificar el perfil** duplicado entre `dashboard/perfil` y `dashboardAdmin/perfil` en un componente compartido.
3. **`callbackUrl`:** el middleware setea `?callbackUrl=` al redirigir a `/login`, pero el login no lo lee al redirigir post-login — mejora de UX pendiente.
4. **Eliminar** la carpeta vacía `src/app/(user)/` si se confirma que no se va a usar.
5. **Toggle `notifyBroadcast` en el perfil admin** si se decide que los admins también reciban el broadcast.

---

## Bloque H — Login con Google + rediseño de las pantallas de auth ✅ COMPLETO

Se implementó el login con Google y se rediseñaron `LoginForm` y `RegisterForm` para que
entonen con la landing.

### H.1 — Login con Google

**Dependencia nueva:** `@react-oauth/google@0.13.5` (aprobada previamente).

#### ⚠️ El botón custom con `useGoogleLogin` era técnicamente inviable
El pedido dejaba elegir entre el botón prearmado y uno custom con el hook, prefiriendo el
custom por control de estilo. **No se pudo: el hook no puede producir el token que este
backend necesita.** `POST /auth/google` espera un **idToken** (un JWT de OpenID que el
backend verifica con google-auth-library), y según los tipos de la propia librería:

| API | Qué devuelve | ¿Sirve? |
|---|---|---|
| `<GoogleLogin>` | `CredentialResponse.credential` — *"the returned ID token"* | ✅ |
| `useGoogleLogin({ flow: 'implicit' })` | `TokenResponse.access_token` | ❌ no es un ID token |
| `useGoogleLogin({ flow: 'auth-code' })` | `code` (requiere intercambio server-side) | ❌ el front no lo hace |

Así que se usa `<GoogleLogin>` configurado con las opciones que sí expone (`theme`,
`size`, `shape`, `width`, `text`). Google lo renderiza **dentro de un iframe**, o sea que
su tipografía y alto no se pueden pisar con CSS; el contenedor iguala el ancho al del
resto del formulario para que no quede desalineado. Un botón 100% custom requeriría
cambiar el contrato del backend (aceptar `access_token` y llamar a `userinfo`).

Detalle menor: `locale` **no existe** como prop en esta versión de la librería (da error de
tipos). El botón toma el idioma del navegador.

#### Archivos

| Archivo | Rol |
|---|---|
| `auth/components/GoogleProvider.tsx` (NUEVO) | `GoogleOAuthProvider` + export de `GOOGLE_CLIENT_ID` |
| `app/(auth)/layout.tsx` (NUEVO) | Monta el provider solo en `/login` y `/register` |
| `auth/components/GoogleAuthButton.tsx` (NUEVO) | Botón + canje del idToken + errores |
| `auth/services/auth.service.ts` | `loginWithGoogle(idToken)` → `POST /auth/google` |
| `shared/context/AuthContext.tsx` | `loginWithGoogle` + `handleAuthSuccess` compartido |

**Dónde va el provider:** en el layout del grupo `(auth)`, **no** en el layout raíz. Google
login solo se usa en dos páginas; envolver toda la app cargaría el script de Google
Identity Services en cada vista, incluida la landing. El layout sigue siendo Server
Component porque el provider está aislado en su propio componente cliente.

**Si falta `NEXT_PUBLIC_GOOGLE_CLIENT_ID`:** el provider renderiza los hijos igual y el
botón **no se monta**. Los formularios siguen funcionando con email + contraseña en vez de
romper la pantalla entera. En desarrollo se avisa por consola.

#### `handleAuthSuccess` — por qué se extrajo
El pedido incluía *confirmar que el toast de `profileIncomplete` se dispara también en el
flujo de Google*. En vez de duplicar la lógica, se extrajo todo el post-login (setear
`user` + redirect por rol + toast de perfil incompleto) a `handleAuthSuccess`, que usan
**tanto `login` como `loginWithGoogle`**. Así los dos flujos no pueden divergir: el toast
está garantizado por construcción, no por copiar el mismo bloque dos veces.

#### El botón también va en el registro
Se incluyó en `RegisterForm` además de en `LoginForm`. El backend resuelve login y alta en
un solo paso (crea el usuario si el email no existe), así que desde la pantalla de registro
es un camino legítimo y más corto que llenar 5 campos. Solo cambia el texto
(`signup_with` vs `signin_with`).

**⚠️ Diferencia de flujo que conviene tener presente:** el registro tradicional **no
autologuea** (`AuthContext.register` redirige a `/login`), mientras que el alta con Google
**sí** deja la sesión iniciada y va directo al dashboard. Es el comportamiento del backend,
no una inconsistencia del frontend.

#### ✅ Verificación contra el backend real (no solo "mentalmente")
El backend estaba corriendo en `localhost:3000`, así que se probaron los caminos de error
de verdad con `curl`:

| Caso | Respuesta real | Qué muestra `getErrorMessage` |
|---|---|---|
| `GET /auth/me` sin sesión | `401` | (hidratación, esperado) |
| `POST /auth/google` sin `idToken` | `400` `["El idToken de Google es obligatorio","idToken must be a string"]` | ver nota ↓ |
| `POST /auth/google` con token basura | `400 "No se pudo verificar el token de Google"` | el mensaje tal cual ✅ |
| `POST /auth/login` mal | `401 "Credenciales inválidas"` | el mensaje tal cual ✅ |

**Nota sobre el primer caso:** el backend devuelve un **array** de class-validator que
incluye `"idToken must be a string"` en inglés. `getErrorMessage` uniría ambos con `·`,
quedando medio feo — pero **ese caso es inalcanzable desde la UI**, porque
`GoogleAuthButton` corta antes con su propio mensaje si Google no devolvió `credential`.

**Lo que NO se pudo probar de punta a punta:** el login con Google exitoso y los dos
errores 401 (`token no emitido para esta aplicación`, `email no verificado`) requieren un
idToken real firmado por Google, que solo se obtiene desde un navegador con la cuenta del
usuario. Queda pendiente de prueba manual. Lo que sí está verificado es que el endpoint
existe, valida como dice el contrato, y que los mensajes string se muestran tal cual.

### H.2 — Rediseño visual de las pantallas de auth

| Archivo | Rol |
|---|---|
| `auth/components/AuthShell.tsx` (NUEVO) | Estructura de 2 columnas compartida |
| `auth/components/AuthField.tsx` (NUEVO) | Campo + ícono + error animado |
| `auth/schemas/auth.schemas.ts` (NUEVO) | Schemas de zod compartidos |
| `shared/ui/FooterSelector.tsx` (NUEVO) | Oculta el footer en rutas de auth |

- **Layout:** se mantiene el esquema de 2 columnas, rehecho. El panel de imagen lleva
  overlay `brand-950` de la misma familia que la landing, con logo y mensaje encima.
  Antes era una foto suelta con **7 círculos decorativos y un `<div></div>` vacío** al
  centro.
- **Imágenes nuevas de Unsplash, verificadas visualmente:** llaves sobre una mesa (login)
  y casa iluminada al atardecer (registro).
- **Animaciones:** entrada del formulario con framer-motion; el mensaje de error aparece
  y desaparece animando alto + opacidad, así el form no "salta" al validar.
- **Botón de submit** alineado con el `CtaButton` de la landing (verde sólido `brand-700`,
  hover que eleva, `active:scale`), con spinner propio.

#### 🐛 Dos arreglos de layout que salieron de esto
1. **El footer completo aparecía debajo del login.** `FooterPublic` se montaba sin
   condición en el layout raíz, así que la pantalla de login tenía debajo el CTA de
   WhatsApp, las 3 columnas de links y el mapa de Google. Ahora hay un `FooterSelector`
   (mismo patrón que el `NavbarSelector` que ya existía) que lo oculta en `/login` y
   `/register`. **Los dashboards se dejaron como estaban** — sacarlo de ahí también sería
   razonable, pero no se pidió.
2. **Los links del navbar público no funcionaban en `/login`.** `NavbarPublic` hace scroll
   a `#inicio`, `#nosotros` y `#faq`, secciones que solo existen en la landing. Se ocultó
   el navbar en las rutas de auth y las pantallas ganaron su propio "Volver al inicio".
   De paso desaparece el `mt-15` que `RegisterForm` tenía para esquivar el navbar fijo.

#### Por qué NO se usaron `Field`/`Input` de `shared/ui`
El pedido planteaba evaluar migrarlos. **No conviene:** esos componentes tienen `px-4` en
su clase base y estos campos necesitan `pl-10` para el ícono interno (y `pr-11` en los de
contraseña, por el ojito). Como el proyecto no usa `tailwind-merge`, pasar `pl-10` por
`className` dejaría los dos paddings compitiendo — **exactamente el caso ya documentado en
el Bloque UI-7** con los inputs con ícono de `preferencias` y el precio de `PropertyForm`.
Se creó `AuthField` con su propia clase base. Cuando exista un `<Input icon={...} />`
compartido, estos campos son los primeros candidatos a migrar.

### H.3 — Validaciones reforzadas

**🔒 Lo que NO se tocó:** `password` sigue en **mínimo 5 caracteres** en ambos formularios.
Es el mínimo real del backend; subirlo dejaría afuera a los usuarios ya registrados.

| Campo | Antes | Ahora |
|---|---|---|
| `name` / `surname` | `min(2)` | `min(2)` + **`max(50)`** + **regex de solo letras** |
| `phone` | `min(8)` sobre el string + regex de forma | regex de forma + **conteo de dígitos reales entre 8 y 15** |
| `email` (ambos) | `.email()` | `.trim()` + **`min(1)` con mensaje propio** + `.email()` |
| `password` | `min(5)` | `min(5)` — **sin cambios** |

- **Regex de nombre:** `/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/`
  Acepta acentos y ñ, y permite espacios/apóstrofes/guiones **solo entre palabras** — cubre
  "José María", "D'Angelo", "García-López". Rechaza números, símbolos y espacios al
  principio o al final.
- **Teléfono:** el `min(8)` anterior contaba **caracteres**, así que `"--- ---"` (7 guiones
  y un espacio) pasaba la validación. Ahora se cuentan los **dígitos reales** ignorando
  separadores: `+54 351 387 2817` (12 dígitos) pasa, `"+"` solo no. El tope de 15 es el
  máximo de E.164, el estándar internacional de numeración.
- Los schemas se movieron a `auth/schemas/auth.schemas.ts` para compartirlos entre ambos
  formularios en vez de tenerlos duplicados en cada archivo.

### H.4 — Fix: la foto de perfil de Google rompía `next/image`

**Problema (encontrado al probar el login con Google de verdad):** apenas un usuario de
Google entraba al dashboard, `next/image` tiraba
`Invalid src prop (https://lh3.googleusercontent.com/...) — hostname is not configured
under images in your next.config.js`. Las cuentas de Google sirven su avatar desde ese
host, que no estaba en `remotePatterns`.

**Solución:** se agregó `lh3.googleusercontent.com` a `images.remotePatterns` en
`next.config.ts`, con el mismo shape que los hosts ya presentes.

**Verificado a través del pipeline real de imágenes**, no solo revisando el config: se
levantó un dev server y se consultó el optimizador directamente, con un control para que
el resultado fuera concluyente.

| Host | `GET /_next/image?url=…` | Lectura |
|---|---|---|
| `lh3.googleusercontent.com` | **200**, `content-type: image/png` | aceptado y optimizado ✅ |
| `example.com` (control, no configurado) | **400** `"url" parameter is not allowed` | así se ve un host bloqueado |

El 400 del control es exactamente el error que se estaba viendo, así que el 200 confirma
que el host quedó habilitado de punta a punta.

**Nota para producción:** Google sirve avatares casi siempre desde `lh3`, pero
históricamente también usó `lh4`/`lh5`/`lh6`. Si alguna vez reaparece el error con otro
subdominio, la alternativa es reemplazar la entrada por el wildcard
`hostname: '**.googleusercontent.com'`, que `remotePatterns` soporta. Se dejó `lh3`
explícito por ahora, que es lo que se pidió y lo que cubre el caso real.

**Limpieza asociada:** levantar dev servers con `NEXT_DIST_DIR` hace que Next agregue solo
la carpeta temporal correspondiente al `include` de `tsconfig.json`. Habían quedado
`.next-verify/types/**/*.ts` y `.next-devcheck/types/**/*.ts` apuntando a directorios que
ya no existen; se sacaron del `tsconfig.json`.

### Links rotos preexistentes (NO introducidos acá, no arreglados)
Se preservaron tal cual estaban, pero no tienen página: **`/forgot-password`** (link en
LoginForm), **`/privacidad`** y **`/terminos`** (links en el footer). Los tres dan 404.

- **Estado:** ✅ **Bloque H cerrado.** Build OK, 22/22 páginas.

---

# PARTE 3 — Refactor UI/UX del catálogo y rediseño del detalle de propiedad

> Sesión enfocada en `/properties` (modal de filtros + tarjetas + animaciones) y el
> rediseño completo de `/properties/[id]` al lenguaje visual de la Landing. Todo
> verificado contra el backend real corriendo en `localhost:3000` (11 propiedades).

## Bloque PROP-1 — Correcciones del modal de filtros

**Archivos:** `src/modules/properties/components/FiltersModal.tsx`,
`src/modules/properties/hooks/usePropertyFilters.ts` (sin cambios acá — ya tenía
`clearFilters`).

- **Bug del botón "Limpiar" (estado que no se reseteaba):** `handleClear` solo vaciaba el
  borrador local (`setDraft({})` + `setNums(EMPTY)`) **sin commitear a la URL**, así que los
  query params (ej. `operationType=venta`) seguían activos y el catálogo seguía filtrado.
  **Solución:** `handleClear` ahora además llama a `clearFilters()` del hook
  (`router.push('?page=1&limit=12')`, que borra **todos** los params incluido el texto de
  búsqueda) y cierra el modal → la consulta limpia se aplica a la API de inmediato.
- **Botón de cierre (X):** pasó de gris (`bg-ink-100`) a **rojo sólido** (`bg-red-500
  hover:bg-red-600 text-white`, círculo). Decisión de diseño explícita del usuario (rojo
  aunque no sea acción destructiva).
- **Botón "Limpiar filtros":** pasó de texto gris a la izquierda (separado por
  `justify-between`) a **rojo sólido** (`bg-red-500 hover:bg-red-600 text-white`) **en la
  misma fila que "Ver N resultados"**, a la derecha del footer (`flex-col-reverse` en mobile
  para que el principal quede arriba).
- **Marca de agua de marca:** se agregó una capa decorativa (`aria-hidden`,
  `pointer-events-none`) con dos íconos (`Home`, `Building2`) al ~5% de opacidad en esquinas
  opuestas + un halo `brand-500/6` difuminado. El contenido (header/body/footer) lleva
  `relative z-10` para superponerse siempre por encima de la marca de agua.

## Bloque PROP-2 — Animación de cambio de vista + valoración en tarjetas

**Archivos:** `src/app/(public)/properties/Propertiescatalog.tsx`,
`src/modules/properties/components/PropertyCard.tsx`,
`src/modules/properties/components/PropertyRow.tsx`,
`src/modules/properties/interfaces/propertyInterface.ts`.

- **Fix del "cabeceo" al alternar mosaico ↔ lista:** la causa era doble — al togglear la
  vista, `changeView` cambiaba el `limit` (12↔10) y forzaba un **refetch** (parpadeo de
  skeleton) + el contenedor remontaba con un stagger desde `y:22` (rebote). **Solución:**
  (1) un único `PAGE_LIMIT = 12` para ambas vistas → el toggle ya no toca la URL ni pega a
  la API, es puro re-layout en el cliente; (2) los resultados se envuelven en
  `<AnimatePresence mode="wait">` con `exit` (fundido de salida) antes de montar la vista
  entrante; (3) el `y` de entrada bajó de 22 a 10px y el stagger de 0.06 a 0.045 → slide
  suave, sin rebote.
- **Valoración por estrellas en las tarjetas:** `GET /properties/filter` **no** devuelve
  `ratingAverage` (confirmado contra el backend: solo lo traen `GET /properties` y
  `GET /properties/:id`). **Solución:** el catálogo hace **una** llamada extra a
  `propertiesService.getAll()` (barata: 11 propiedades) y arma un mapa `id→ratingAverage`
  que cruza con la página filtrada mostrada (`itemsWithRatings`). `PropertyCard` (badge
  blanco con estrella ámbar, esquina inferior derecha de la imagen) y `PropertyRow` (chip
  ámbar junto al tipo) muestran el promedio **solo si `> 0`**. Se agregó `ratingAverage?`
  al tipo local `Property`.
  - ⚠️ Si el inventario creciera mucho, `getAll()` (sin paginar) dejaría de ser barato; hoy
    con 11 propiedades es despreciable. Lo ideal a futuro sería que `/properties/filter`
    incluya `ratingAverage` y eliminar la llamada extra.

## Bloque PROP-3 — Rediseño del detalle de propiedad (`/properties/[id]`)

**Archivos:** `src/app/(public)/properties/[id]/PropertyDetail.tsx` (reescritura),
`src/app/(public)/properties/[id]/page.tsx` (fix de `params`).

- **`params` como Promise (Next.js 15):** `page.tsx` tipaba `params: { id: string }` y lo
  usaba sin `await`. Se corrigió a `params: Promise<{ id: string }>` + `const { id } = await
  params` (mismo patrón ya aplicado a `searchParams` en el catálogo).
- **Botón de Favoritos en la barra de accesos rápidos:** se agregó `FavoriteButton`
  (variante `default`, con texto "Guardar"/"En favoritos") a la derecha de la barra superior
  (Volver / Ver dirección / Ver Comentarios / Ver Valoraciones). **Se reusó el componente
  compartido**, no se creó uno nuevo: hereda el chequeo de `GET /favorites` al montar (marca
  el estado si ya está en favoritos = persistencia) y el redirect a `/login` si no hay
  sesión. Antes el detalle **no tenía** botón de favorito (gap documentado en CLAUDE.md).
- **Tokenización completa:** se reemplazaron las ~41 ocurrencias de hex hardcodeado
  (`#0b7a4b`, `#179e66`, `#249868`, `#f0f2f0`, gradientes `#0f8b57`/`#14a366`) por tokens
  (`brand-*`, `ink-*`, `surface`, `var(--gradient-brand)`). Fondo de página `bg-surface`.
- **Mapa de Google:** el campo `provincia` en realidad guarda **la dirección completa**
  (calle + barrio + localidad + provincia, ej. *"Jorge Luis Borges 489, Barrio La
  Estanzuela, La Calera, Córdoba."*), así que la query del iframe (`?q=...&output=embed`) ya
  era precisa; se mantuvo esa fuente, se envolvió en una tarjeta `rounded-2xl` con borde de
  marca + sombra suave (hover glow), `loading="lazy"` y `referrerPolicy`.
- **Estructura estilo Landing:** card de precio + CTA de WhatsApp con `var(--gradient-brand)`
  y barrido de luz en hover (mismo patrón que `CtaButton`); badges de características en
  `brand-700/8`; badge de estado **"disponible"** con ícono `ShieldCheck` en verde de marca.
- **Sección nueva "Propiedades similares":** `SimilarProperties` hace
  `getFilteredProperties({ operationType, typeOfPropertyId, limit: 4 })`, excluye la
  propiedad actual y muestra hasta 3 con `PropertyCard`. Se oculta si no hay resultados.
- **Verificación funcional (contra backend real):**
  - Comentarios: `GET/POST/PATCH/DELETE /properties/:id/comments` — shape confirmado
    (`user.name/surname/photo`, `created_at`). Los `catch` de editar/comentar/valorar
    migraron a `getErrorMessage()` (antes tenían strings fijos).
  - Valoraciones: `GET/POST /ratings/:id` — shape confirmado (`score`, `user.id/name/photo`).
    Promedio se recalcula local y actualiza el header sin recargar.
  - Favoritos: reusa `FavoriteButton` → persistencia heredada del flujo ya existente.

## Bugs adicionales encontrados y arreglados
- **Favorito decorativo en la vista lista** (ya arreglado en la sesión previa del catálogo:
  `PropertyRow` usa el `FavoriteButton` real, no un ícono muerto). Se mantiene.

- **Estado:** ✅ **Parte 3 cerrada.** `tsc --noEmit` limpio y `npm run build` OK (23/23
  páginas) después de cada bloque. Los warnings de lint restantes son preexistentes
  (imports sin usar en archivos admin, `exhaustive-deps` intencional en
  `CommentsAndRatings`).

---

# PARTE 4 — 🐛 Bug real de subida multipart (400) + orden del catálogo + rediseño de filtros

> Sesión de fullstack. El disparador fue un `400 Bad Request` al crear propiedades. La
> investigación reveló que había DOS bugs encadenados (uno de frontend y otro de backend),
> ambos verificados end-to-end contra el backend real (`localhost:3000`, login admin +
> `curl`). Se documenta como hallazgo de bug, no como ajuste de estilo.

## Bloque BUG-1 — Header `Content-Type: multipart/form-data` forzado sin boundary (FRONTEND)

**Archivos:**
`src/app/(admin)/dashboardAdmin/propiedades/PropertyForm.tsx` (create + edit de propiedad),
`src/app/(private)/dashboard/perfil/page.tsx` (foto de perfil usuario),
`src/app/(admin)/dashboardAdmin/perfil/page.tsx` (foto de perfil admin).

- **Síntoma:** `POST /properties` (y `PATCH /users/:id/photo`) devolvían 400 con
  `"title should not be empty · title must be a string · description should not be empty"`
  aunque el formulario estuviera completo — el backend recibía los campos vacíos.
- **Causa:** las tres llamadas seteaban a mano `headers: { 'Content-Type':
  'multipart/form-data' }`. Un cuerpo multipart necesita un `boundary` dinámico en el header
  (`multipart/form-data; boundary=----WebKit...`) que **solo el navegador puede generar** al
  serializar el `FormData`. Al fijar el header a mano (sin boundary), el navegador no lo
  completa y el body queda malformado → Multer/busboy no puede parsearlo → los campos llegan
  vacíos. Peor: la instancia de axios (`shared/lib/axios.ts`) trae `Content-Type:
  application/json` como default; si ese fuera el efectivo, axios haría `JSON.stringify` del
  FormData y perdería los archivos.
- **Fix:** `headers: { 'Content-Type': undefined }` en cada request multipart. `undefined`
  **borra** el default de la instancia solo para esa llamada, y axios detecta el `FormData`
  real y delega en el navegador el armado del header con boundary correcto.
- **Verificado E2E:** `PATCH /users/1/photo` con multipart bien formado → **200**
  (se resubió la MISMA foto del admin, sin cambiar su avatar). El fix de PropertyForm por sí
  solo NO alcanzaba — ver BUG-2.

## Bloque BUG-2 — El `ValidationPipe` global pisaba `@Body('data')` (BACKEND) 🔴

> Repo backend: `../CercaTrova-Back`. Este era el bloqueador real del 400 de propiedades.

**Archivo:** `src/modules/properties/properties.controller.ts` (endpoints `create` y `update`).

- **Diagnóstico definitivo:** con un multipart PERFECTO (probado con `curl`), el `POST
  /properties` seguía devolviendo 400 con todos los campos "empty". Test decisivo: mandar
  `data=notjson` (JSON inválido) daba el MISMO error de campos vacíos en vez del
  `"El campo 'data' debe ser JSON válido"` del `JsonToDtoPipe` → prueba de que el pipe custom
  **nunca corría**.
- **Causa:** el `ValidationPipe` global (`main.ts`, `transform: true`) corre ANTES que los
  pipes de parámetro. Con el parámetro tipado `@Body('data', new JsonToDtoPipe(...)) dto:
  CreatePropertyDto`, el pipe global tomaba el **string crudo** del campo multipart `data` y
  lo validaba como si ya fuera `CreatePropertyDto` (`plainToInstance` sobre un string →
  instancia vacía) → 400 "todos los campos faltan", sin llegar nunca al `JsonToDtoPipe` que
  debía parsear el JSON.
- **Fix:** tipar el parámetro como **`string`** (metatype primitivo). El `ValidationPipe`
  global saltea los primitivos (`toValidate()` ignora String/Number/Boolean/Array/Object),
  así que ya no lo toca y el `JsonToDtoPipe` queda como ÚNICO validador (parsea el JSON y
  valida con las mismas reglas whitelist + forbidNonWhitelisted). Cast a `CreatePropertyDto`
  para el service (la instancia real la produce el pipe en runtime). Aplicado a `create` y
  `update`.
- **Verificado E2E:** login admin → `POST /properties` multipart con imagen → **201** (crea
  la propiedad) → `DELETE /properties/:id` → **200** (se limpió el dato de prueba). La
  propiedad quedó realmente creada en la DB y luego borrada; no quedó basura.

## Bloque ORD — Ordenamiento del catálogo (FULLSTACK)

**Backend** (`property-filter.dto.ts`, `properties.service.ts`):
- Se agregó `sortBy` (`price` | `antiquity` | `date` | `rating`) y `order` (`ASC` | `DESC`) al
  `PropertyFilterDto`. Sin esto el `forbidNonWhitelisted` global rechazaba cualquier param de
  orden con 400.
- En `service.filter()` se reemplazó el `orderBy('p.created_at','DESC')` hardcodeado por un
  `switch` con whitelist. El default (sin `sortBy`) sigue siendo `created_at DESC`.
- **Rating:** la query del catálogo no joinea `ratings` (rompería la paginación con el join
  de imágenes). Se ordena por una **subconsulta correlacionada** `AVG(r.score)` expuesta como
  columna con alias (`addSelect(..., 'avgscore')` + `orderBy('avgscore', dir)`). Detalle no
  obvio: ordenar por la subconsulta cruda directamente tiraba `TypeORMError: "(SELECT AVG..."
  alias was not found` por la paginación DISTINCT de TypeORM — el alias seleccionado lo
  resuelve.
- **Verificado E2E** (endpoint público `/properties/filter`): precio ASC/DESC ✓, antigüedad ✓,
  `rating DESC → [5,5,5,4.5,4.5,…]` y `rating ASC → [0,0,4.5,4.5,5,5]` ✓, y `sortBy=basura` →
  **400** (whitelist funciona).

**Frontend** (`property-filters.interface.ts`, `usePropertyFilters.ts`):
- Se agregaron `sortBy`/`order` a `PropertyFilters` y al reader del hook (leen de la URL). Se
  sumaron a `FILTERS_THAT_RESET_PAGE` (cambiar el orden vuelve a página 1). El service ya
  spreadea todos los filtros, así que viajan como query params automáticamente.

## Bloque UI-FILTROS — Rediseño de la barra de filtros de `/properties`

**Archivos:** nuevo `CatalogFilterBar.tsx`; `PropertySearchBar.tsx` (ahora solo input);
`FiltersModal.tsx` (sin operación); `Propertiescatalog.tsx` (usa el nuevo contenedor).

- **Contenedor de 2 filas** (pedido de UX):
  - **Fila 1:** toggle **Venta / Alquiler** (segmentado) + 3 selects de orden con nombres
    claros — *"Ordenar por precio"* (menor↔mayor), *"Ordenar por antigüedad"* (más
    recientes / más antiguas), *"Ordenar por valoración"* (mejor / peores valoradas) — y
    **"Más filtros"** pegado a la derecha (abre el modal, con badge de filtros activos).
  - **Fila 2:** la barra de búsqueda de texto libre, tal cual estaba.
- **Operación fuera del modal:** el toggle Venta/Alquiler se sacó del `FiltersModal` (vive en
  la fila 1). El modal preserva el `operationType` de la URL sin tocarlo, y su conteo en vivo
  ahora incluye `filters.operationType` para reflejar el toggle activo.
- **Orden único y excluyente:** los 3 selects comparten un solo estado `sortBy`/`order` —
  elegir en uno resetea los otros a su placeholder. El badge de "Más filtros" **excluye**
  `operationType`/`sortBy`/`order`/`search` (esos tienen su propio control a la vista).
- `PropertySearchBar` pasó a ser solo el input (perdió el botón, que ahora es "Más filtros").

- **Estado:** ✅ **Parte 4 cerrada.** Frontend: `tsc --noEmit` limpio y `npm run build` OK
  (23/23). Backend: `tsc --noEmit` limpio; los 3 bugs/features verificados end-to-end contra
  el backend real (201 create, 200 photo, 200 delete, sorts correctos). El dato de prueba
  creado se borró.

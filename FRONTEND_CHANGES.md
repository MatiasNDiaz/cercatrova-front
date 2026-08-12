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

---

# PARTE 5 — Pulido de `/properties` + fix de animación del Agente

> Sesión de continuación: buena parte de los bloques 1-4 del pedido ya estaba implementada
> de sesiones anteriores (banner sacado, layout de 2 filas, modal con título verde centrado,
> bloqueo de scroll del body, grilla de 2 columnas). Lo que sigue es **solo lo que faltaba o
> estaba mal**, verificado archivo por archivo contra el código real.

## Bloque 1-3 — Cabecera de búsqueda: lo que ya estaba OK

Verificado, **sin cambios necesarios**:
- **§1 Banner de fondo:** ya no existe. La sección hero usa `bg-brand-50` (verde muy suave,
  el mismo de otras secciones de la Landing), elegido sobre blanco a propósito porque el
  panel de filtros y sus controles son blancos y sobre blanco no habría contraste.
- **§2 Layout:** `CatalogFilterBar` ya tiene búsqueda ancho completo en la fila 1 y
  operación + 3 órdenes + "Más filtros" en la fila 2. Ya no hay fondo verde plano: el
  contenedor es blanco con sombra marcada.
  > ⚠️ La entrada del **Bloque UI-FILTROS** de la Parte 4 describe el orden inverso
  > (fila 1 = controles, fila 2 = búsqueda). Quedó desactualizada — manda esta.
- **§3 Estilo de controles:** todos comparten `h-12 rounded-xl`, borde `ink-200`, foco
  `brand-700` + ring, y tokens `brand-*`/`ink-*` sin hex hardcodeado.

### Cambio aplicado — fondo de la sección de resultados
**Archivo:** `src/app/(public)/properties/Propertiescatalog.tsx`
- **Problema:** la sección de resultados usaba `bg-gray-200`, un gris de la escala **nativa
  de Tailwind** — frío y fuera de la paleta (los neutros de la marca son `ink`/`surface`,
  con un dejo verde). El conjunto se veía apagado.
- **Solución:** `bg-surface-alt` (`#e5e7e5`), token del sistema de diseño.

## Bloque 4 — Modal "Más filtros": apariencia y estabilidad del botón

**Archivo:** `src/modules/properties/components/FiltersModal.tsx`

Ya estaba bien: título "Filtrá tu búsqueda" centrado en verde de marca, bloqueo del scroll
del body (con compensación del ancho de scrollbar para que la página no salte), un solo
contenedor scrolleable, sombra marcada, grilla de 2 columnas. Lo que se corrigió:

- **Botón "Ver X resultados" — el ancho ya no cambia con el número.** Tenía `min-w-50`
  (200px), insuficiente: *"Ver 1000 resultados"* mide ~228px, así que el botón **sí** se
  agrandaba y movía el footer. Ahora es **ancho fijo** `sm:w-68` (17rem = 272px) +
  `tabular-nums` (dígitos monoespaciados) + `whitespace-nowrap`: cubre el texto más largo
  esperable y solo cambia el número, nunca la caja.
- **Botón "Limpiar filtros" — también estabilizado.** Se le sacó el contador entre
  paréntesis del label (`Limpiar filtros (3)`), que lo hacía cambiar de ancho y empujar al
  botón de al lado. El estado se comunica con el `disabled`, no con el texto.
- **Secciones agrupadas en tarjetas.** Cada `FilterGroup` (Ubicación / Tipo y Ambientes /
  Presupuesto y Superficie / Adicionales) va dentro de `rounded-2xl border border-ink-100
  bg-ink-50/60 p-5`. Antes eran 4 bloques de inputs sueltos sin separación visual; ahora se
  leen como secciones y los controles blancos ganan contraste contra el fondo claro.
- **Header con el lenguaje de la Landing.** Se agregó el eyebrow en pastilla sólida
  `brand-700` (mismo patrón que `SectionHeading`) + fondo `bg-linear-to-b from-brand-50/70`.
- **Botón de cerrar neutro.** Era un círculo rojo sólido permanente que competía con el
  título y era lo primero que saltaba a la vista al abrir. Ahora es neutro
  (`bg-white border-ink-200 text-ink-400`) y recién se pone rojo en hover.
- **Fila huérfana arreglada en "Presupuesto y superficie".** El orden dejaba
  `[Antigüedad | M² mín.]` en la misma fila (dos cosas sin relación) y una celda vacía al
  final. Ahora van por pares semánticos: precio mín/máx, m² mín/máx, y antigüedad sola
  ocupando la fila entera (`col-span-2`).
- **Footer** con fondo `bg-ink-50/70` para que se lea como barra separada del contenido.

## Bloque 5 — Verificación funcional de los filtros

Revisado handler por handler contra `usePropertyFilters` (la URL es la única fuente de
verdad; no hay estado de filtros duplicado en Context ni `localStorage`).

**Conectados y funcionando** (sin cambios): toggle Venta/Alquiler; los 3 selects de orden
(comparten un único `sortBy`/`order` excluyente); búsqueda de texto libre (debounce 600ms,
se resincroniza si la URL cambia desde afuera); y en el modal, ubicación ×3, tipo de
propiedad (desde `GET /property-types`, ya no IDs hardcodeados), habitaciones, baños,
precio mín/máx, m² mín/máx, antigüedad máx. y los 3 checkboxes de adicionales — todos
pasan por el borrador local y se commitean juntos en "Aplicar".

### Bug encontrado y corregido — "Limpiar filtros" quedaba deshabilitado
- **Problema:** `disabled={activeCount === 0}` miraba **solo el borrador del modal**. Si el
  usuario llegaba desde el navbar a `/properties?operationType=venta`, o había escrito en el
  buscador, o elegido un orden, el borrador estaba vacío → botón deshabilitado → **no había
  forma de volver a "todas las propiedades" desde el modal**.
- **Solución:** se agregó `hasUrlFilters` (cualquier filtro vigente en la URL excepto
  `page`/`limit`) y el botón se habilita con `activeCount > 0 || hasUrlFilters`.
  `handleClear` ya llamaba a `clearFilters()`, que resetea la URL entera a
  `?page=1&limit=12` — o sea que sí arrastra `operationType`, `search` y el orden.

### Bug encontrado y corregido — quitar un filtro no reseteaba la página
- **Problema:** `setFilters` solo resetea a página 1 cuando el filtro que cambia tiene un
  valor real. Al **desactivar** uno (valor `undefined`) no lo hacía, así que si estabas en la
  página 5 y sacabas un filtro, quedabas parado en una página que ya no existía → grilla
  vacía sin explicación.
- **Solución:** `page: 1` explícito en `toggleOperation`, en `setSort` y al quitar un chip.

## Bloque 5b — Chips de filtros activos (nuevo)

**Archivo:** `src/modules/properties/components/CatalogFilterBar.tsx`

Responde al pedido de que *"si desde la navbar ponemos ventas/alquileres se muestre en los
resultados de filtros"* y de que *"limpiar filtros cambie la URL a mostrar todas"*.

- **El problema real:** los links del navbar (`/properties?operationType=venta`,
  `?typeOfPropertyId=4`) **sí** filtraban correctamente — el server component los lee de
  `searchParams` y el toggle refleja el estado. Pero salvo el toggle de operación, el resto
  (ej. "Terrenos") no tenía **ninguna señal visible**: el catálogo mostraba menos propiedades
  sin decir por qué.
- **Solución:** una tercera fila que aparece solo si hay filtros activos, con un chip por
  filtro vigente (venga del modal, del toggle o de un link del navbar). Cada chip muestra su
  valor legible — `Venta`, la localidad, el nombre real del tipo de propiedad (se trae
  `GET /property-types` para no mostrar `Tipo #5`), `Desde $80.000`, `Hasta 120 m²`,
  `Cochera`… — y se puede quitar de a uno con su ✕.
- **"Limpiar todo"** al final de la fila llama a `clearFilters()` → `?page=1&limit=12`, o
  sea todas las propiedades, sin necesidad de abrir el modal.
- Los labels de `rooms`/`bathrooms` van **sin "+"** (`3 ambientes`, no `3+ ambientes`):
  en el backend son coincidencia **exacta**, no un mínimo.

## Bloque 6 — Fix del "cabeceo escalonado" del texto del Agente

**Archivo:** `src/modules/landing/components/Nosotros.tsx`

- **Causa real (no era la transición):** el panel de biografía era `min-w-[620px]` **sin
  ancho propio**. Como flex item arrancaba comprimido (la tarjeta mide 450px) y se iba
  ensanchando hasta su ancho natural mientras el contenedor animaba a 1100px. Al cambiar de
  ancho frame a frame, los párrafos **se re-wrapeaban**, la altura del bloque cambiaba, y el
  `justify-center` lo **re-centraba en cada recálculo** → de ahí la sensación de que el texto
  "caía de a pasos". Suavizar el easing no lo habría arreglado: era reflow de layout, no la
  curva de animación.
- **Solución:** `w-[620px] shrink-0` — ancho fijo desde el primer frame (queda recortado por
  el `overflow-hidden` del padre hasta que la tarjeta se abre). Sin reflow, sin re-centrado.
- **Aparición ahora es fade + slide sincronizado:** `translate-x-6 → translate-x-0` junto con
  `opacity-0 → 100`, en una sola `transition-[opacity,transform]` de 500ms con la **misma
  curva** que el ancho de la tarjeta (`cubic-bezier(0.22,1,0.36,1)`).
- **Delay solo al entrar:** `delay-0` en base + `group-hover:delay-150`. Antes el `delay-200`
  aplicaba en ambas direcciones, así que al sacar el cursor el texto quedaba colgado 200ms
  mientras la tarjeta ya se estaba cerrando.
- **El efecto de hover se conserva intacto** (era el pedido) — la tarjeta angosta que se
  expande y revela la bio sigue igual.
- **Bonus:** el ancho expandido pasó de `max-w-[1100px]` a `max-w-[1000px]` = 380 (foto en
  hover) + 620 (bio) exactos. Antes sobraban 100px de blanco muerto a la derecha.

- **Estado:** ✅ `npm run build` OK (exit 0, 23/23 rutas), sin errores ni warnings nuevos en
  ninguno de los 4 archivos tocados.

---

# PARTE 6 — Rediseño de la sección "Conocenos" (Nosotros + Reseñas)

> **Verificado en el navegador, no solo compilado.** Se levantó el dev server y se
> manejó Chrome headless por CDP (script propio con `WebSocket` nativo de Node 22 —
> **no** se agregó playwright/puppeteer ni nada al `package.json`), capturando la
> tarjeta del agente en reposo y en hover, y el carrusel de reseñas, a 1600px y a
> 390px. Dos defectos de esta tanda se encontraron **mirando las capturas**, no
> leyendo el código — están marcados abajo.

**Archivos:** `src/modules/landing/components/Nosotros.tsx`, `.../Reseñas.tsx`.

## Bloque 1 — Tarjeta principal y tarjeta de la frase

- **Más aire, que era el pedido central.** La tarjeta pasó de `h-[550px]` a
  `lg:h-[660px]`; expandida, de 1000px a **1180px**. El panel de biografía pasó de
  620px a **760px** con `lg:px-14 lg:py-12`. La geometría cierra exacta:
  420 (foto en hover) + 760 (bio) = 1180, sin blanco muerto a la derecha.
- **El hover se conserva y se refuerza.** Se mantiene la expansión + fade/slide
  sincronizado de la Parte 5, y se le sumó una sombra que se intensifica al abrir
  (`lg:hover:shadow-[0_34px_90px_-28px_...]`).
- **⚠️ NO volver a `min-w` en el panel de bio.** El comentario extenso en el archivo
  explica por qué: con `min-w` el panel arranca comprimido y se re-wrapea frame a
  frame mientras la tarjeta anima → el texto "cae de a pasos". `lg:w-[760px]
  lg:shrink-0` es el fix, no un detalle de estilo.
- **Marca de agua de rey de ajedrez** en la tarjeta de la frase: SVG inline
  (`ChessKing`), porque `lucide-react` no trae piezas de ajedrez. Silueta sólida a
  propósito — al 7% de opacidad un ícono de trazo fino no se vería.
  - **Defecto encontrado en la captura:** en la primera versión iba sangrada contra
    la esquina (`-right-3 -bottom-5 h-44`) y el `overflow-hidden` le comía la base:
    se leía como una mancha, no como un rey. Corregido a `h-30` centrada en
    vertical y **completa** dentro de la tarjeta, con `pr-36` en la cita para que
    nunca se cruce con el texto.
- La cita ganó padding (`py-9 pl-9`), fondo en degradé `brand-50 → white`, barra de
  acento con `--gradient-brand` y una firma "EDGAR DÍAZ" que antes no tenía.

## Bloque 2 — Las 4 tarjetas inferiores

- **Eran píldoras, no tarjetas.** Estaban en `flex flex-wrap gap-3`, así que cada
  una medía distinto según el largo del texto ("Empatía" vs "Profesionalismo") y
  nunca quedaban alineadas ni parejas.
- Ahora son una **grilla** (`grid-cols-2` en mobile, `lg:grid-cols-4`): mismo ancho,
  misma altura, misma separación. Cada una con ícono en pastilla + label.
- **Hover limpio:** `-translate-y-0.5` + sombra progresiva + borde e ícono que pasan
  a verde. `transform`/`box-shadow`/`color` no reflowean, así que no hay saltos de
  layout, ni cortes, ni overflow.
- **Bonus:** "Cercania" → "**Cercanía**" (faltaba la tilde) y pasó a usar el ícono
  `Handshake`; antes repetía el `ShieldCheck` de "Profesionalismo".

## Bloque 2b — Mobile: la sección dejaba de existir

**Encontrado revisando la captura a 390px.** El panel de bio era `hidden lg:flex` y
en touch no hay hover: abajo de `lg` la frase, el rey y los 4 atributos eran
**inaccesibles**. Solo se veía la foto y una pastilla "Conoceme" que no se podía
activar. Es previo a esta tanda, pero contradice el pedido de que se vea equilibrado
en responsive.

- Debajo de `lg` la tarjeta ahora es una **columna normal**: foto arriba (`h-[440px]`),
  biografía abajo, todo desplegado y siempre visible. El efecto de expansión queda
  como comportamiento **exclusivo de desktop** (`lg:flex-row`, `lg:cursor-pointer`).
- El nombre sobre la foto pasa a ser visible siempre en mobile
  (`opacity-100 lg:opacity-0 lg:group-hover:opacity-100`), y la pastilla "Conoceme"
  se oculta abajo de `lg` (invitaba a una interacción inexistente).
- El rey se oculta abajo de `sm` (no entra sin comerse el texto) y el `h3` baja a
  `1.75rem` en mobile.

## Bloque 3 — Reseñas

- **Separación real:** `spaceBetween` 24 → **44**, y el coverflow bajado de
  `depth:130/modifier:2` a `depth:90/modifier:1.5`. Antes las laterales se montaban
  sobre la central y la fila se veía amontonada.
- **Jerarquía rearmada:** la **valoración encabeza** la tarjeta (antes quedaba
  perdida entre el comentario y el pie), con el chip de operación enfrente; el
  **comentario** crece a 17px con `leading-[1.65]` como protagonista; la
  **identidad** cierra abajo, separada por un borde sutil, con el avatar más grande
  (48 → 52px) y anillo de marca.
- **Se fue la barra de gradiente superior** (se leía como banner y envejecía la
  tarjeta). La marca ahora la da una comilla gigante al ~5% de opacidad, el mismo
  patrón de marca de agua que usan `Confianza.tsx` y la tarjeta de la frase.
- **Bordes y sombras:** `rounded-2xl` → `rounded-3xl`, borde `ink-100`, sombra en dos
  capas y hover con `-translate-y-1.5` + sombra profunda + borde verde, todo en
  400ms con la curva `cubic-bezier(0.22,1,0.36,1)` que ya usa la Landing. `p-7` → `p-8`.
- **Foco en la central:** las laterales quedan al 45% de opacidad. Respeta
  `prefers-reduced-motion`.
- **Defecto encontrado en la captura — alturas desparejas.** Swiper le pone
  `height:100%` a cada slide, así que cada tarjeta se ajustaba a su propio contenido
  y la fila quedaba despareja según el largo del testimonio. Corregido con
  `align-items: stretch` en el wrapper + `height: auto` en los slides, y el `h-full`
  de la `<figure>` llenando.
- **Detalle no obvio corregido:** la primera versión también aplicaba
  `transform: scale()` a los slides desde el CSS. **No sirve y molesta**: el efecto
  coverflow escribe su propio `transform` **inline** en cada slide, que gana por
  especificidad, y encima la transición declarada competía con la del carrusel.
  Quedó solo `opacity`; la profundidad ya la aporta coverflow.

## Trampa que costó un 500 (para la próxima)

El `<style>{\`...\`}</style>` de `Reseñas.tsx` es un **template literal**: un backtick
dentro de un comentario CSS lo corta y tira `Expected '</', got 'height'` → la home
entera responde **500**. Pasó al escribir `` `height: 100%` `` en un comentario.
Hay una nota en el archivo para que no se repita. Vale la pena remarcar que
`npm run build` había pasado **antes** de ese edit: lo agarró levantar la app de
verdad, no el compilador.

- **Estado:** ✅ `npm run build` exit 0, 23/23 rutas, sin errores ni warnings nuevos
  en los 2 archivos tocados. Verificado en navegador a 1600×1000 y 390×844:
  reposo, hover y carrusel, sin cortes, sin overflow y sin saltos de layout.

---

# PARTE 7 — Tanda de contenido e imágenes (auth, Hero, copy, FAQ, Conocenos)

> **Fotos verificadas de verdad, no solo por status 200.** Se bajaron 47 candidatas
> de Unsplash en 4 tandas, se armó una hoja de contactos HTML con cada una y se
> miró el render en Chrome headless. Hacía falta: varias devolvían 200 pero el
> contenido no era el esperado (un oso, un perro, una hamburguesa, unos auriculares).
> Solo se usaron fotos cuyo contenido se confirmó visualmente.

## Bloque 1 — Panel de imagen de Login / Register

**Archivos:** `AuthShell.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`.

- **Se fue el tinte verde.** Había DOS capas encima de la foto: `bg-brand-950/75`
  a pantalla completa más un degradado verde de arriba a abajo. La imagen quedaba
  teñida y apagada. Ahora la foto se ve nítida: solo un **degradado neutro**
  (`from-black/85`) en el 60% inferior —donde va el texto— más un velo parejo de
  `black/10` que sostiene el contraste del botón de arriba.
- **Se fue el logo superpuesto** (`LogoInmobiliaria.png` sobre la foto). No
  aportaba nada y el link "Volver al inicio" ya identifica la salida.
- **Texto reubicado.** Bloque alineado a la izquierda con aire real (`p-14`,
  `max-w-2xl`), título a `2.75rem` y un filete con `--gradient-brand` arriba —
  que es lo que aporta el verde ahora que la foto no está teñida. Antes el copy
  se apretaba en la esquina inferior.
- **Fix de tipografía encontrado en la captura:** el título partía feo
  (`Bienvenido de nuevo a Cerca` / `Trova`, y `Tu próximo hogar empieza` / `acá`).
  Se le puso `whitespace-nowrap` al span resaltado y se ensanchó el bloque a
  `max-w-2xl`, así el corte cae entre frases y no dentro del nombre de marca.
  De paso el resalte de Register pasó de `brand-300` a `brand-400`, igual que
  Login, para unificar.
- **Fotos nuevas, con personas** (antes eran dos fachadas vacías):
  - Login → `photo-1543269865-cbf427effbad` — tres personas conversando alrededor
    de una mesa. Acompaña el copy nuevo sobre estar al día con el mercado.
  - Register → `photo-1556742049-0cfed4f6a45d` — una pareja en un espacio luminoso.
  - Los `imageAlt` se reescribieron: describían las fotos viejas ("Llaves de una
    casa nueva sobre una mesa", "Casa moderna al atardecer").

## Bloque 2 — Hero con personas

**Archivo:** `Slider.tsx`. Se cambiaron **2 de los 4** slides, no todos.

Lo importante fue **cuáles**: la primera pasada cambió los slides 2 y 4, pero el
copy no daba — el slide 2 habla del barrio ("Viví donde todo sucede", shoppings y
universidades) y le quedaba un apretón de manos encima. Se rehizo emparejando foto
y texto:

| Slide | Copy | Foto |
|---|---|---|
| 1 | "Encontrá el lugar donde empieza tu historia" | sin cambios |
| 2 | "Viví donde todo sucede" (barrio) | **sin cambios** — la fachada urbana es lo que corresponde |
| 3 | "Espacios para crecer en familia" | **nueva:** `photo-1609220136736-443140cffec6` — un padre con sus dos hijos |
| 4 | "Invertí con visión de futuro" | **nueva:** `photo-1521791136064-7986c2920216` — apretón de manos / operación acordada |

## Bloque 3 — Copy

- **Franja de estudiantes** (`Slider.tsx` → `EstudiantesBand`): texto reemplazado
  por el pedido, palabra por palabra.
- **Login** (`LoginForm.tsx`): el `panelText` pasó a ser *"¿Te gusta estar
  actualizado sobre las nuevas propiedades y el mercado inmobiliario?"*. Va sobre
  la foto, como texto de apoyo del título; el subtítulo del formulario se dejó
  funcional ("Ingresá tus datos para continuar").
- **Publicá → Publicamos** (`PublicarPropiedad.tsx`): el título ahora es
  *"Publicamos tu propiedad para alquiler o venta"*. **El párrafo se reescribió
  entero**, no solo el título: decía *"Publicala en pocos minutos"*, que devolvía
  la tarea al propietario y contradecía el enfoque nuevo. Ahora arranca "Contanos
  qué querés vender o alquilar y nos ocupamos del resto". El CTA pasó a "Quiero
  publicar mi propiedad" por lo mismo.
- **Bonus:** el `alt` de la imagen de esa sección decía "Publicar propiedad", pero
  la foto son en realidad dos personas cerrando un acuerdo en una oficina. Corregido.

## Bloque 4 — FAQ y franja de Linktree

- **Pregunta eliminada:** *"¿Es seguro invertir en pozo o preventa hoy?"* (era la
  5ª del array). Con eso quedan **6 preguntas**, así que `INITIAL_VISIBLE = 4`
  sigue teniendo sentido: se muestran 4 y "Ver más" despliega las 2 restantes.
  También se sacó el import de `Home` de lucide, que era exclusivo de esa pregunta
  y quedaba sin uso.
- **`LinktreeBand.tsx` (nuevo)**, montado en `Slider.tsx` **entre el Hero y la
  franja de estudiantes**, tal como se pidió. Tarjeta centrada con ícono en
  pastilla de gradiente, título "Seguinos y enterate de todo", bajada y botón
  "Ver nuestro Linktree" hacia `linktr.ee/inmobiliariacercatrova`.
  - Abre en pestaña nueva con `rel="noopener noreferrer"`: sin `noopener` la
    página destino recibe `window.opener` y puede redirigir la pestaña original
    (tabnabbing).
  - No usa `CtaButton` porque ese componente no expone `rel`.
- **Fix encontrado en la captura:** entre la franja blanca del Linktree y la verde
  de estudiantes aparecía una banda gris del fondo del body. Era el `mt-14` que
  `EstudiantesBand` traía de cuando iba pegada al Hero; ya no hace falta porque
  LinktreeBand aporta su propia separación. Eliminado.

## Bloque 5 — Tarjeta del agente más baja

**Archivo:** `Nosotros.tsx`. De `lg:h-[660px]` a **`lg:h-[580px]`** (−80px, ~12%).

Lo no obvio: la altura se recortó **sin apretar el contenido**. El panel de
biografía se **ensanchó** (760 → 820px) y la foto se achicó (420 → 400px en hover),
así que expandida mide 1220px. Con más ancho los párrafos ocupan menos renglones,
que es de donde salía la altura. Además: `gap-7 → gap-5`, `py-12 → py-10`, cuerpo a
15px/1.6 y `h3` a `2.1rem`. El efecto de hover queda intacto (incluido el
`lg:w-[820px] lg:shrink-0` que evita el "cabeceo escalonado" — ver Parte 5).

## Bloque 6 — Los 4 atributos pasan a píldoras *(confirmado con el usuario)*

Había **dos candidatas** y se preguntó antes de tocar: los 4 atributos de
`Nosotros.tsx` y los íconos del acordeón de `RealEstateFAQ.tsx`. Se confirmó la
primera (los del FAQ son uno por fila en lista vertical: no se pueden alinear "todos
en una fila" sin rehacer el acordeón).

- De 4 tarjetas cuadradas en grilla a **píldoras `rounded-full`**, más anchas que
  altas, en una sola fila (`flex` + `flex-wrap`, así en mobile bajan solas sin
  romperse). Los 4 labels entran holgados en el ancho del panel, así que en desktop
  no wrapean.
- Hover: elevación de 2px + relleno verde. Solo `transform`/`box-shadow`/color, que
  no reflowean — sin saltos de layout.

## Bloque 7 — El ícono "del rey" *(confirmado con el usuario)*

Era el **`ChessKing`**, un SVG inline a medida agregado en la Parte 6, dentro de la
tarjeta de la frase de `Nosotros.tsx`. Se confirmó el reemplazo: **`Crown` de
lucide-react**, que conserva la idea de realeza/premium pero con el mismo trazo que
el resto de la iconografía de la Landing. El componente `ChessKing` se eliminó.

- **Detalle:** la corona va al **12%** de opacidad, no al 7% del rey. El rey era una
  silueta **sólida**; la corona es de **trazo**, y al 7% no se veía.

- **Estado:** ✅ `npm run build` exit 0 tras cada bloque y al cierre; 23/23 rutas,
  11 warnings preexistentes, ninguno en los archivos tocados. Verificado en
  navegador: Login, Register, Hero, franja de Linktree, franja de estudiantes y la
  tarjeta del agente en reposo y en hover.

---

# PARTE 8 — Fotos del Hero y de auth (segunda pasada, con briefs del cliente)

> **Alcance acotado a pedido explícito:** solo el **Hero** de la Landing y
> **login/register**. La franja "VIDA UNIVERSITARIA" (`EstudiantesBand`) **no se
> tocó**, y la sección nueva de estudiantes se resolvió como un **slide más del
> Hero**, no como una sección aparte.
>
> **No hay generación de imágenes en esta sesión.** Los briefs del cliente
> describían fotos a generar; se acordó buscar en Unsplash lo más parecido. Se
> bajaron ~60 candidatas en 4 tandas y se miró cada una renderizada en una hoja de
> contactos. Necesario: varias devolvían 200 con contenido equivocado (rascacielos
> donde se buscaban llaves, un gato, un disco rígido, un obrero).

## Hero — de 4 a 5 slides

**Archivo:** `Slider.tsx`.

| # | Copy | Imagen | Estado |
|---|---|---|---|
| 1 | "Encontrá el lugar donde empieza tu historia" | `photo-1609220136736` — padre con dos hijos | **nueva** (antes interior vacío) |
| 2 | "Viví donde todo sucede" | **`/estudiante.jpg`** — archivo LOCAL de `public/` | **nueva** |
| 3 | "Espacios para crecer en familia" | `photo-1570129477492` — casa con jardín cuidado, luz de día | **nueva** |
| 4 | "Invertí con visión de futuro" | `photo-1512917774080` — casa moderna con galería y muebles de exterior | **nueva** |
| 5 | **"Pensamos en los estudiantes"** | `photo-1596276020587` — edificios de departamentos con bicicletas | **slide NUEVO** |

- **`estudiante.jpg` estaba en `public/` sin usarse en ningún lado** (verificado por
  grep antes de cablearlo). Es un archivo local, no Unsplash: `next/image` lo sirve
  igual sin tocar `remotePatterns`.
- **Copy del slide 5** (redactado acá, a pedido): *"Departamentos a minutos de las
  facultades, listos para mudarte. Vos ocupate de cursar, del resto nos ocupamos
  nosotros."* El título es "Pensamos en los estudiantes".
- **Sobre "luz de mañana":** los briefs pedían luz de mañana y descartaban
  atardecer/noche. Las fotos elegidas para los slides 3 y 4 son de día pleno, que es
  lo más cercano disponible; se descartaron varias candidatas justamente por estar
  en golden hour.

## Login / Register

**Archivos:** `LoginForm.tsx`, `RegisterForm.tsx`, `AuthShell.tsx`.

- **Login → `photo-1560184897-ae75f418493e`** — galería de una casa con la puerta de
  entrada, sillones de mimbre, plantas y luz natural.
  **⚠️ No es la foto del brief.** Se pedían "llaves de casa con llavero moderno sobre
  una mesa de madera". Se buscó en 4 tandas y **no apareció ninguna foto de llaves
  utilizable**. Se eligió esta por la segunda mitad del brief ("imagen refrescante"):
  es cálida, minimalista, con luz natural, y temáticamente es *la puerta que abre la
  llave*. **Candidata a reemplazar** si más adelante se genera la imagen del brief.
- **Register → `photo-1580894732444-8ecded7900cd`** — persona joven sonriendo en un
  ambiente luminoso. El brief pedía además que estuviera escribiendo en una notebook;
  las opciones con notebook que aparecieron eran manos sin cara, y a la escala del
  panel (columna alta, foto grande detrás del título) una persona sonriendo funciona
  mucho mejor que una pantalla.
- **`imagePosition` — prop nueva en `AuthShell`.** El panel es una columna ALTA y las
  fotos de stock son apaisadas, así que `object-cover` recorta a lo ancho: si el
  sujeto no está centrado en el original, queda contra el borde. Se vio en la captura
  — la protagonista de Register quedaba cortada contra el borde derecho con media
  pared vacía ocupando el cuadro. La prop expone `object-position` (default
  `'center'`); Register usa `"72% center"`.
- El **degradado oscuro inferior** que pedían los briefs para superponer texto ya
  existía de la Parte 7 (`from-black/85` en el 60% inferior). Sin cambios.

## Limpieza

- `LinktreeBand.tsx` había quedado importando `Instagram` de lucide sin usarlo (el
  ícono se cambió a `Share2`). Eliminado: el build vuelve a 11 warnings, todos
  preexistentes y ninguno en archivos de esta tanda.

- **Estado:** ✅ `npm run build` exit 0, 23/23 rutas, 11 warnings preexistentes.
  Verificado en navegador a 1600×1000: los 5 slides del Hero uno por uno (clickeando
  los dots), `/login` y `/register`.

## Crédito del desarrollador en el Footer

**Archivo:** `FooterPublic.tsx`.

- Se agregó una línea de crédito técnico en la fila inferior del footer (la de
  copyright + links legales), entre "© 2026 Inmobiliaria Cerca Trova — Córdoba,
  Argentina | Matrícula N° 04 4838" y los links "Privacidad" / "Términos": **"Desarrollado
  por Matías Diaz"**, con el nombre como link `mailto:matidiazargentino21@gmail.com`.
- **Layout:** la fila era `flex justify-between` con 2 hijos (copyright / links). Se
  agregó el crédito como un tercer hijo en el medio — con 3 elementos,
  `justify-between` reparte el espacio en dos tramos iguales y el del medio queda
  centrado sin necesidad de un wrapper extra ni de tocar el layout existente. En
  mobile (`flex-col`) cae naturalmente como segunda línea, entre el copyright y los
  links, que es el orden pedido.
- **Jerarquía tipográfica deliberada:** `text-[11px] text-white/40` — un paso más
  chico y más apagado que el resto de la fila (`text-xs text-white/55`). Es una firma
  técnica, no otro dato institucional: no debe competir visualmente con la matrícula
  ni con los links legales. El link del email usa `text-white/55` con subrayado
  punteado sutil (`decoration-white/20`) y aclara a `white/85` en hover — mismo
  lenguaje de interacción que el resto de los links del footer, sin introducir un
  color nuevo.
- **Estado:** ✅ `npx tsc --noEmit` sin errores, `npm run build` exit 0 (39/39 rutas,
  0 warnings). Verificado contra el HTML servido en producción (`next start`): el
  texto "Desarrollado por" y el `href="mailto:matidiazargentino21@gmail.com"`
  aparecen en la respuesta.

# PARTE 9 — Últimos ajustes visuales antes del deploy

## 1. "Publicamos tu propiedad" — un solo CTA + imagen nueva

**Archivo:** `(public)/servicios/[id]/page.tsx`, entrada `comercializacion` de `BLOQUES`.

- **Se eliminó el bloque `destacado`** (`ServiceInlineCta` "¿Empezamos?" → `/publicar`) **y las
  `actions` del bloque `compromiso`** (botón "Publicar mi Propiedad" → `/publicar`). Eran dos
  llamados a la acción **idénticos, al mismo destino, separados por un párrafo**; sumados al CTA
  final de después de las FAQ, la mitad inferior de la página pedía "publicá tu propiedad" tres
  veces. Ahora queda **un único CTA de cierre**, al final, debajo de las preguntas frecuentes.
  El acceso a `/publicar` sigue disponible arriba, en los botones del bloque de presentación.
- **Imagen reemplazada.** `/servicePublicacionPropiedad/publicar-desde-casa.png` era una
  generación de IA con **la marca de agua de Gemini visible**. Se cambió por
  `photo-1560518883-ce09059eeffa` de Unsplash (llaves de vivienda junto a la maqueta de una casa
  sobre un escritorio de madera).
  **Verificación:** se descargaron 11 candidatas y se inspeccionaron una por una antes de elegir
  — varias que parecían encajar por el nombre resultaron ser rascacielos, una caja de cartón, un
  chanchito de alcancía y un mostrador de local. La elegida está confirmada visualmente y
  responde HTTP 200. Se descartó `photo-1521791055366-0d553872125f` (firma de contrato, también
  buena) porque el servicio *Gestión Legal* ya usa una foto de firma y se habrían pisado.

## 2. "Gestión Legal y Documental" — migrado al patrón común

**Archivo:** `(public)/servicios/[id]/page.tsx`, entrada nueva `legal` en `BLOQUES`.

- Era **la última página de servicio con el layout viejo**: hero con foto de fondo, un bloque de
  texto corrido y dos botones. Al lado de las otras cinco se notaba que era otra plantilla — sin
  bloques alternados, sin animaciones de entrada y con un solo tono de fondo.
- Migrada a `ServicioTemplate`, la misma estructura de 7 bloques que usan Venta, Alquiler,
  Tasaciones, Asesoramiento y Comercialización: presentación → beneficios → detalle → pasos →
  compromiso → FAQ → CTA. Hereda automáticamente los `Reveal`/framer-motion, la alternancia de
  fondos y los componentes compartidos de `ServiceBlocks`.
- **El contenido es el real, redistribuido** — no se inventó nada: los párrafos salen de
  `serviciosData.legal.descripcion`, los 6 pasos de `pasos`, los 4 beneficios de `beneficios`, y
  el bloque de compromiso de `persuasion`. Se conservan los **2 botones pedidos** (WhatsApp +
  Ver Propiedades) en el bloque de presentación.
- **Patrón de columnas propio** (`invertir: { presentacion: true, compromiso: true }`) y entrada
  `fade` en vez de `slide`, para que no quede calcada de las anteriores — mismo criterio que ya
  seguían las otras cinco.

## 3. Detalle de propiedad — animaciones + paleta menos saturada

**Archivos:** `(public)/properties/[id]/PropertyDetail.tsx`, `properties/lib/badgeStyles.ts`.

### Animaciones

- **Accesos rápidos** (Volver al catálogo / Ver dirección exacta / Ver Comentarios / Ver
  Valoraciones + Guardar): entran escalonados con fade + slide corto (`y: 8`, 0.35 s, stagger
  0.07 s). Se usa `motion` con `animate` y **no** `<Reveal>` porque la barra ya está dentro del
  viewport al cargar: un `whileInView` dependería del margen de detección.
  ⚠️ El contenedor intermedio también es `motion.div`: las variantes de framer se propagan por el
  árbol de componentes `motion`, y un `<div>` común en el medio cortaba la cadena y el stagger no
  llegaba a los accesos.
- **Bloques principales** envueltos en `<Reveal y={18}>` — el mismo componente de la landing:
  galería, encabezado, descripción, características, comentarios/valoraciones y mapa. La página
  no tenía ninguna animación de entrada, a diferencia del resto del sitio.

### Paleta

- **Badges de la cabecera** (operación / tipo / estado): pasaron del relleno sólido saturado al
  criterio suave que ya usaba el badge de estado — **fondo `-50`, borde `-200`, texto `-700`**.
  Antes la fila eran tres semáforos (gradiente naranja→rosa, sólido `-400` con texto blanco, chip
  suave) compitiendo entre sí y contra el `h1`.
  Se agregaron `operationBadgeSoft()` y `propertyTypeBadgeSoft()` en `badgeStyles.ts`, que
  **conviven** con las sólidas: en las tarjetas del catálogo el badge va SOBRE LA FOTO, donde el
  relleno fuerte no es decoración sino lo único que garantiza legibilidad contra cualquier imagen.
  El tratamiento suave se aplica solo donde el fondo es una tarjeta blanca.
- **Hovers de los accesos rápidos:** eran rellenos sólidos (`bg-brand-700`, `bg-red-600`,
  `bg-blue-600`, `bg-amber-500`) que invertían el texto a blanco — cuatro rectángulos de color
  fuerte prendiéndose y apagándose en la primera fila de la página. Ahora usan fondo `-50` +
  borde `-200` + texto `-700`. El color propio de cada acceso lo sigue dando su ícono.

### Verificación

Se levantó el build de producción y se **capturó la página completa en Chrome headless** para
confirmar que el layout quedó idéntico: galería con miniaturas, encabezado con los 3 badges,
píldoras de ubicación, descripción, características (specs + comodidades), valoraciones,
comentarios, mapa y sidebar sticky (precio, WhatsApp, agente, resumen) — todo en su lugar, sin
elementos faltantes ni desplazados. Lo único que cambió es la intensidad del color de los badges.

## 4. Carrusel de reseñas — autoplay más rápido

**Archivo:** `landing/components/Reseñas.tsx`.

- `autoplay.delay` de **4200 → 2600 ms**. Avanzaba tan lento que en una pasada por la landing se
  alcanzaban a ver dos reseñas y la sección parecía estática. 2600 ms es lo más corto que todavía
  deja leer completo un testimonio de 2-3 líneas antes de que se corra; por debajo de ~2200 ms hay
  que apurarse y se siente nervioso. `pauseOnMouseEnter` sigue activo: si alguien se detiene a leer
  una en particular, el carrusel la espera.

## Estado

✅ `npx tsc --noEmit` sin errores · `npm run lint` **0 problemas** · `npm run build` exit 0,
**39/39 rutas**. Detalle de propiedad verificado con captura real del build de producción.

⚠️ **Nota de entorno (no es un cambio de código):** durante esta sesión se detectó que la base de
datos de desarrollo quedó **reseteada** — 0 propiedades, 0 posts, y la tabla de usuarios
recreada (un alta nueva recibe `id: 2`). También cambiaron `ADMIN_EMAIL`/`ADMIN_PASSWORD` en el
`.env` del backend. Para la verificación visual se creó una propiedad temporal y se eliminó al
terminar; el catálogo quedó como estaba (0 propiedades).

# PARTE 10 — Borrador automático + Ficha compartible

## 1. Persistencia de formularios en el dashboard admin

**Archivos:** `shared/hooks/useFormDraft.ts` (nuevo), `dashboardAdmin/propiedades/PropertyForm.tsx`.

**Caso que lo motivó:** un admin perdió las 10 imágenes y los 21 campos cargados al navegar
fuera del formulario por un error que después resultó no ser culpa suya. Antes no existía
**ningún** mecanismo de borrador en todo el panel — verificado por grep: los únicos usos de
`sessionStorage`/`localStorage` del proyecto son la marca del toast de notificaciones pendientes,
sin relación con formularios.

- **`useFormDraft`** — hook genérico y reutilizable, listo para los demás formularios del panel.
  Guarda con debounce de 400 ms, restaura al montar, y expone `restored` + `discard()`.
- **`sessionStorage`, no `localStorage`** (como se pidió): se limpia solo al cerrar la pestaña.
  Un borrador a medio cargar no debe sobrevivir semanas ni reaparecer meses después pisando un
  formulario nuevo.
- **Clave por formulario Y por modo:** `ct_draft_property_new` para el alta,
  `ct_draft_property_<id>` para cada edición. Si compartieran clave, empezar una propiedad nueva
  pisaría el borrador de la que se estaba editando.
- **En modo edición el guardado espera al fetch** (`disabled: loading`): sin eso, el `useState`
  inicial vacío se escribiría encima del borrador antes de que llegue la respuesta del backend.
  Una vez cargado, el borrador (los cambios sin guardar del admin) gana sobre los datos del server
  — que es el comportamiento deseado.
- **El borrador se limpia SOLO al guardar con éxito** o desde el botón nuevo
  **"Descartar borrador"**. Si el `PATCH`/`POST` falla, el `catch` lo deja intacto: es todo el
  punto de tenerlo.
- **Aviso visible al recuperar:** banner ámbar "Recuperamos lo que habías cargado". Sin esto, el
  admin vería el formulario lleno sin saber si son datos reales de la propiedad o restos de una
  carga anterior.
- **Nada sensible se guarda.** Sólo el objeto `form` (21 campos de texto/número/booleanos). La
  sesión vive en una cookie `httpOnly` que el JavaScript ni siquiera puede leer, así que no hay
  forma de que un token termine acá aunque se quisiera.

### Limitación conocida: las imágenes NO se guardan en el borrador

Los objetos `File` de un `<input type="file">` **no son serializables a JSON** — son referencias a
un archivo del disco que el navegador sólo mantiene mientras la página vive. Convertirlos a base64
tampoco es viable: `sessionStorage` tiene un tope de ~5 MB por origen y el backend acepta imágenes
de hasta **5 MB cada una** (hasta 10) — una sola foto ya puede desbordar la cuota.

**Estado actual:** se preservan los 21 campos de texto y las imágenes hay que volver a
seleccionarlas. El banner de recuperación lo dice explícitamente cuando no hay ninguna cargada.

**Si esto no alcanza,** la alternativa sería subir las imágenes a un endpoint temporal del backend
apenas se seleccionan y guardar sólo las URLs en el borrador — requiere trabajo de backend
(endpoint de staging + limpieza de huérfanas) y queda como decisión pendiente.

## 2. Ficha pública compartible — `/ficha/:id`

**Archivos nuevos:** `app/ficha/layout.tsx`, `app/ficha/[id]/page.tsx`,
`app/ficha/[id]/FichaContent.tsx`, `app/ficha/[id]/types.ts`.
**Modificados:** `NavbarSelector.tsx`, `FooterSelector.tsx`, `shared/lib/contact.ts`,
`dashboardAdmin/propiedades/page.tsx`.

### Decisión de arquitectura: URL con el id real (opción **a**)

Se evaluaron las dos opciones y se eligió `/ficha/42` **porque el token no agregaría privacidad
real hoy**: `GET /properties/:id` es un endpoint **público** en el backend y **no filtra por
`status`**, y la ruta `/properties/:id` del sitio ya es igual de enumerable. Cualquiera puede
recorrer ids y ver las mismas propiedades desde antes de que esta página existiera — sumar un UUID
sólo del lado del frontend sería seguridad de fachada, con el costo de una columna nueva y una
migración.

Para que un token sirviera de verdad habría que hacer las **dos** cosas juntas: agregar
`publicToken` a la entidad **y** cerrar/gatear el endpoint público. Eso es trabajo de backend y una
decisión de producto aparte; queda anotado en el docstring de `page.tsx` como la vía a seguir si
más adelante se quieren fichas realmente no enumerables.

### La página

- **Primera ruta "limpia" del proyecto.** No existía ninguna de referencia: `/login` y `/register`
  se salvan del chrome público pero tienen el suyo propio (`AuthShell`). Hubo que excluir `/ficha`
  en **tres** lugares: su propio `layout.tsx`, `NavbarSelector` y `FooterSelector` (los dos últimos
  se montan en el layout raíz y deciden por `pathname`). Se dejó un `STANDALONE_PREFIXES` en ambos
  para que agregar otra ruta standalone sea un solo string.
- **Cero marca:** verificado sobre el HTML servido — 0 ocurrencias de "Cerca Trova", "CercaTrova",
  "Inmobiliaria" y del logo; 0 de navbar/footer. Se usan los tokens `brand-*`/`ink-*` porque son
  verde/gris/blanco genéricos, pero nada permite reconocer la inmobiliaria.

### Espejo completo de la propiedad — los 21 campos, verificados uno por uno

Contra el HTML realmente renderizado: título, descripción completa (con saltos de línea), precio,
operación, tipo, estado, **dirección exacta**, barrio, zona, localidad, provincia, ambientes,
baños, sup. total, sup. cubierta, antigüedad, escritura, tracto abreviado, boleto, cochera, patio,
número de referencia y fecha de publicación. **Todas las imágenes** (`resto.map()` sin `slice` ni
tope — se probó con 3, en producción muestra las que haya).

Los booleanos se listan **siempre los cinco**, tengan `true` o `false`: que una propiedad NO tenga
escritura es un dato tan relevante como que la tenga, y quien recibe la ficha necesita saberlo sin
ambigüedad (tilde verde / cruz gris).

**Lo que se deja afuera, y por qué:** `agent`, `referredBy`, `comments`, `ratings`, `ratingAverage`
y `favoritesCount` vienen en la respuesta pero no se muestran. No son datos de la propiedad sino de
la inmobiliaria y de la actividad de su sitio — mostrar el agente (nombre + teléfono) identificaría
el origen, que es justo lo que esta página tiene que evitar.

### Metadata de compartición — verificada sobre el HTML servido

```html
<title>Casa moderna con patio y cochera en Nueva Cordoba</title>
<meta property="og:title" content="Casa moderna con patio y cochera en Nueva Cordoba">
<meta property="og:description" content="USD 189.000 · Nueva Cordoba, Cordoba Capital · casa · 3 amb. · 2 baños · 180 m². Excelente casa…">
<meta property="og:image" content="https://res.cloudinary.com/…/properties/…png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="robots" content="noindex, follow">
```

La descripción pone **los datos duros primero** (precio, ubicación, tipo, ambientes) porque en la
previsualización de WhatsApp se ven ~2 renglones: lo concreto tiene que entrar antes que el texto
libre. `noindex` a propósito: la ficha es para compartir de forma directa, no para competir en el
buscador con la página real de la propiedad.

**404 real:** `/ficha/99999` devuelve `HTTP/1.1 404 Not Found` en los headers (no un soft 404). Se
replica el patrón de `properties/[id]`: la búsqueda vive también en `generateMetadata`, y sólo un
404 del backend se traduce a `notFound()` — un timeout o un 500 se relanzan para que los tome
`app/error.tsx`, en vez de afirmar que la propiedad no existe durante una caída.

### Botones en la lista del admin

Cada fila suma dos acciones antes de Editar/Eliminar (los cuatro entran en la fila sin romper el
layout, verificado con captura):

- **"Enviar"** — copia el link completo de la ficha al portapapeles, con toast "Link copiado" y un
  tilde efímero de 2 s en el botón. Si `navigator.clipboard` falla (exige contexto seguro), el
  toast muestra la URL para copiarla a mano en vez de dejar al admin sin saber qué pasó.
- **WhatsApp** — abre WhatsApp con el título y el link ya cargados. Usa `whatsappShareLink()`, un
  helper nuevo en `contact.ts`: `wa.me/` **sin número**, para que la persona elija el destinatario
  (distinto de `whatsappLink()`, que escribe a la inmobiliaria, y de `whatsappLinkTo()`, que
  escribe a un teléfono concreto).

La URL se arma con `window.location.origin`, así funciona igual en local, en preview de Vercel y en
producción sin depender de configurar un dominio en otro lado.

## Estado

`npx tsc --noEmit` sin errores · `npm run lint` **0 problemas** · `npm run build` exit 0,
**39 rutas** (`/ficha/[id]` como dinámica).

Probado en el navegador contra una propiedad real creada para la prueba (y eliminada después):
ficha renderizada y capturada, meta tags verificadas sobre el HTML servido, 404 real confirmado con
`curl -I`, y botones del panel verificados con sesión de admin real vía CDP.

---

# PARTE 11 — Notificaciones, detalle de propiedad y vuelta al origen tras el login

Tanda pedida con dos capturas de `cercatrova-front.vercel.app/properties/5`. Nueve cambios en
tres frentes: el sistema de notificaciones del usuario, la página de detalle de una propiedad, y
el destino al que se llega después de iniciar sesión.

## 1. Notificaciones — un solo orden en los tres lugares

El dropdown del sidebar, la fila de filtros del panel y los tipos de aviso mostraban las mismas
categorías en **tres órdenes distintos**. Ahora hay un único orden canónico, el del sidebar:

```
Todas · Propiedades nuevas · Publicaciones nuevas · Según mis preferencias ·
Bajaron de precio · Respuestas a mis comentarios
```

- **`dashboard/layout.tsx`** — el grupo "Notificaciones" del sidebar sigue ese orden.
- **`dashboard/notificaciones/page.tsx`** — `FILTER_TABS` lo replica y después suma los filtros
  que sólo existen en el panel (`Sin leer`, `Leídas`, y los tres de solicitudes:
  `Aceptadas`, `Rechazadas`, `En revisión`).

⚠️ **Las tarjetas de acceso rápido (`SUMMARY_CARDS`) quedaron como estaban.** Son contadores
agregados —Total, Sin leer, Propiedades, Preferencias, Precios, Solicitudes—, no filtros por tipo;
reordenarlas para que "calcen" con el dropdown mezclaba dos cosas distintas. Fue una decisión
explícita, no un olvido.

## 2. Badge de no leídas en el sidebar del dashboard

La campanita de la navbar ya mostraba el conteo; el sidebar del dashboard, no — con lo cual el
usuario que entraba directo a `/dashboard` no tenía ninguna señal de que había algo pendiente.

`NavGroup` (componente local de `dashboard/layout.tsx`) suma una prop `badge = 0` y, cuando es
mayor a cero, dibuja la misma pastilla roja de la navbar: `bg-red-500`, número blanco,
`99+` como tope.

El conteo sale de **`GET /notifications/unread-count`** —el endpoint que resuelve el rol desde el
token— y no de traer la lista entera para contarla en JS. Se refresca por dos vías, igual que la
campanita:

- polling cada 60 s
- listener del evento DOM `notif-updated`, que emiten las acciones de "marcar como leído"

Así, marcar todas como leídas apaga el badge al instante en vez de esperar hasta un minuto.

## 3. Colores de las notificaciones

`getConfig()` pasó de devolver `{ icon, bg, border, dot, label }` a incluir también `text` y
`accent`. Cada tipo tiene ahora una familia de color completa y coherente:

| Tipo | Color | Ícono |
|---|---|---|
| Nueva propiedad | `brand` (verde de marca) | `Home` |
| Nueva publicación | `sky` | `Megaphone` |
| Según tus preferencias | `purple` | `Sparkles` |
| Bajó el precio | `amber` | `TrendingDown` |
| Respondieron tu comentario | `violet` | `MessageCircle` |
| Solicitud aceptada / rechazada / en revisión / recibida | `emerald` / `red` / `amber` / `blue` | `ClipboardList` |

Las **no leídas** suman una barra vertical de acento pegada al borde izquierdo de la tarjeta
(`absolute inset-y-0 left-0 w-1`, con `overflow-hidden` y `pl-6` en el contenedor). Es la misma
señal que el punto de la derecha pero legible de un vistazo al escanear la lista en vertical: el
color de la barra ya dice de qué se trata el aviso antes de leer el texto.

## 4. El toast de avisos pendientes, alineado con el panel

`PendingNotificationsToast` tenía su propia tabla de íconos y colores, hecha antes que la del
panel. El resultado: la misma notificación aparecía con **megáfono violeta** en el toast y con
**casita verde** en la lista, y "bajó el precio" era esmeralda en un lado y ámbar en el otro.
Como el toast es la primera vista de un aviso y el panel la segunda, el usuario no los asociaba.

`ESTILO_POR_TIPO` ahora espeja `getConfig()` para los tres tipos que efectivamente le llegan a un
usuario común (nueva propiedad, nueva publicación, cambio de precio) y para el resto. El fallback
por texto —el que cubre las filas anteriores a la migración de `type`— se actualizó con los
mismos colores, más una rama nueva para "propiedad".

Queda anotado en el propio archivo que las dos tablas tienen que moverse juntas.

## 5. Prolijidad de los toasts (esquina inferior derecha)

En `AppToaster.tsx`:

- **Ancho fijo de 380 px** (`style={{ width: 380 }}` en el `<Toaster>`). Antes cada toast se
  ajustaba a su texto y la pila quedaba con los bordes izquierdos desalineados, en escalera.
- **Bordes de `400` a `200`** en `COLOR_POR_TIPO`. El borde saturado competía con la barra de
  acento; ahora el color fuerte vive sólo en la barra y el borde apenas insinúa el tipo.
- Sombra en dos capas (`0 1px 3px` + `0 14px 36px -14px`) en vez de una sola sombra dura, y
  `pr-10` para que el texto largo no se meta debajo del botón de cerrar.

## 6. Detalle de propiedad — título más chico

`text-3xl md:text-[2.6rem]` → **`text-2xl leading-tight md:text-3xl`**.

Los títulos reales de esta inmobiliaria son largos (el de la captura ocupaba cuatro renglones y
empujaba las píldoras de dirección/barrio/zona fuera del primer viewport). Con el tamaño nuevo el
mismo título entra en tres renglones y las píldoras vuelven a verse sin scrollear. Sigue siendo el
elemento más grande de la tarjeta.

## 7. Valoraciones y comentarios, separados como el resto

Las dos secciones estaban pegadas entre sí mientras todas las demás tenían `gap-8`.

**Causa:** al envolver el bloque en `<Reveal>` en la Parte 9, `CommentsAndRatings` devolvía un
fragmento `<>…</>`. El fragmento no genera nodo, así que sus dos hijos quedaron dentro del mismo
contenedor del `Reveal` y el `gap-8` del padre pasó a aplicarse **al bloque entero**, no entre las
dos secciones.

**Arreglo:** el fragmento pasó a ser `<div className="flex flex-col gap-8">`. Una línea, y el
espaciado vuelve a ser el mismo que hay entre Descripción, Características y Ubicación.

## 8. Foto del agente

El círculo mostraba siempre el ícono genérico de persona. El componente leía `agent.avatar`, pero
**el backend manda el campo `photo`** — `AGENT_PUBLIC_FIELDS = ['id','name','surname','phone','photo']`.
Nunca había un `avatar` que leer.

Ahora:

- la interfaz `Agent` declara `surname` y `photo`;
- se renderiza `agent.photo ?? agent.avatar` (el `??` deja pasar cualquier respuesta vieja que
  todavía traiga `avatar`) con `next/image`, 64×64 y `object-cover`;
- si no hay ninguna de las dos, se cae al ícono `User` de antes;
- el nombre muestra `name + surname`, y debajo va **`agent.phone`** en vez de `agent.email` —
  el email no está en `AGENT_PUBLIC_FIELDS`, así que ese renglón estaba vacío siempre.

## 9. Después del login, volver a lo que estabas haciendo

**El problema:** quien no tenía sesión y tocaba "Guardar" (favorito), valorar o comentar terminaba
en `/login` a secas, y al autenticarse aterrizaba en `/dashboard` — lejos de la propiedad, que
tenía que volver a buscar a mano. El middleware ya escribía `?callbackUrl=`, pero **nadie lo
leía**: se generaba y se descartaba.

Módulo nuevo **`shared/lib/returnTo.ts`**, con el mismo nombre de parámetro que ya usaba el
middleware (`callbackUrl`):

- `loginUrlWithReturn(path)` — arma `/login?callbackUrl=<path>` con la ruta actual codificada.
- `currentPathWithQuery()` — `pathname + search` en el cliente, `null` en el servidor.
- `isSafeReturnPath(path)` — **el chequeo que evita un open redirect**. Exige que el destino
  empiece con una sola `/` y rechaza `//` y `/\`, que los navegadores leen como URL
  protocol-relative hacia otro host. Sin esto, `/login?callbackUrl=https://sitio-falso.com` mandaría
  al usuario a un sitio ajeno justo después de un login legítimo — phishing de manual.

Consumidores: `FavoriteButton`, y los dos `<Link href="/login">` de valoraciones y comentarios en
`PropertyDetail`. `AuthContext.handleAuthSuccess` lee el parámetro al terminar el login —da igual
si fue con email + contraseña o con Google, porque ese handler es compartido a propósito— y
redirige ahí. El admin sigue yendo siempre a `/dashboardAdmin/`: el `callbackUrl` no le aplica.

## Estado

`npx tsc --noEmit` sin errores · `npm run lint` **0 problemas** · `npm run build` exit 0, 39 rutas.

Verificado en el navegador contra el backend real, con datos creados para la prueba y **borrados
después** (2 propiedades, 1 publicación, 1 usuario):

- **Detalle de propiedad** — captura con un título largo igual al de la captura del brief: entra
  en tres renglones, la foto del agente se ve en el círculo y las secciones quedaron con el mismo
  espaciado. Los cuatro accesos rápidos de la barra superior se confirmaron en el HTML servido:
  aparecían de a poco en las capturas sólo porque la animación escalonada quedaba a mitad de
  camino, no por un problema de layout.
- **Panel de notificaciones** — sesión de usuario real vía CDP, con tres avisos de tipos distintos
  generados a propósito (nueva propiedad, nueva publicación, cambio de precio). Se confirmó el
  orden nuevo de la fila de filtros, el badge rojo con el `3` en el sidebar, y las tres barras de
  acento con su color correspondiente.
- **Toast** — capturado ya con el ícono de casa verde en vez del megáfono violeta.

---

# PARTE 12 — Moneda por propiedad, reordenar imágenes, expensas y apto mascotas

> Sesión fullstack (2026-08-08). Los tres bloques nacieron en el backend — ver
> `../CercaTrova-Back/FEATURES.md` (N1, N2, N3) y `API_CONTRACT.md` §5 y §6.
> Nada de acá funciona sin el backend correspondiente desplegado.

## Aclaración previa — "Tracto abreviado" y "Boleto" ya existían

El pedido los mencionaba como ejemplo de estilo de nombres, no como campos a
crear. Se verificó contra el código: **son campos reales del proyecto desde
antes** (`Property.tractoAbreviado` y `Property.boleto`, ambos `default: false`),
y ya estaban en el formulario del admin, el modal de filtros, las preferencias de
búsqueda, el detalle y la ficha. No se tocaron. Los únicos campos nuevos de esta
tanda son `expensas` y `aptoMascotas`.

De paso quedó relevada la lista **real y completa** de "Comodidades y
documentación" del detalle: son **5**, no 3 — Cochera (`garage`), Patio
(`patio`), Apto Escritura (`property_deed`), Tracto abreviado
(`tractoAbreviado`) y Boleto (`boleto`). Con "Apto Mascotas" pasan a 6.

---

## Bloque 1 — Moneda por propiedad (`currency`)

### El problema, medido

El precio se muestra en **9 lugares**, no en los 4 del pedido inicial, y en los
9 estaba escrito a mano como el monto con `toLocaleString('es-AR')` seguido de un
`<span>USD</span>` **literal**. Dos de esos 9 son `generateMetadata` de
OpenGraph: el "USD" viajaba en la previsualización del link que se comparte por
WhatsApp, donde un error no tiene vuelta atrás una vez enviado.

### `src/modules/shared/lib/money.ts` (NUEVO)

Punto único de la verdad para formatear plata. Tres funciones:

| Función | Devuelve | Para qué |
|---|---|---|
| `priceParts(price, currency)` | `{ amount: "US$ 85.000", code: "USD", currency }` | Las 6 vistas que maquetan el monto grande y el sufijo chico en `<span>` separados |
| `formatPriceInline(price, currency)` | `"USD 85.000"` | Los 2 `generateMetadata` + los listados donde no hay JSX que maquetar |
| `formatExpensas(expensas)` | `"$ 45.000"` o **`null`** | Expensas — ver Bloque 3 |

Decisiones documentadas en el archivo:

- **`US$` para dólares, `$` para pesos.** Desambigua sin depender del contexto.
- **Sufijo `ARS`/`USD` y no "Pesos"/"Dólares".** Son simétricos (uno no queda más
  largo que el otro y descoloca la tarjeta) y coinciden con las etiquetas de los
  checkboxes del formulario, así el admin ve el mismo código que eligió.
- **`currency` es opcional en las firmas, con fallback a USD.** El backend la
  declara `NOT NULL DEFAULT 'USD'`, pero varias pantallas tipan la propiedad con
  una interfaz local recortada y una respuesta cacheada de antes del deploy
  tampoco la trae. USD es el valor correcto para todo el catálogo histórico, que
  es exactamente lo que esas respuestas contienen.

### Los 9 call-sites migrados

| Archivo | Qué muestra |
|---|---|
| `modules/landing/components/FeaturedPropertyCard.tsx` | Destacadas de la landing |
| `modules/properties/components/PropertyCard.tsx` | Catálogo, vista grilla |
| `modules/properties/components/PropertyRow.tsx` | Catálogo, vista lista |
| `app/(public)/properties/[id]/PropertyDetail.tsx` | Detalle, sidebar de precio |
| `app/(public)/properties/[id]/page.tsx` | **OpenGraph del detalle** |
| `app/ficha/[id]/FichaContent.tsx` | Ficha compartible |
| `app/ficha/[id]/page.tsx` | **OpenGraph de la ficha** |
| `app/(private)/dashboard/favoritos/page.tsx` | Mis favoritos |
| `app/(admin)/dashboardAdmin/propiedades/page.tsx` | Listado del admin |

En el listado del admin se agregó el código de moneda donde antes solo había un
número: el ícono `DollarSign` es genérico de "plata" y no distingue ARS de USD,
así que sin eso el admin no podía saber en qué moneda estaba cada fila de su
propio panel.

### `PropertyForm.tsx` — los dos checkboxes

Son **checkboxes visualmente** (así se pidió) pero **mutuamente excluyentes**:
`set('currency', value)` **pisa** el valor, no lo togglea, así que tildar uno
destilda el otro sin ninguna lógica extra. Un toggle real permitiría dejar los
dos tildados —o ninguno— y mandar un valor inválido al backend; una propiedad no
puede tener dos monedas.

Llevan `role="radiogroup"` + `role="radio"` + `aria-checked`: para un lector de
pantalla esto **es** un grupo de opciones excluyentes aunque se dibuje con
cuadraditos. Sin eso se anunciarían como casillas independientes.

Detalles del bloque de Precio:
- El input de precio **dejó de ocupar todo el ancho** y comparte fila con la
  moneda: el monto sin la moneda no dice nada, y verlos juntos evita cargar
  `85000` pensando en dólares con "Pesos" tildado.
- El **símbolo del input sigue a la moneda elegida** (`$` / `US$`), el label
  cambia (`Precio (ARS)` / `Precio (USD)`) y el placeholder también
  (`Ej: 45000000` / `Ej: 85000`). Mostrar "US$" con "Pesos" tildado sería que el
  formulario se contradiga a sí mismo.
- **Alta:** arranca en `'USD'`, igual que el default del backend.
- **Edición:** `data.currency ?? 'USD'` — la moneda guardada manda, y se puede
  cambiar en los dos sentidos.

---

## Bloque 2 — Reordenar imágenes por drag & drop

### La decisión estructural: la portada ES la primera

Antes había **dos controles que podían contradecirse**: la estrella de "portada"
(`isCover`) y el orden implícito de la galería. Con un campo de orden real eso se
vuelve un bug visible — la portada podía quedar 4ª y el catálogo mostraría una
foto distinta de la que abre el detalle.

Ahora hay **un solo concepto**: se arrastra, y la primera de la fila es la
portada. El backend garantiza la invariante `order === 0` ⇔ `isCover`. **El botón
⭐ desapareció del formulario** — la portada pasó a ser un dato derivado de la
posición, y un dato derivado no se puede desincronizar.

### `PropertyForm.tsx` — una sola lista en vez de dos

`existingImages` + `newImages` (dos estados separados, con `isCover` a mantener
sincronizado a mano entre ambos) se reemplazaron por un único `gallery` de
`GalleryItem`:

```ts
type GalleryItem =
  | { kind: 'existing'; key: string; id: number; url: string }
  | { kind: 'new';      key: string; file: File; preview: string };
```

Motivo: el admin tiene que poder arrastrar una foto **nueva delante de una
vieja**, y dos listas separadas no pueden representar ese orden intercalado.

Efecto colateral bueno: `removeAt()` ya no recalcula portada (era la parte más
enredada del código anterior — cuatro ramas para reasignar `isCover` entre las
dos listas). Si se borra la primera, la que ocupa su lugar pasa a serlo sola.

### Drag & drop: API nativa, **sin dependencia nueva**

`draggable` + `onDragStart`/`onDragOver`/`onDrop`/`onDragEnd`. **No hizo falta
`@dnd-kit` ni ninguna otra librería**, y por eso no se preguntó: con un máximo de
10 miniaturas en una grilla, la experiencia nativa alcanza y `@dnd-kit` habría
sumado ~30 kB al bundle del panel admin.

Tres trampas resueltas, todas documentadas en el código:

1. **`draggable={false}` en el `<img>`.** Sin eso el navegador arrastra la
   *imagen* en vez del contenedor, y el `dragstart` del `<div>` nunca llega.
2. **`e.dataTransfer.setData('text/plain', ...)` en `dragStart`.** Firefox no
   inicia el arrastre si no hay datos seteados. El valor no se usa (el índice
   vive en el estado).
3. **La zona de subida ahora filtra por `e.dataTransfer.types.includes('Files')`.**
   Sin ese chequeo, pasar una miniatura por encima la iluminaba en verde y
   anunciaba "Soltá las imágenes acá", como si fuera a subirse de nuevo.

`moveItem(from, to)` hace `splice` + `splice`, **no un swap**: arrastrar la 5ª al
primer lugar empuja a las otras cuatro una posición, no las intercambia.

Feedback visual: el ítem arrastrado baja a `opacity-40 scale-95`, el destino se
marca con `ring-2 ring-[#0b7a4b]`, la portada lleva `ring-2 ring-amber-400` + su
badge, y **cada miniatura muestra su número de posición**. El número importa
porque la grilla va de 2 a 5 columnas según el ancho: sin él, "cuál es la
tercera" depende del tamaño de la pantalla.

### Cómo se manda el orden

- **Al CREAR: no se manda nada.** Los archivos se suben en el orden de la galería
  y `createMany()` del backend les asigna `order = 0..n-1` en ese mismo orden,
  con la primera como portada. Una llamada menos.
- **Al EDITAR:** después del PATCH se llama a
  `PATCH /property-images/:propertyId/reorder` con `{ imageIds }`.
  El problema a resolver es que **las fotos recién subidas no tienen id** hasta
  que el backend las crea. `persistirOrden()` lo resuelve así: las imágenes de la
  respuesta cuyo id no está en `originalImageIds` son las nuevas, y vienen en el
  orden en que se subieron (`createMany` las inserta en el orden del array y el
  `id` es un SERIAL, así que ordenar por id ascendente reconstruye ese orden).
  Con eso se recorre la galería local y se resuelve cada posición a un id real.
- **Si el reorder falla, NO se revierte nada ni se muestra un error rojo.** La
  propiedad ya se guardó bien; lo único pendiente es el orden. Un `toast.error`
  haría creer que se perdió todo lo editado, así que se usa `toast.warning` con
  el detalle y se sigue. Además la portada ya viajó aparte en `setCoverImageId`,
  justamente como red para este caso.
- **Guarda de seguridad:** si el backend no devolvió tantas imágenes nuevas como
  archivos se mandaron, el mapeo posición→id no es confiable y **no se manda
  nada**, en vez de aplicar un orden adivinado que dejaría fotos al azar.

### El `sort` local del detalle y de la ficha: eliminado

`PropertyDetail.tsx` y `FichaContent.tsx` reordenaban las imágenes en el cliente
por `isCover`. Se sacó en los dos: el backend ya las devuelve ordenadas y
reordenar acá pisaba la decisión del admin.

Además **el comparador del detalle estaba mal**:

```ts
(a, b) => a.isCover ? -1 : b.isCover ? 1 : 0   // ❌
```

No define un orden consistente (para dos imágenes sin portada devolvía 0 pero
comparaba sólo contra `a`), así que el resultado dependía del algoritmo interno
de `Array.prototype.sort`. Era un bug latente incluso antes de esta tanda.

---

## Bloque 3 — Expensas y Apto Mascotas

### `PropertyForm.tsx`

- **"Expensas (opcional)"** en la sección de **Precio**, no en Características:
  es plata, no una característica edilicia. Ocupa la fila entera debajo del par
  precio/moneda. Símbolo `$` **siempre**, con el hint "Monto mensual. Siempre en
  pesos, aunque el precio esté en dólares."
- **"Apto mascotas"** junto a los checkboxes ya existentes de
  Escritura / Tracto abreviado / Boleto / Garage / Patio, **mismo estilo visual**
  (entra en el mismo `.map()`, no es un caso especial).
- Campo vacío → se manda **`null`**, no `0`. Son cosas distintas ("no
  informadas" vs "no tiene expensas") y en el PATCH mandar `null` explícito es la
  **única** forma de borrar unas expensas ya cargadas: omitir el campo las
  dejaría intactas.
- Al cargar en edición: `data.expensas != null ? String(...) : ''` y **no**
  `data.expensas || ''` — con `||` el valor `0` (que es válido) se perdería y el
  input quedaría vacío como si nunca se hubiera cargado.

### Detalle de la propiedad

- **Expensas** entra como 6ª tarjeta de "Características", junto a Habitaciones /
  Baños / Sup. Total / Sup. Cubierta / Antigüedad, con ícono `Receipt`.
  **Sólo si tiene valor**: `formatExpensas()` devuelve `null` cuando viene vacío
  y un `.filter()` descarta la tarjeta. No se muestra "Expensas: —" — ocuparía
  una celda para no decir nada, y en una casa (que nunca tiene expensas)
  aparecería siempre. Mismo criterio en la lista "Resumen" del sidebar.
- **Apto Mascotas** entra en "Comodidades y documentación" con ícono `PawPrint`,
  en el mismo `.map()` que el resto.

### Rediseño de "Comodidades y documentación" — contraste

**El problema reportado:** de un vistazo la grilla se leía como seis tarjetas
iguales. Lo que tiene y lo que no se distinguían por un ícono chico (✓ vs ✗) y
por un verde muy suave (`brand-700/25` + `brand-50`) contra un gris casi idéntico
(`ink-100` + `surface-mint`). Había que ir ítem por ítem.

**Ahora el color hace todo el trabajo y el ícono sólo confirma:**

| Estado | Borde | Fondo | Texto | Pastilla del ícono |
|---|---|---|---|---|
| **Tiene** | `border-brand-800` (verde de marca, un paso más oscuro que el `brand-700` histórico) | `bg-brand-50` | `text-brand-900` | `bg-brand-800` |
| **No tiene** | `border-red-600` | `bg-red-50` | `text-red-800` | `bg-red-600` |

Los dos bordes son **finitos** (1px, el `border` por defecto de Tailwind, no
`border-2`): se notan por saturación, no por grosor. Un borde grueso convertiría
la grilla en un tablero de ajedrez.

⚠️ **El rojo NO significa "error"**: significa "esta propiedad no lo incluye",
que es justamente el dato que el visitante viene a buscar. Para que el color no
sea el único portador de la información (WCAG 1.4.1), cada tarjeta lleva además
un `title` explícito ("Esta propiedad tiene: Cochera" / "Esta propiedad NO tiene:
Cochera") y conserva el ✓/✗, así que quien no distingue rojo de verde sigue
teniendo dos señales redundantes.

### Filtro de expensas en el modal

`FiltersModal.tsx`, sub-sección "Presupuesto y superficie": **"Expensas mín." y
"Expensas máx."** como par, **justo encima** del input de Antigüedad, con el
mismo componente `IconNumber` que el resto. Ícono `Receipt` para diferenciarlas
del `DollarSign` del precio, que sí depende de la moneda.

Cadena completa, no sólo el input: `PropertyFilters` (interfaz),
`usePropertyFilters` (lectura de la URL **y** `FILTERS_THAT_RESET_PAGE`, si no un
cambio de expensas dejaría al usuario en la página 7 de un resultado de 2
páginas), `EMPTY_NUMS`, el borrador del modal, el conteo en vivo, y los **chips
de filtros activos** de `CatalogFilterBar`. El label del chip dice "Expensas
desde/hasta $X" y no sólo el monto, para que no se confunda con los chips de
precio, que usan el mismo símbolo `$`.

⚠️ **"Expensas máx." incluye a propósito las propiedades sin expensas
cargadas.** Quien pone un tope de gasto mensual quiere ver también las que no
pagan nada — esconderlas sería lo contrario de lo que pidió. "Expensas mín." sí
las excluye. La asimetría está implementada en el backend
(`p.expensas IS NULL OR p.expensas <= :max`) y documentada en `API_CONTRACT.md` §5.

### Ficha compartible (`/ficha/:id`)

Es un "espejo completo de la propiedad" por diseño, así que se sumaron los tres
datos nuevos: la moneda del precio, **Apto mascotas** (la fila de booleanos pasó
de `sm:grid-cols-2` a `sm:grid-cols-3`) y **Expensas** como 6ª spec. Se actualizó
el docstring de cabecera que enumera los campos representados, y se anotó la
única excepción a "no se oculta nada": `expensas` no se renderiza cuando es
`null`, porque en una ficha que se le manda a un cliente un "Expensas: —" se lee
como un dato faltante, no como "no aplica".

---

## Estado

`npx tsc --noEmit` sin errores · `npx eslint` sin warnings en los archivos
tocados · `npm run build` exit 0.

⚠️ **Verificación pendiente:** esta tanda se validó con build y typecheck, **no
en el navegador contra el backend real** — a diferencia de las PARTES 10 y 11.
Las tres migraciones del backend tampoco se corrieron todavía contra una base con
datos. Falta probar a mano, como mínimo: crear una propiedad en pesos, editar una
de USD a ARS y al revés, reordenar una galería mixta (fotos viejas + nuevas) y
confirmar el orden en el detalle, y cargar/borrar expensas.

## Anotado, NO aplicado

- **No hay filtro por "Apto Mascotas"** en el modal. El pedido lo puso junto a
  Cochera/Patio/Escritura del **detalle** y del **formulario**, no en los
  "Adicionales" del filtro. Agregarlo es una línea en el `.map()` de
  `FiltersModal` más el campo en el DTO del backend, si se quiere.
- **`BoolRow` de la ficha conserva el verde/gris viejo.** El rediseño de
  contraste se pidió puntualmente para la página de detalle. La ficha tiene el
  mismo problema de legibilidad y sería el mismo cambio de clases.

---

# PARTE 13 — Bug de caché tras editar + pulido visual del detalle

> Sesión 2026-08-08 (segunda tanda). **Todo verificado contra la app corriendo
> de verdad**: backend NestJS en `:3000` + Postgres real + frontend en modo
> PRODUCCIÓN (`next start`) en `:3001` con `BACKEND_URL` apuntando al backend.
> No alcanza con `npm run dev` para esta tanda: el bug del Bloque 1 es de
> cachés que en desarrollo **no existen**.

---

## Bloque 1 — 🔴 Los cambios no se reflejaban tras editar una propiedad

### Diagnóstico: dos de las tres hipótesis del reporte eran incorrectas

Se verificaron una por una antes de tocar código.

**❌ "¿La página usa `fetch` con el caché por defecto de Next?"** — No. Un grep
sobre todo `src/` devuelve **cero llamadas a `fetch()`**: absolutamente toda la
data pasa por la instancia única de axios (`shared/lib/axios.ts`). Esto importa
porque descarta de plano dos "fixes" que suenan obvios y no habrían hecho
**nada**: `{ cache: 'no-store' }` y `revalidateTag` son funcionalidades del
`fetch()` instrumentado de Next. Sin `fetch` no hay Data Cache que invalidar.

**❌ "¿Hay algún `revalidate` configurado?"** — Sí, pero no donde se sospechaba.
Sólo la landing tiene `export const revalidate = 300`. `/properties` y
`/properties/[id]` no tienen ninguna directiva.

**✅ "¿El formulario invalida algo al guardar?"** — No, nada. Cero
`revalidatePath`, cero `revalidateTag`, cero `router.refresh()` en todo el
repositorio. El `handleSubmit` hacía `router.push()` y listo.

### Lo que decía el build, que es la evidencia dura

```
┌ ○ /                    Revalidate 5m   ← estática con ISR
├ ƒ /properties                          ← dinámica
├ ƒ /properties/[id]                     ← dinámica
```

Eso parte el problema en **dos bugs distintos con dos cachés distintas**:

| Caché | A quién afecta | Síntoma |
|---|---|---|
| **Full Route Cache** (servidor) | Sólo `/` (ISR 5 min) | Las Destacadas quedaban viejas hasta 5 minutos **para todos los visitantes**, no sólo para el admin |
| **Router Cache** (cliente) | `/properties` y `/properties/:id` | Next reutiliza el payload RSC en memoria al navegar dentro de la SPA — el admin guardaba, navegaba, y veía lo viejo hasta apretar F5 |

### El bug, REPRODUCIDO en vivo

Con la app corriendo, propiedad real (id 6), título original `"Prueba"`:

1. `PATCH /properties/6` → título `"Prueba CACHE 190344"`. La API ya devuelve el
   nuevo valor.
2. Sin revalidar nada, se piden las tres vistas:

   | Vista | Mostraba |
   |---|---|
   | `/` (Destacadas) | **`Prueba`** ← 🔴 viejo |
   | `/properties` | `Prueba CACHE 190344` ✅ |
   | `/properties/6` | `Prueba CACHE 190344` ✅ |

**Hallazgo que corrige el reporte original:** del lado del **servidor**, el
detalle y el catálogo SÍ se re-renderizaban bien (son dinámicos). El único que
quedaba viejo server-side era la landing. Lo que hacía ver datos viejos en el
detalle es el **Router Cache del cliente**, que sólo se manifiesta navegando
como SPA — no se puede reproducir con `curl`, porque cada `curl` es una carga
completa.

### El fix — `modules/properties/actions/revalidate-properties.ts` (NUEVO)

Una **Server Action** que llama a `revalidatePath('/')`, `'/properties'`,
`/properties/:id` y `/ficha/:id`.

**Por qué una Server Action y no un Route Handler:** es el único mecanismo que
alcanza **las dos** cachés. `revalidatePath` por sí solo purga la del servidor;
invocado **dentro de una Server Action**, la respuesta además le ordena al
navegador purgar su Router Cache. Un endpoint normal no puede hacer eso.

⚠️ **Y hay una razón extra, específica de este repo, para NO usar un Route
Handler:** `next.config.ts` tiene un rewrite `/api/:path*` → backend. Un
`app/api/revalidate/route.ts` quedaría *shadoweando* ese proxy (las rutas del
filesystem ganan sobre los rewrites `afterFiles`), y el día que el backend
expusiera un `/revalidate` dejaría de ser alcanzable. Las Server Actions no
tienen URL propia — POSTean a la página actual — así que no hay colisión posible.

Se llama desde dos lugares:
- `PropertyForm.tsx`, tras un PATCH/POST exitoso, **con `await` y antes del
  `router.push`**: si se navegara primero, la página destino podría montarse
  leyendo todavía la versión cacheada. Al crear se usa el `id` que devuelve el
  backend.
- `dashboardAdmin/propiedades/page.tsx`, tras un DELETE. **No estaba en el
  pedido**, pero es exactamente el mismo bug: una propiedad ya eliminada seguía
  apareciendo en el catálogo y en las Destacadas. Ahí se llama sin `propertyId`
  (la propiedad ya no existe; revalidar su detalle sólo forzaría un 404).

Un fallo de la revalidación **no rompe el guardado**, que ya sucedió: se avisa
con `toast.warning` y se sigue. Tirar un error haría creer que se perdió todo lo
editado.

**Sobre `router.refresh()`** (que el pedido planteaba evaluar): se descartó por
redundante. `revalidatePath` dentro de una Server Action ya purga el Router
Cache del cliente, y el destino del `push` (`/dashboardAdmin/propiedades`) es una
ruta estática que trae sus datos por axios en un `useEffect` — se refresca sola
al montar. Agregarlo sería una llamada que no hace nada.

**Sobre exponer la acción sin guard de sesión:** está documentado en el archivo.
No muta datos, no lee nada y no devuelve información: sólo marca páginas como
"volver a renderizar". Su peor caso es equivalente a que alguien pida esas
páginas públicas. Un guard con `decodeJwt` —lo único que este frontend puede
hacer sin el secreto— daría sensación de protección sin agregarla.

### Verificación del fix — en vivo, no inferida

3. Se invoca la Server Action (POST con header `Next-Action`, igual que el
   navegador). Respuesta **HTTP 200** con el header:

   ```
   x-action-revalidated: [[],1,0]
   ```

   Ese `1` es la señal que Next manda al cliente para purgar el Router Cache.

4. Se vuelven a pedir las tres vistas:

   | Vista | Mostraba |
   |---|---|
   | `/` (Destacadas) | **`Prueba CACHE 190344`** ✅ ← se corrigió al instante, sin esperar los 5 min |
   | `/properties` | `Prueba CACHE 190344` ✅ |
   | `/properties/6` | `Prueba CACHE 190344` ✅ |

De paso quedó verificado que el middleware protege la acción: invocarla **sin
cookie de sesión** devuelve `307 → /login?callbackUrl=...`.

⚠️ **Lo que NO se pudo verificar automáticamente:** la purga del Router Cache
del cliente en una navegación SPA real (click en `<Link>` sin recarga). Requiere
manejar un navegador con clicks, no `curl`. Está cubierta por el header
`x-action-revalidated` y por el mecanismo documentado de Next, pero **conviene
confirmarla a mano**: editar una propiedad, y desde el panel navegar con clicks
hasta su detalle sin tocar F5.

**Datos de prueba:** se editó la propiedad 6 y **se restauró su título original**
(`"Prueba"`) al terminar. La base quedó como estaba.

---

## Bloque 2 — Chips de Dirección / Barrio / Zona / Localidad

**El problema:** cada píldora apilaba **tres verdes distintos y muy parecidos**
(`surface-mint` de fondo, `brand-700/10` en el círculo del ícono, `brand-700` en
el ícono) más un borde **gris** `ink-100` y un label **gris** `ink-500`. Cuatro
píldoras seguidas con esa mezcla se veían sucias: el círculo apenas se despegaba
del fondo y el gris del borde peleaba con el verde del relleno.

**Ahora:** el mismo par que el resto del rediseño — borde fino `brand-800` sobre
fondo `brand-50`, ícono y valor en verde oscuro, label en `brand-700` (era el
único gris que quedaba y rompía la lectura de la píldora como unidad).

**Hover:** `brand-100`, un paso más oscuro dentro de la **misma** familia. Antes
el hover cambiaba de familia (`surface-mint` → `brand-50`), que era justamente
el salto que se veía poco prolijo.

⚠️ **Corrección tras verlo renderizado:** el primer intento dejó el círculo del
ícono en `brand-800/10`. En el screenshot real quedaba **casi invisible** sobre
el fondo `brand-50`. Se cambió a **pastilla blanca con el ícono en verde
oscuro**: el blanco lo recorta contra el verde clarito sin agregar peso. Se
eligió blanco y no un disco sólido verde (como sí llevan las tarjetas de
Características) porque el círculo mide 32px y cuatro discos oscuros seguidos en
una misma fila pesaban más que el propio dato de ubicación.

---

## Bloque 3 — Tarjetas de "Características"

Eran las **únicas grises** de toda la ficha (borde `ink-100`, fondo
`surface-mint`, valor `ink-900`, label `ink-500`), y caían inmediatamente arriba
de las de Comodidades, que ya estaban en verde: se leían como dos componentes de
sistemas de diseño distintos pegados uno abajo del otro.

Ahora usan el mismo par que Comodidades: borde fino `brand-800`, fondo
`brand-50`, valor `brand-900`, label `brand-700`. Aplica a Habitaciones, Baños,
Sup. Total, Sup. Cubierta, Antigüedad **y Expensas**.

El valor sigue siendo el dato protagonista por **tamaño y peso** (`text-lg
font-bold` contra 10px), no por ser el único con color. Se conserva el hover con
elevación y sombra, pero el fondo pasa a `brand-100` en vez de saltar de gris a
verde.

⚠️ **Corrección tras verlo renderizado:** igual que en el Bloque 2, el círculo
del ícono había quedado en `brand-800/10` y era invisible. Se pasó a **círculo
sólido `brand-800` con el ícono en blanco — idéntico al de Comodidades**, que
era literalmente lo que se pedía ("unificá el estilo con el de Comodidades").
Con el tintado al 10% las dos secciones seguían sin parecerse, que era el
problema a resolver.

---

## Bloque 4 — Sidebar "Resumen" y foto del agente

### Resumen

Era una lista de renglones planos: label gris, valor gris más oscuro, separados
por una línea `ink-100` casi invisible. Con 10 filas del mismo peso, la vista
resbalaba y costaba seguir un renglón de punta a punta.

1. **Filas alternadas** (`odd:bg-brand-50/60`) — es lo que permite saltar de una
   fila a otra sin perderse en horizontal. Se usa el verde de marca **al 60%** y
   no un gris: un `ink-50` metería una cuarta familia de color en una ficha ya
   unificada en verde. Va muy diluido a propósito: la alternancia tiene que
   *sentirse*, no verse.
2. **Se eliminan los separadores.** Con bandas alternadas la línea divisoria es
   redundante y ensucia (dos señales para lo mismo). Antes era la única señal, y
   era demasiado débil.
3. **Label a `brand-700`, valor a `brand-900`** — mismo criterio que el resto.

El `space-y-1` se reemplaza por padding dentro de cada fila: con bandas de fondo,
el aire tiene que ir **dentro** de la banda, si no las franjas quedan flotando.
Se compensa con `-mx-2` + `overflow-hidden rounded-xl` para que las bandas se
extiendan más allá del texto sin desbordar la tarjeta.

### Foto del agente

El aro pasó de `brand-200` a **`brand-800`**. El verde claro casi no se
distinguía del blanco de la tarjeta, así que el recorte circular se perdía y la
foto parecía flotar. El `ring-offset-2` blanco se mantiene: es lo que evita que
el aro se pegue a la foto.

---

## Bloque 5 — 🔍 Imágenes pixeladas: diagnóstico y fix

Las tres hipótesis del pedido se probaron **contra datos reales** (propiedad 6,
5 imágenes en Cloudinary).

**❌ ¿Transformación de Cloudinary con calidad reducida?** No. Las URLs que
guarda el backend son limpias:
`https://res.cloudinary.com/.../image/upload/v1785980575/properties/xxx.png` —
sin `q_auto:low`, sin `w_`, sin ninguna transformación.

**❌ ¿Se está usando una miniatura en vez del original?** No. Se descargaron las
5 imágenes y se midieron: **1536×1024 px, ~2.5 MB cada una**. Es la URL original
y la fuente es de sobra para el tamaño en pantalla.

**✅ La causa real: `next/image` recodifica a WebP con `quality` por defecto = 75.**

Medido sobre una imagen real, recortando **la misma región** (640×400 px) y
comparándola píxel a píxel contra el original:

| quality | peso WebP | error medio/canal | pico |
|---|---|---|---|
| **75** (lo que había) | 170 KB | 3.58/255 | 90 |
| 80 | 207 KB | 3.28/255 | 87 |
| **85** (elegido) | 252 KB | 2.98/255 | 85 |
| 90 | 323 KB | 2.71/255 | 90 |

*(original PNG: 2667 KB)*

Los recortes se decodificaron con `sharp` y se compararon **a ojo**, no sólo por
número: a q=75 se emborronan las líneas del revestimiento horizontal, los
travesaños de las ventanas y la textura de las tejas — contenido de arquitectura,
justo el tipo de detalle fino que WebP a calidad media aplana.

**Se eligió `quality={85}`** y no 90 porque visualmente son indistinguibles (los
dos recuperan el detalle que q=75 pierde) y 85 pesa 22% menos. Importa: las 5
fotos de la galería están **todas** en el DOM desde el arranque —el slider las
superpone con `opacity`, no las monta bajo demanda— así que el navegador se las
baja todas y cada KB se multiplica por 5.

### Bonus: `sizes` estaba mal

`sizes="(max-width: 1024px) 100vw, 62vw"`. El `62vw` sólo coincide con el ancho
real en el breakpoint `lg` (1024px). De ahí para arriba la columna **no** sigue
creciendo: el contenedor tiene `max-w-6xl` (1152px), así que la galería se clava
en ~736px, mientras que 62vw de un monitor de 1920 da 1190px. El navegador venía
pidiendo una variante ~60% más grande de la que podía mostrar.

Ahora es `(max-width: 1024px) 100vw, 800px`. Se puso 800 y no 736 a propósito:
con `object-cover` sobre un contenedor de 520px de alto, la imagen (3:2) se
escala por **altura** y se recorta a los costados, así que hacen falta ~780px de
ancho de imagen para cubrirlo.

⚠️ **Limitación conocida que queda:** en mobile (`100vw`) el contenedor es casi
cuadrado (100vw × 420px) y `object-cover` necesita ~1.6× el ancho del viewport,
pero `sizes` sólo puede declarar ancho. En un teléfono de 390px con DPR 3 el
navegador pide ~1200px cuando le vendrían bien ~1900. Se dejó así en vez de
poner un `170vw` (legal pero críptico): con q=85 la diferencia ya no se nota, y
forzar la variante de 1536px en cada visita desde el celular es peor negocio.

### Verificación visual

Screenshot de `/properties/6` con Chrome headless contra el build de producción:
la galería muestra nítidos los travesaños de las ventanas, las líneas del
revestimiento y los ladrillos de la chimenea.

⚠️ Para capturar la columna izquierda hubo que pasarle
`--force-prefers-reduced-motion` a Chrome: los componentes envueltos en
`<Reveal>` usan `whileInView` de framer-motion y en headless se quedan en
`opacity: 0`. **No es un bug de la página** — es un artefacto del entorno
headless. Vale anotarlo para la próxima vez que alguien saque screenshots
automatizados de este proyecto.

---

## Estado

`npx tsc --noEmit` sin errores · `npm run build` exit 0 · verificado contra la
app corriendo (backend + Postgres + front en modo producción).

## Anotado, NO aplicado

- **Las tarjetas del catálogo (`PropertyCard`, `PropertyRow`,
  `FeaturedPropertyCard`) siguen con `quality` por defecto (75).** El pedido
  acotaba el problema al detalle, y ahí las imágenes se muestran mucho más
  chicas (240px de alto), donde los artefactos de q=75 casi no se ven. Si se
  quisiera unificar, es agregar `quality={85}` en esos tres componentes.
- **Los thumbnails de la galería** (`sizes="64px"`) también quedaron en q=75. A
  48×64 px la diferencia no es perceptible.

---

# PARTE 14 — Notificaciones, sidebars y banner de los dos dashboards

> Sesión 2026-08-08 (tercera tanda). Dos pedidos que se solapaban —uno para el
> panel de admin y otro para el dashboard de usuario— resueltos juntos porque
> tres de sus puntos eran el MISMO cambio en los dos lados.
>
> **Verificado contra la app corriendo**: backend NestJS `:3000` + Postgres real
> + frontend en modo PRODUCCIÓN (`next start`) `:3001`, con sesión de admin real
> inyectada en Chrome headless por CDP. Las capturas de un panel detrás de un
> guard de cliente salen en blanco sin cookie, así que no alcanzaba con navegar.

## Piezas nuevas compartidas

### `modules/shared/ui/notifIndicators.tsx` (NUEVO)

Los dos indicadores de la sección Notificaciones, juntos y fuera de
`dashboard/` y `dashboardAdmin/` porque los usan las dos áreas. Antes cada
archivo dibujaba su badge a mano con clases levemente distintas (`h-4.5` en un
lado, `h-4` en otro, rojo en tres lugares).

| Pieza | Qué dice | Dónde va |
|---|---|---|
| `PulseDot` | "esta notificación está sin leer" | esquina de UNA tarjeta |
| `NotifCountBadge` | "esta categoría tiene N sin leer" | un tab o un ítem del sidebar |

⚠️ Ambos son **exclusivos de Notificaciones**. El punto titilante es una señal
fuerte y pierde todo su valor si aparece en media aplicación.

### `dashboard/notificaciones/notifShared.ts` (NUEVO)

La clasificación del lado usuario (`getNotifType` + tipos) vivía dentro de
`page.tsx`. Se extrajo porque el sidebar pasó a mostrar un badge por categoría y
**tiene que contar con el mismo criterio con el que la pantalla después
filtra** — si no, el badge dice "3" y al entrar aparecen 2. Ese error exacto ya
había pasado en el panel de admin (el layout tenía su propia copia con reglas
distintas), y su solución fue el `notifShared` de allá; este es el equivalente.

Suma `contarSinLeer(notifs)`, que devuelve el desglose por categoría y lo
consumen **el sidebar y la pantalla**, así no pueden divergir.

---

## 1) Punto verde titilante en las tarjetas de notificación *(admin + usuario)*

Es el MISMO indicador que acompaña a "conectado como" en el panel del navbar:
dos capas, un `animate-ping` que se expande y se desvanece (`green-400`) sobre
un núcleo sólido (`green-500`). Se replicó el patrón exacto —no un
`animate-pulse`, que sólo cambia la opacidad de un círculo— para que el sitio
tenga un solo lenguaje de "esto es nuevo".

Reemplaza al punto **estático** que había dentro del bloque de texto y que
tomaba el color de la categoría (`cfg.dot`): en una tarjeta rosa de "Favorito",
un punto rosa se leía como decoración, no como estado.

Único cambio respecto del navbar: 8px en vez de 6px. Ahí el punto va pegado a un
texto que lo contextualiza; acá está solo en la esquina de una tarjeta ancha y a
6px no se registraba.

Detalles de implementación:
- Va **dentro** de los límites de la tarjeta (`top-3 right-3`): la del usuario
  tiene `overflow-hidden` por la barra de acento lateral, y cualquier cosa que
  asome fuera del borde se recorta.
- La tarjeta del admin no era `relative`; se le agregó.
- El bloque del título lleva `pr-4` para que un título largo no le pase por
  debajo al punto.
- El tab "Todas" no lleva punto ni badge (ya no lo llevaba: su `count` era
  `null`; ahora está garantizado por construcción).

### 🐛 Bug propio, encontrado al verificar

La primera versión de `PulseDot` era **un solo `<span>`** con `relative` fijo más
el `className` del caller concatenado. Al pasarle `absolute top-3 right-3`, el
punto aparecía **a la izquierda** de la tarjeta.

No se detectó mirando la captura (el punto es chico y el ojo lo da por bueno):
se detectó consultando el DOM real por CDP, que devolvió `left: 329` — el borde
izquierdo del área de contenido — en vez de la esquina derecha.

La causa es la trampa que este repo **ya tiene documentada**: no se usa
`tailwind-merge`, así que `relative` y `absolute` (la misma propiedad CSS)
conviven en el atributo y **gana el orden del stylesheet generado, no el del
string**. Tailwind emite `.relative` después de `.absolute`, así que ganaba
`relative` siempre.

Arreglado partiendo el componente en dos spans: el de afuera es sólo
posicionamiento y lo controla el caller; el de adentro es el `relative` que le
sirve de ancla al anillo. Cada span tiene una única declaración de `position` y
el conflicto es imposible.

**Verificado después del fix**, otra vez contra el DOM: `position: absolute`,
a 13px exactos del borde superior y derecho de la tarjeta.

---

## 2) Badges numéricos: verdes y en todas las categorías *(admin + usuario)*

**Por qué verde y no rojo.** Estaban en `bg-red-500` en los tres lugares donde
aparecían. El rojo en este sistema ya significa otra cosa —error, "no tiene",
eliminar— y una campanita con un número rojo se lee como "algo salió mal" cuando
en realidad dice "tenés cosas nuevas".

**De total a pendientes.** Los tabs mostraban el total de la categoría, leídas
incluidas, así que el número no bajaba nunca al ir leyendo y no servía para
saber qué falta mirar. Ahora todos cuentan **sin leer**, y a 0 el badge
desaparece — la regla vive dentro de `NotifCountBadge` (devuelve `null`) y no
repetida en los nueve call-sites.

**Cobertura.** Tabs y subítems del sidebar, en las dos áreas. Se agregaron los
que faltaban del lado usuario (Publicaciones, Respuestas).

**`onDark`.** Sobre un fondo ya verde (tab activo, ítem de sidebar seleccionado)
un badge verde es invisible; ahí se invierte a blanco translúcido. No es una
excepción al "todos verdes": es lo que hace que el número siga siendo legible.

### Dos decisiones que van más allá del pedido literal

1. **"Todas" tampoco lleva badge en el sidebar**, no sólo en la fila de tabs. Su
   número es el mismo que el de la cabecera del grupo, justo arriba: repetido
   dos veces en la misma columna hacía dudar de si eran dos contadores
   distintos.
2. **Se quitaron los badges de Solicitudes y Usuarios del sidebar admin.** El
   pedido decía "no en otras secciones del sidebar como Usuarios o Solicitudes";
   esos badges mostraban el conteo de *notificaciones sin leer* de su tema, no
   la cantidad de solicitudes o usuarios pendientes. Un número de notificaciones
   colgado de otra sección se lee como "hay 3 solicitudes nuevas" cuando dice
   "hay 3 avisos sin leer". El contador queda donde corresponde.

---

## 3) 🐛 BUG — Todas las subsecciones del sidebar salían resaltadas *(admin + usuario)*

### La causa

Los dos layouts calculaban el resaltado **tirando la query string a la basura**:

```ts
// admin
pathname.startsWith(item.href.split('?')[0])
// usuario
pathname === item.href.split('?')[0]
```

Los seis subítems de Notificaciones del usuario apuntan todos a
`/dashboard/notificaciones` y sólo se distinguen por `?tipo=`. Al colapsarlos al
mismo pathname, la condición daba `true` para los seis **a la vez**. Idéntico en
el admin con Solicitudes (`?estado=`) y Usuarios (`?rol=`).

### El fix

`useCurrentHref()` arma la URL actual completa (`pathname` + query) y la compara
contra el `href` del ítem, con los parámetros **ordenados** para que `?a=1&b=2` y
`?b=2&a=1` —la misma pantalla— no cuenten como distintas.

`isItemActive()` resuelve tres casos: ítem con query propia → sólo con esa query
exacta; `exact` → pathname exacto y sin query (así
`/solicitudes?estado=aceptado` no enciende también "Todas"); resto → prefijo de
pathname, que es lo que mantiene iluminado "Todos los usuarios" cuando estás en
`/usuarios/7`.

⚠️ Esto mete `useSearchParams()` en los dos **layouts**, que envuelven rutas
prerenderizadas. Se verificó en el build que **ninguna ruta se volvió dinámica**:
las 20 pantallas de dashboard siguen marcadas `○ Static`.

### Verificado en vivo

| Pantalla | Antes | Ahora |
|---|---|---|
| `/dashboard/notificaciones?tipo=precios` | los 6 subítems resaltados | sólo "Bajaron de precio" |
| `/dashboardAdmin/solicitudes?estado=aceptado` | los 4 resaltados | sólo "Aceptadas" |
| `/dashboardAdmin/propiedades` | — | sólo "Gestionar propiedades" |

---

## 4) Separador vertical en "Gestionar propiedades" *(admin)*

Las acciones quedaban pegadas a los datos y la fila se leía como un bloque
continuo. Se agrega `sm:border-l` + `sm:pl-4` + `sm:self-stretch`.

Es la MISMA línea que ya existía como `border-t` horizontal en mobile, rotada:
en mobile las acciones van debajo (separador arriba), en desktop al costado
(separador a la izquierda). Por eso los dos bordes son excluyentes
(`sm:border-t-0`), no se suman.

## 5) Acción "Ver propiedad" *(admin)*

Abre el detalle público (`/properties/:id`), tal cual lo ve un visitante. Es
**distinto** de "Enviar" y WhatsApp, que comparten la FICHA (`/ficha/:id`, la
hoja de datos para mandarle a un cliente) — vale aclararlo porque los tres
"comparten un link" y es fácil confundirlos.

- **Sólo ícono** (`Eye`), como WhatsApp: la fila ya tenía cuatro acciones y un
  quinto botón con texto la desbordaba a un segundo renglón en pantallas
  medianas. `title` + `aria-label` cubren lo que no dice el ícono.
- **Entre WhatsApp y Editar**, para que el grupo quede "compartir / ver" y
  después "modificar / borrar".
- **`target="_blank"`**: el admin está trabajando en su listado, muchas veces a
  mitad de una tanda de ediciones, y mandarlo al sitio público en la misma
  pestaña le hace perder el scroll y los filtros.

## 6) Se quitó "Vista de Usuario" del panel admin

⚠️ **Revierte una decisión que `CLAUDE.md` documentaba como deliberada** ("hay
context-switcher explícito en los dos sentidos… fue una decisión, no un
olvido"). Ese documento se actualizó.

El camino de vuelta **se conserva**: `dashboard/layout.tsx` sigue mostrando
"Panel Admin" si el usuario es admin. Sin eso, un admin que llegue a
`/dashboard` por un link directo quedaría sin salida hacia su panel.

## 7) Se eliminó el "Preferencias" duplicado *(usuario)*

Había dos accesos a `/dashboard/preferencias`: un grupo desplegable encima de
Notificaciones y el ítem de la sección CUENTA. Se eliminó el de arriba.

**Nada queda huérfano**, verificado: el link que se perdía era `?nueva=1` (abre
el formulario ya desplegado), y la propia pantalla de preferencias tiene su
botón de editar (`onEdit={() => setShowForm(true)}`) y además abre el formulario
sola cuando el usuario todavía no cargó ninguna preferencia.

## 8) Banner del dashboard de usuario *(usuario)*

Era la foto con un `bg-black/50` plano y el saludo centrado: el velo negro
uniforme apagaba la imagen entera sin mejorar la lectura en ningún lado en
particular, y el texto flotaba sin relación con la tarjeta de perfil de abajo.

1. **Velo en gradiente y en verde, no negro plano.** De `brand-950` opaco abajo
   a casi transparente arriba: la parte alta de la foto se ve, y la baja —donde
   apoya el texto y se solapa la tarjeta— queda bien oscura. El verde integra el
   banner con el panel; el negro puro era el único gris frío de la pantalla.
2. **Texto a la izquierda y anclado abajo.** Centrado competía con la tarjeta de
   perfil, que también está centrada en mobile. Alineado arma una diagonal de
   lectura (saludo → tarjeta → accesos) en vez de tres bloques centrados.
3. **Jerarquía tipográfica real.** Eyebrow chico en mayúsculas (el recurso de
   `SectionHeading` de la landing), el nombre en la fuente de títulos de la
   marca —que en el panel no se usaba en ningún lado— y la bajada en peso menor.
4. **`drop-shadow` en el texto**, no sólo el velo: con fotos claras el blanco
   sobre blanco se perdía.

⚠️ La fuente de títulos se aplica con `style={{ fontFamily: 'var(--font-heading)' }}`
y **no** con una clase `font-*`: `--font-heading` está declarada en `:root` y
NO dentro del bloque `@theme`, así que Tailwind no genera ninguna utilidad para
ella. Es la misma forma en que la usa `Confianza.tsx`, el único otro lugar del
sitio que la aplica. (Un `font-playfair` escrito por intuición no habría hecho
nada y habría pasado el build sin chistar.)

---

## Estado

`npx tsc --noEmit` sin errores · `npx next lint` **0 warnings, 0 errores** ·
`npm run build` exit 0 · verificado en navegador real con sesión iniciada.

Ninguna ruta cambió de estático a dinámico pese al `useSearchParams` nuevo en
los dos layouts.

## Anotado, NO aplicado

- **`cfg.dot` quedó muerto** en los dos mapas de configuración de notificaciones
  (`notifShared.tsx` del admin y el `getConfig` inline del usuario): ya nadie lo
  lee, porque el punto de color se reemplazó por el `PulseDot` verde. Sacarlo
  son ~16 líneas repartidas en dos archivos, sin ningún efecto visible; se dejó
  para no mezclar limpieza con el cambio funcional.
- **La animación no se puede ver en una captura.** Con
  `--force-prefers-reduced-motion`, Chrome activa el bloque global de
  `prefers-reduced-motion` del sitio y el ping queda en su fotograma final
  (opacidad 0), así que sólo se ve el núcleo verde. Se verificó aparte, con esa
  bandera apagada, que el estilo computado es `ping / 1s / infinite` — el mismo
  que el punto del navbar.

---

# PARTE 15 — Nitidez de la galería: el diagnóstico correcto

> Sesión 2026-08-09. **Corrige el diagnóstico de la PARTE 13**, que era
> incompleto, y resuelve el problema real. Medido contra las **80 imágenes de
> producción**, no contra una propiedad de prueba.

## ⚠️ Por qué el fix de la PARTE 13 no alcanzó

La PARTE 13 concluyó que la causa era `quality={75}` y lo subió a 85. Esa
medición se hizo sobre **una sola propiedad de la base local (id 6), cuyas
imágenes son de 1536x1024 y 2,5 MB** — la única del sistema con fotos buenas.
Generalizar desde ahí fue el error.

Auditadas las 80 imágenes de **producción**:

| Medición | Valor |
|---|---|
| Ancho de origen: mín / mediana / máx | **261** / **720** / 1414 px |
| Ya se amplían en pantalla normal (1x) | **60 de 80** |
| Se amplían en retina (2x) | **80 de 80** |
| Peso típico | 23–130 KB |

La propiedad 8 tiene sus fotos en **261x261 px**. En el visor de 736x520 eso es
una ampliación de **x2,82**. Ninguna configuración de compresión puede
inventar los píxeles que no están en el archivo.

## La comparación pedida: Cloudinary crudo vs next/image

Imagen `id=50` de la propiedad 7 (819x621), contra producción:

| Camino | Peso | Formato | Error vs. original |
|---|---|---|---|
| **Cloudinary crudo** | 129,8 KB | jpeg | — (referencia) |
| next/image `q=75` | 77,4 KB | webp | 2,99 /255 |
| next/image `q=85` (PARTE 13) | 107,1 KB | webp | 2,01 /255 |
| **next/image `q=95`** | 129,8 KB | jpeg | **0,00** |
| Cloudinary `f_auto,q_auto` | 82,1 KB | jpeg | comprime MÁS |

Dos conclusiones que cambian el plan:

1. **A partir de `q=95`, next/image deja de recodificar y devuelve el archivo
   original tal cual** (mismo peso, mismo formato, error 0). La doble
   compresión que se sospechaba **existía** —2,01/255 a q=85— y se elimina por
   completo con un número, sin `unoptimized` (que costaría el `srcset` y el
   lazy loading).
2. **Agregar `f_auto,q_auto` a la URL de Cloudinary habría EMPEORADO la
   imagen**: devuelve 82 KB contra los 130 KB del original. Hoy Cloudinary no
   optimiza nada (las URLs guardadas son `/upload/v123/...` peladas), así que
   nunca hubo dos capas compitiendo: había una sola, la de Next.

### Nota sobre el origen de las fotos — afirmación retirada

En el análisis se dijo que las fotos "venían de WhatsApp", por el tope de 960 px
en el lado largo. **Los metadatos no lo respaldan** y la afirmación se retira:
ninguna imagen tiene marcador de WhatsApp.

Lo que los metadatos **sí** muestran: medidas irregulares (`819x621`, `846x568`,
`612x459`, `464x618`, `261x261`) que no salen de una cámara —una cámara da
`4032x3024` y similares—, `72 dpi` en todas (resolución de pantalla) y EXIF
borrado en casi todas. Es consistente con imágenes guardadas o descargadas desde
una pantalla, pero **no se puede determinar con qué herramienta**.

## El fix: encuadre decidido POR FOTO

`quality={95}` (elimina la doble compresión) **más** una decisión de encuadre
por imagen, en vez de aplicar el mismo `object-fit` a todas.

**La regla**, en `fit()` dentro de `ImageSlider`:

```
ampliacionCover = max(anchoCaja / anchoFoto, altoCaja / altoFoto)
ampliacionCover > 1.15  →  object-contain   (foto entera, nítida)
si no                   →  object-cover     (a sangre, como estaba)
```

`object-cover` obliga a escalar por el lado que **peor** entra; `object-contain`
escala por el otro, que siempre es menor o igual. Para una foto vertical la
diferencia es enorme: de ampliar **x1,59** a **reducir x0,84**.

El umbral de 1,15 deja pasar hasta un 15% de ampliación con `cover`, porque a
ese nivel no se percibe y conviene el encuadre a sangre.

### Reparto real sobre las 80 fotos de producción

| Encuadre | Cantidad |
|---|---|
| Siguen a sangre (`object-cover`) | **45 de 80** |
| Pasan a foto entera (`object-contain`) | **35 de 80** |

Peor caso corregido: `261x261` pasa de ampliarse **x2,82** a **x1,99**. Las
verticales `464x618` y `480x640` pasan de **x1,59 / x1,53** a **reducirse**
(x0,84 / x0,81), o sea de borrosas a nítidas.

### Cómo se miden los píxeles reales

Del `<img>` ya cargado (`naturalWidth/Height`) en `onLoad`, y **no** de la base:
`PropertyImages` no guarda dimensiones y agregarlas implicaba migración +
backfill de 80 filas. Además esto mide lo que el navegador **efectivamente
recibió** —`min(variante pedida, ancho del original)`— que es justo el número
que decide si alcanza.

El tamaño del visor se mide con un `ref` en vez de hardcodear 736x520, para que
la decisión también sea correcta en mobile, donde el hueco es casi cuadrado
(100vw x 420) y por lo tanto mucho más exigente con las verticales.

Mientras la foto no cargó se asume `cover`: es el caso más común (45 de 80) y
evita que la galería arranque con bandas y salte al encuadre definitivo.

### El fondo difuminado

Las bandas que deja `object-contain` se rellenan con una copia ampliada y
borroneada de la misma foto, en vez de dos barras negras. Se pide diminuta
(`sizes="32px"`, `quality={20}`): está desenfocada 24px, así que más resolución
no se vería y sólo sumaría peso. `scale-110` porque `blur` samplea fuera del
elemento y sin agrandarlo se ven los bordes lavados.

## Verificación

Front local en modo producción con `BACKEND_URL` apuntando a la API de
producción, para renderizar **las fotos reales** con el código nuevo, y captura
del sitio en vivo para comparar:

| Propiedad | Fotos | Antes (en vivo) | Ahora |
|---|---|---|---|
| 8 | `261x261` | ampliada x2,82, cartelería ilegible | foto entera, se leen los carteles y las rejas |
| 7 | `819x621` | a sangre | **a sangre igual** (no cambia: no lo necesita) |

## Cambio aparte — orden de los accesos rápidos

En la barra del detalle se intercambiaron **"Ver Valoraciones"** y **"Ver
dirección exacta"**. Orden nuevo: Volver al catálogo · Ver Valoraciones · Ver
Comentarios · Ver dirección exacta.

## Estado

`npx tsc --noEmit` sin errores · `npx next lint` 0 warnings · `npm run build`
exit 0 · verificado con las fotos reales de producción.

## ⚠️ Lo que este fix NO puede hacer

**El techo lo pone el archivo.** Una foto de 261x261 sigue teniendo 261 píxeles:
ahora se aprovechan todos y se ve mucho mejor, pero no va a tener el detalle de
una foto de 2000 px. Para nitidez real en esas propiedades hay que **volver a
subir las fotos en su resolución original**.

## Anotado, NO aplicado

- **Las tarjetas del catálogo** (`PropertyCard`, `PropertyRow`,
  `FeaturedPropertyCard`) siguen en `quality` por defecto (75) y `object-cover`
  fijo. Ahí el recorte uniforme es necesario para que la grilla no se
  desalinee, así que la solución del detalle no se puede trasladar tal cual.
  Subirles la calidad sí es trasladable, si se quiere.
- **Aviso al subir fotos chicas** en el formulario del admin (detectar el ancho
  real al seleccionar el archivo y advertir si es menor a ~1200 px). Ataca la
  causa de raíz; quedó fuera de esta tanda.

---

# PARTE 16 — Calidad de imagen en las tarjetas del catálogo

> Sesión 2026-08-09. Extiende el fix de nitidez de la PARTE 15
> (`quality={95}` en next/image) a las tarjetas del catálogo:
> `PropertyCard` (grid), `PropertyRow` (lista) y `FeaturedPropertyCard`
> (Destacadas de la landing). A diferencia del detalle, acá el recorte
> uniforme (`object-cover`) se mantiene sin cambios — una grilla necesita
> que todas las tarjetas midan lo mismo, y el modo "foto completa + fondo
> difuminado" de la PARTE 15 la desalinearía.

## El cambio

Ninguno de los tres componentes tenía `quality` explícito en su `<Image>`,
así que los tres estaban en el default de Next (**75**) — la misma causa
raíz que en el detalle. Se agregó `quality={95}` a los tres, sin tocar
`sizes`, `object-cover` ni ningún otro comportamiento.

| Componente | Uso | Cambio |
|---|---|---|
| `PropertyCard.tsx` | Catálogo, vista grilla | `quality={95}` |
| `PropertyRow.tsx` | Catálogo, vista lista | `quality={95}` |
| `FeaturedPropertyCard.tsx` | Destacadas de la landing | `quality={95}` |

## Verificación — con matices, no una repetición mecánica del detalle

Se comparó la tarjeta de la propiedad 8 (la de fotos `261x261`, la más
comprometida del catálogo) entre el sitio en producción y el build local
con el fix, mismas coordenadas de recorte. **Visualmente, a tamaño de
tarjeta (~350px), la diferencia es mucho más sutil que en el detalle.**

La causa está en cómo responde next/image cuando el ancho pedido supera al
original: en el detalle (819px de fuente, casilla de 736px) el ancho pedido
es *menor*, así que hay reescalado real y `quality` decide cuántos
artefactos de compresión sobreviven a ese reescalado — ahí la diferencia
es grande. En el catálogo, con fuentes de 261px y anchos pedidos de
384-640px (los breakpoints de Next), el optimizador de imágenes de Next
**no agranda más allá del original** (`withoutEnlargement`): la salida
sigue midiendo 261x261 sin importar qué ancho se pida.

Eso NO vuelve inútil el cambio — sigue habiendo una recompresión de esos
261x261 píxeles, y ahí `quality` importa igual:

| Ancho pedido | q | Salida | Peso |
|---|---|---|---|
| 384 / 640 px | 75 (antes) | 261x261 webp | **15,9 KB** |
| 384 / 640 px | **95 (ahora)** | 261x261 webp | **33,2 KB** |

Más del doble de información conservada en el mismo recuadro de píxeles —
menos artefactos de bloque que el navegador después magnifica al escalar
por CSS (`object-cover`) para llenar la tarjeta. Es una mejora real, pero
de un orden distinto a la del detalle: ahí se pasó de ampliar x2,73 a
reducir x0,54 (una foto distinta); acá se pasa de una compresión con
artefactos a una casi sin pérdida, sobre la MISMA resolución nativa.

⚠️ **Honesto: en una captura de pantalla a tamaño de tarjeta, esta mejora
es difícil de ver a simple vista** — se comprobó comparando los mismos
píxeles recortados de ambas versiones. El techo real para esa propiedad
sigue siendo el mismo que se documentó en la PARTE 15: son 261 píxeles de
origen, y ninguna calidad de compresión agrega detalle que no estaba en el
archivo.

## Estado

`npx tsc --noEmit` sin errores · `npx next lint` 0 warnings · `npm run
build` exit 0 · verificado contra next/image sirviendo las imágenes reales
de producción (build local con `BACKEND_URL` apuntando a
`inmobiliariacercatrova.com/api`).

## Anotado, NO aplicado

- Los thumbnails de la galería del detalle (`sizes="64px"`) y las miniaturas
  de otras vistas menores siguen en calidad por defecto. A esos tamaños el
  ahorro de peso importa más que el detalle perdido.

---

# PARTE 17 — Expensas en la vista lista + estados de solicitud en notificaciones

> Sesión 2026-08-09. Dos cambios puntuales, sin tocar nada más.

## 1) Expensas en la vista LISTA del catálogo (`PropertyRow.tsx`)

Se agregó un chip "Expensas" a la fila de características, **inmediatamente
después de "Baños"**, usando el mismo `formatExpensas()` que ya existía
(`shared/lib/money.ts`, usado en el detalle desde la PARTE 12).

- **Sólo si la propiedad tiene expensas cargadas.** `formatExpensas()`
  devuelve `null` cuando el campo viene vacío, y el mismo patrón de spread
  condicional que ya usaban `supTotal`/`supCubierta` en este archivo se
  reusó acá: `...(formatExpensas(expensas) ? [...] : [])`. Sin eso, mostrar
  "$ 0 EXPENSAS" en una propiedad sin dato cargado sería un dato falso.
- **No se tocó `PropertyCard.tsx`** (vista mosaico/grilla): el pedido fue
  explícito en que el chip va únicamente en la vista lista.
- Ícono `Receipt`, mismo que usa el detalle y el filtro para Expensas —
  consistencia de iconografía en todo el sitio.

Orden final de la fila: Hab. → Baños → **Expensas** (si aplica) → Años →
Sup. Total → Sup. Cubierta.

### Verificado con datos reales

Front local en modo producción, `BACKEND_URL` apuntando a
`inmobiliariacercatrova.com/api`. De las 9 propiedades en catálogo, sólo la
8 tiene `expensas: 231`. Capturada la vista lista: esa fila —y sólo esa—
muestra `$ 231 EXPENSAS` entre Baños y Años; las otras 8 no muestran nada
en su lugar (ni un chip vacío, ni "—").

## 2) Estados de solicitud en el sidebar de notificaciones del usuario

El grupo "Notificaciones" del sidebar (`dashboard/layout.tsx`) sólo listaba
6 subítems: Todas, Propiedades nuevas, Publicaciones nuevas, Según mis
preferencias, Bajaron de precio, Respuestas a mis comentarios. Faltaban los
tres estados de solicitud —**Aceptadas**, **Rechazadas**, **En revisión**—
que la propia pantalla de notificaciones (`notificaciones/page.tsx`) ya
tenía como tabs desde antes.

No hizo falta agregar lógica nueva: `contarSinLeer()`
(`notificaciones/notifShared.ts`, PARTE 14) ya calculaba
`solicitudes_aceptadas`, `solicitudes_rechazadas` y `solicitudes_revision`
—se usan en la pantalla para los badges de esos mismos tabs—, sólo no
estaban expuestos como acceso directo del sidebar. Se agregaron los tres
`href` con `?tipo=solicitudes_*`, badge de no leídas incluido, y las
**mismas etiquetas** que ya usan los tabs de la pantalla (Aceptadas /
Rechazadas / En revisión), para que no haya dos nombres para la misma
categoría en dos lugares del sitio.

## Estado

`npx tsc --noEmit` sin errores · `npx next lint` 0 warnings · `npm run
build` exit 0 · verificado con datos reales de producción (Expensas
comprobado visualmente; los 3 subítems de solicitud comparten exactamente
el mismo mecanismo ya verificado en la PARTE 14 para el resto del grupo,
que sigue sano tras el agregado).

---

# PARTE 18 — Performance mobile: medido con Lighthouse, no estimado

> Sesión 2026-08-09. Se corrió **Lighthouse localmente** (mobile, throttling
> simulado) contra producción para tener la línea base, y contra el build local
> después de cada cambio. Todos los números de acá salen de esas corridas.

## ⚠️ El Bloque 1 partía de una premisa que ya no era cierta

El pedido asumía que un loader con three.js corría en cada transición de
página. **No existe ningún `loading.tsx` en el proyecto**: el de `(public)/` se
eliminó en la PARTE 13 para arreglar un soft 404. Sin ese archivo,
`Loadingpage.tsx` y `Escena3D.tsx` quedaron **sin importadores**, o sea código
muerto que el tree-shaking ya descartaba.

Verificado por dos vías independientes:
- `grep` sobre los chunks compilados: cero coincidencias de `WebGLRenderer` /
  `BufferGeometry`.
- First Load JS de `/`: 266 kB. Con three en el camino crítico serían ~400 kB.

**Ahorro real de sacar three.js: 0 kB.** Igual se hizo la limpieza (609 líneas
muertas, 3 keyframes CSS huérfanos, `three` y `@types/three` desinstalados):
mejora el repo y el tiempo de `npm install`, no el bundle.

⚠️ **NO se agregó ningún `loading.tsx` de reemplazo.** Volver a poner uno en
`(public)/` reintroduce el soft 404 (Google recibiendo 200 en propiedades
inexistentes). Queda anotado en `properties/[id]/page.tsx`.

⚠️ Casi se borra `loader-in` junto con los otros keyframes: **sigue en uso** en
`NavbarPrivate.tsx` (panel de cuenta y backdrop mobile). Se conservó.

## Lo que SÍ movió la aguja

### 1. El favicon pesaba 1,4 MB — el 60% del payload de la landing

Medido con captura de red real (CDP, móvil 412px DPR2, sin caché):
`/icon.png?v=1` = **1.393,9 KiB**, el recurso más pesado de la página por
lejos.

| Archivo | Antes | Después |
|---|---|---|
| `src/app/icon.png` | 1254x1254, **1.393 KB** | 256x256 con paleta, **29,5 KB** |
| `public/favicon.ico` | 1408x736 (¡ni cuadrado!), **1.026 KB** | 48x48, **4,7 KB** |

Se probaron seis combinaciones de tamaño/paleta antes de elegir: 512 con paleta
daba 100,8 KB, 192 daba 17,8 KB. **256 con paleta (29,5 KB)** es el punto donde
el ícono sigue nítido en cualquier tamaño de pestaña y pesa 47 veces menos.
Verificado visualmente que el logo no se degradó.

⚠️ Este repo **no tiene git**, así que los binarios originales se respaldaron
antes de sobrescribirlos.

### 2. Se revirtió el `quality={95}` de las tarjetas — era una regresión propia

Lighthouse atribuía **322 KiB** (`uses-responsive-images`) + **108 KiB**
(`modern-image-formats`) a tres imágenes de Destacadas. Son exactamente las que
la PARTE 16 puso en `quality={95}`.

Medido sobre una imagen real, al ancho que pide un móvil (w=828):

| quality | Peso | Formato |
|---|---|---|
| **75 (default, elegido)** | **134,3 KB** | webp |
| 80 | 158,1 KB | webp |
| 85 | 165,9 KB | **jpeg — passthrough** |
| 95 (lo que había) | 165,9 KB | jpeg |

**A partir de q=85 el optimizador de Next deja de recodificar y devuelve el
archivo original entero**: sin redimensionar y sin convertir a WebP. En el
detalle eso es lo deseado (evita la doble compresión en una foto a pantalla
completa); en una tarjeta de ~380px es lo peor de ambos mundos.

Se quitó el `quality` explícito de `PropertyCard`, `PropertyRow` y
`FeaturedPropertyCard`. **El detalle mantiene `quality={95}`** — ahí sí está
medido y justificado (PARTE 15).

### 3. `priority` en una imagen que está 7 secciones más abajo

`Nosotros.tsx` tenía `priority={index === 0}`. Esa sección es la **7ª** de la
landing: la foto (136 KB) competía por ancho de banda con el hero, que es el
elemento LCP real. Se quitó; ahora usa lazy loading.

### 4. Animación no compositable en los puntos del carrusel de reseñas

Lighthouse marcaba dos `<span class="review-dot">` con el motivo exacto
**"Unsupported CSS Property: width"**. Animar el ancho recalcula layout en el
hilo principal, y el carrusel tiene autoplay: pasaba cada pocos segundos,
indefinidamente.

Pasó a `transform: scaleX` (compositable). El punto ahora ocupa siempre 26px y
en reposo se comprime a 0.308; el `gap` del contenedor bajó de 8px a 2px para
compensar. Efecto colateral bueno: la fila de puntos ya no se corre al cambiar
de slide.

⚠️ Al escribir el comentario se rompió el archivo por usar backticks dentro del
template literal del `<style>` — el propio archivo ya advertía sobre eso. Se
corrigió y se reforzó el recordatorio.

## Resultados

Lighthouse mobile, throttling simulado:

| Métrica | Producción (antes) | Local (después) |
|---|---|---|
| **Performance** | 79 | **84** |
| **TBT** | 410 ms | **120 ms** (−71%) |
| **Speed Index** | 4,4 s | **2,0 s** (−55%) |
| **Peso total** | 2.794 KiB | **813 KiB** (−71%) |
| CLS | 0,021 | 0,021 |

Captura de red directa: la landing pasó de **2.327 KiB** a **825 KiB**.

### First Load JS: sin cambios (era lo esperado)

| Ruta | Antes | Después |
|---|---|---|
| `/` | 266 kB | 266 kB |
| `/properties` | 239 kB | 239 kB |
| `/properties/[id]` | 238 kB | 237 kB |

Las mejoras fueron en **assets y payload**, no en el JavaScript. El bundle no
cambió porque three.js ya no estaba en él.

⚠️ **FCP y LCP no son comparables entre estos dos entornos.** Producción se
sirve desde el CDN de Vercel con las imágenes ya optimizadas y cacheadas en el
edge; `next start` en localhost las optimiza on-demand. Por eso el LCP local
sale peor (4,0 s vs 3,4 s) aunque la página pese un tercio. Las métricas que sí
son válidas cruzando entornos son las de bytes (peso total) y las de CPU (TBT,
Speed Index), y todas mejoraron.

## Hallazgo pendiente, con la evidencia de lo que NO funcionó

**La landing descarga 74,4 KiB del chunk de `zod`** (`f053d7f7c100063f.js`,
331 KB sin comprimir) pese a no tener ningún formulario. Es el recurso no-imagen
más pesado que queda.

Se verificó que el chunk **no está en el manifest de la landing** (sí en el de
`/login`), así que llega por otra vía. Se probaron **dos hipótesis y las dos
fallaron**, medidas con captura de red:

1. **Prefetch del `<Link href="/login">` del navbar** → se puso
   `prefetch={false}` en los dos links (escritorio y mobile). El chunk se
   siguió pidiendo. **Revertido.**
2. **Agrupación de chunks de Turbopack** (`NavbarPublic` y `LoginForm` caen en
   el mismo chunk) → se pasaron `LoginForm` y `RegisterForm` a `next/dynamic`
   para forzar un chunk asíncrono propio. El chunk se siguió pidiendo.
   **Revertido.**

Ambos cambios se revirtieron a propósito: no lograron su objetivo y dejar código
cuyo comentario afirma algo falso es peor que no tenerlo. El initiator real,
según CDP, es el runtime de Turbopack (`turbopack-*.js`) resolviendo un import
anónimo — hace falta seguir tirando de ahí.

## Estado

`npx tsc --noEmit` sin errores · `npx next lint` 0 warnings · `npm run build`
exit 0.

## Anotado, NO aplicado

- **Los PNG del hero pesan 2-3 MB en `public/`** (`CasaSider.png` 3,1 MB,
  `hipolitoYrigoyen.png` 2,9 MB). next/image ya los sirve como WebP de ~100 KB,
  así que el visitante no los paga enteros — pero engordan el repo y el deploy.
  Convertirlos a JPEG/WebP en origen es un ahorro de disco, no de red.
- **`chicaMudandose.jpg` (10,7 MB)** y otros ~20 PNG de ~2 MB en `public/`:
  mismo caso.
- **`legacy-javascript`** (14 KiB) y **`dom-size`** (1.091 elementos) siguen
  marcados. Son de bajo impacto comparados con lo resuelto.

# Portfolio Personal — Damián Coronel

Portfolio profesional con arquitectura modular escalable, animaciones en Canvas de universo minimalista y tema monocromático espacial.

## 🚀 Arquitectura y Escalabilidad

El proyecto ha sido diseñado para separar completamente **el contenido y la información** de la **capa de visualización y animación**. Toda la información del sitio se administra desde un único archivo centralizado.

### 📁 Estructura del Proyecto

```text
Portfolio/
├── index.html                    # Plantilla HTML semántica y ligera
├── css/
│   ├── variables.css             # Tokens de diseño (Monochrome Cosmic palette, tipografías)
│   ├── base.css                  # Estilos base, resets y cursor personalizado
│   ├── universe.css              # Capas de fondo (canvas 2D + canvas WebGL)
│   └── components.css            # Header, Hero, Work, Modal, Skills, Contacto, marcadores 3D
├── js/
│   ├── data/
│   │   └── portfolio-data.js     # 🌟 CENTRO DE DATOS (toda la información editable aquí)
│   ├── modules/
│   │   ├── frame-loop.js         # UN solo requestAnimationFrame para todo el sitio (delta time)
│   │   ├── space-state.js        # Contrato compartido entre el canvas 2D y la capa 3D
│   │   ├── universe-bg.js        # Canvas 2D: estrellas, polvo, constelaciones, fugaces
│   │   ├── space-cards.js        # Tarjetas de easter eggs de los cuerpos 3D
│   │   ├── planet-nav.js         # Panel de navegación entre planetas (modo observar)
│   │   ├── space-pan.js          # Paneo con flechas/WASD (modo observar)
│   │   ├── renderer.js           # Generador de DOM y SEO (JSON-LD) dinámico
│   │   └── ...                   # cursor, modal, animaciones, chatbot, etc.
│   ├── space/                    # 🪐 CAPA THREE.JS (cargada de forma diferida)
│   │   ├── index.js              # Punto de entrada: orquesta el frame 3D
│   │   ├── config.js             # Los 6 cuerpos: sección, anclaje y tamaños (datos puros)
│   │   ├── core/                 # engine (renderer único), assets, anchors, math
│   │   ├── bodies/               # CelestialBody base + Tierra, Saturno, Alfa Muscae,
│   │   │                         #   Coruscant, El Lucero, TRAPPIST-1e
│   │   ├── shaders/              # GLSL: planetas terrestres, glows, ruido simplex
│   │   ├── effects/              # Agujero negro (lente gravitacional), asteroides 3D
│   │   └── interaction/          # Foco, router de punteros, marcadores DOM
│   └── main.js                   # Script principal de inicialización
└── assets/space/                 # Texturas y modelos 3D optimizados (ver CREDITS.md)
```

---

## 🔐 Panel de administración (`/admin`)

Desde `tu-dominio/admin` se editan **todos los proyectos** (personales y de clientes): textos, tags, funcionalidades, orden, visibilidad, portada, galería y video. Las imágenes se achican y se convierten a WebP en el navegador antes de subirse (máx. 3 MB por archivo).

```text
admin/                                  # Panel (HTML/CSS/JS, sin build)
api/admin/{login,content,upload}.js     # Vercel Functions del panel
api/_lib/                               # Auth, almacenamiento (GitHub / local) y validación
content/client-projects.json            # Trabajos de clientes
content/personal-projects.config.json   # Proyectos personales (repo, imágenes, textos fijados)
```

- **Contraseña:** se verifica en el servidor contra un hash (`api/_lib/auth.js`); no importan mayúsculas ni espacios. Para cambiarla sin tocar código, definí `ADMIN_PASSWORD` en Vercel.
- **Cómo guarda:** no hay base de datos. Cada "Guardar cambios" es **un commit** al repo vía la API de GitHub (con las imágenes nuevas incluidas) y Vercel redeploya en 1–2 minutos. Si cambiaste un proyecto personal, además corre el sync.
- **Proyectos personales:** los textos los mantiene al día la sincronización con el repo. Si editás uno desde el panel queda **"Fijado a mano"** (`overrides` en la config) y la sync deja de pisarlo; "Volver a automático" lo libera.

### Configuración en Vercel (una sola vez)

| Variable de entorno | Para qué | ¿Obligatoria? |
|---|---|---|
| `GITHUB_TOKEN` | Que el panel pueda guardar (commitear al repo) | Sí, para guardar |
| `ADMIN_PASSWORD` | Cambiar la contraseña sin tocar código | No |
| `ADMIN_SESSION_SECRET` | Clave propia para firmar las sesiones | No |

`GITHUB_TOKEN`: GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate new token → *Only select repositories*: `portfolio2026` → Permissions → **Contents: Read and write**. Pegalo en Vercel → Project → Settings → Environment Variables y hacé un Redeploy. Sin token el panel abre en modo solo lectura.

### Probarlo en local

```bash
npm run dev
```

Abre el sitio en `http://localhost:5173` y el panel en `/admin/`. En local guarda directo en los archivos de la carpeta (después commiteás vos).

---

## 🔄 Proyectos personales auto-sincronizados con GitHub

Los proyectos personales no están hardcodeados: cada uno está atado a su repositorio y se actualiza solo cuando pusheás. En el sitio no se muestra ningún link al repo ni al código.

```text
content/personal-projects.config.json   # ✏️ Registro — se edita desde /admin
scripts/sync-projects.mjs               # Lee los repos y genera la ficha de cada proyecto
data/personal-projects.json             # 🤖 Generado — la web lo combina con la config (no editar)
.github/workflows/sync-projects.yml     # Corre el sync cada 6 h, a mano o por aviso del repo
scripts/templates/notify-portfolio.yml  # Plantilla opcional para el repo de cada proyecto
```

**Flujo:** pusheás al repo del proyecto → el Action del portfolio detecta los commits nuevos → (con `ANTHROPIC_API_KEY`) Claude actualiza resumen, stack, la lista acumulativa de funcionalidades y redacta el changelog → se commitea `data/personal-projects.json` → Vercel redeploya. Sin API key funciona igual, pero el changelog sale directo de los mensajes de commit y las funcionalidades quedan como en `seed`. No hay base de datos: el estado vive en el JSON y su historial en git.

### Agregar un proyecto

Desde `/admin` → "Proyectos personales" → **+ Nuevo**: título, repositorio (`usuario/nombre`), link e imágenes, y guardar. El guardado dispara el sync, que completa resumen, funcionalidades y changelog en unos minutos. Opcional: notas y archivos de contexto para la IA.

### Comandos

```bash
npm run sync:projects                          # Todos los proyectos
npm run sync:projects -- --only=alz-stats      # Uno solo
npm run sync:projects -- --full                # Reanaliza toda la historia
npm run sync:projects -- --reset               # Descarta lo generado y arranca desde 'seed'
npm run sync:projects -- --dry-run             # Muestra el resultado sin escribir
```

### Secrets del repo (Settings → Secrets and variables → Actions)

| Secret | Para qué | ¿Obligatorio? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Resúmenes, funcionalidades y changelog redactados por Claude | No (sin ella usa los commits) |
| `PROJECTS_GITHUB_TOKEN` | Leer repos **privados** de proyectos | Solo con repos privados |
| `PORTFOLIO_DISPATCH_TOKEN` | En el repo de cada proyecto, para avisar al portfolio al instante | No (si no, espera al cron de 6 h) |

> Escribir los commits como *conventional commits* (`feat(scope): …`, `fix: …`) mejora tanto el modo con IA como el modo sin IA.

---

## ✏️ ¿Cómo subir y administrar la información?

Los **proyectos** se administran desde el panel `/admin` (ver arriba). El resto del contenido (hero, experiencia, rubros, habilidades) sigue en:

👉 **`js/data/portfolio-data.js`**

### Ejemplos de Modificación:

#### 1. Editar Datos Personales y Hero
```javascript
personal: {
  name: "Damián Coronel",
  jobTitle: "Senior WordPress Developer | WooCommerce, PHP, Core Web Vitals",
  email: "tuemail@ejemplo.com",
  ...
}
```

#### 2. Actualizar Experiencia Laboral
Añade o modifica elementos en `experience`:
```javascript
{
  period: "2024 — Actualidad",
  title: "Nuevo Cargo",
  company: "Nombre de la Empresa",
  description: "Descripción de logros y responsabilidades."
}
```

#### 3. Añadir o Categorizar Habilidades (Skills)
En el objeto `skills`, puedes modificar o crear grupos con iconos de [SimpleIcons](https://simpleicons.org/):
```javascript
{
  category: "NUEVA CATEGORÍA",
  items: [
    { name: "NombreTecnologia", icon: "slug-de-simpleicons" }
  ]
}
```

#### 5. Editar las curiosidades del universo 3D
Los textos de los marcadores también viven en `portfolio-data.js`:
```javascript
// Puntos clicables sobre la Tierra (lat/lon en grados)
earthHotspots: [
  { name: "Buenos Aires", lat: -34.6, lon: -58.4, title: "Base de operaciones", text: "..." }
],
// Curiosidades alrededor de Alfa Muscae, El Lucero y TRAPPIST-1e
// (angle en grados: -90 = arriba; `card: true` es el marcador dorado que abre la ficha)
spaceFacts: {
  "trappist-1e": [
    { angle: -90, text: "Uno de los 7 planetas de TRAPPIST-1, a ~40 años luz." },
    { angle: 135, card: true }
  ]
}
```
La posición y el tamaño de cada cuerpo se ajustan en `js/space/config.js`.

---

## 🎨 Universo 3D y Tema Monocromático

- **Un solo renderer WebGL:** los seis cuerpos, los asteroides y el agujero negro se dibujan en un único canvas/contexto (antes eran 4 contextos WebGL y 7 loops de animación). Cada cuerpo tiene su propia escena y cámara con proyección off-axis, anclado a su sección de la página.
- **Un cuerpo por sección:** Tierra (hero), Saturno (trabajos), Alfa Muscae (rubros), Coruscant (experiencia), El Lucero (sobre mí) y TRAPPIST-1e (contacto).
- **Shaders propios:** día/noche con luces de ciudad sólo en el lado nocturno, brillo especular en océanos, nubes con sombra, atmósfera, anillos de Saturno con sombras en ambos sentidos, estrella con granulación animada, planetas procedurales.
- **Modelos reales de la NASA:** ISS, Cassini, Spitzer, un CubeSat y el asteroide Bennu (ver `assets/space/CREDITS.md`).
- **Agujero negro (escribí "agujero"):** lente gravitacional real que deforma tanto las estrellas como los planetas 3D, con disco de acreción y efecto Doppler.
- **Modo observar (botón del ojo):** clic en un cuerpo para enfocarlo, arrastrar para rotarlo, rueda/pinch para zoom, flechas para rotar; los cuerpos chicos muestran curiosidades y una tarjeta. `Esc` retrocede de a un nivel (tarjeta → zoom → modo observar).
- **Rendimiento:** carga diferida por proximidad, culling de cuerpos fuera de pantalla, resolución adaptativa, shaders precompilados y animación independiente de los Hz del monitor.
- **Robustez:** si WebGL o el CDN de Three.js fallan, el portfolio se renderiza igual (la capa 3D se importa dinámicamente).
- **Accesibilidad:** respeta `prefers-reduced-motion`; los marcadores 3D son botones reales con etiquetas.

---

## 🛠️ Ejecución Local

```bash
npm run dev
```

Sirve el sitio en `http://localhost:5173` junto con las funciones de `/api` (el panel incluido). Abrir `index.html` directo con doble clic no funciona porque el sitio usa módulos ES y carga los proyectos con `fetch`.

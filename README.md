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

## ✏️ ¿Cómo subir y administrar la información?

¡No necesitas tocar archivos HTML ni CSS! Para agregar, editar o eliminar proyectos, experiencia o habilidades, simplemente abre:

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

#### 2. Agregar un nuevo Proyecto
Simplemente añade un objeto al arreglo `projects`:
```javascript
{
  id: "nuevo-proyecto",
  index: "05",
  title: "Mi Nuevo Proyecto",
  subtitle: "Descripción corta para la card",
  tags: ["WordPress", "React", "WooCommerce"],
  summary: "Resumen destacado del proyecto.",
  description: "Explicación detallada que aparecerá dentro del modal al hacer clic.",
  image: "assets/proyectos/mi-captura.png", // o null para placeholder
  link: "https://misitio.com",
  featured: true
}
```

#### 3. Actualizar Experiencia Laboral
Añade o modifica elementos en `experience`:
```javascript
{
  period: "2024 — Actualidad",
  title: "Nuevo Cargo",
  company: "Nombre de la Empresa",
  description: "Descripción de logros y responsabilidades."
}
```

#### 4. Añadir o Categorizar Habilidades (Skills)
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

Puedes abrir directamente el archivo `index.html` en cualquier navegador moderno o servirlo con cualquier servidor estático local (como Live Server en VS Code, `npx serve`, Vite, o GitHub Pages).

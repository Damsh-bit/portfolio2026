# Portfolio Personal — Leandro Coronel

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
│   ├── universe.css              # Capa de fondo y canvas espacial
│   └── components.css            # Estilos de Header, Hero, Work, Modal, Skills, Contacto
├── js/
│   ├── data/
│   ├── portfolio-data.js     # 🌟 CENTRO DE DATOS (Toda la información editable aquí)
│   ├── modules/
│   │   ├── universe-bg.js        # Motor Canvas de Universo (estrellas, planetas, stardust)
│   │   ├── renderer.js           # Generador de DOM y SEO (JSON-LD) dinámico
│   │   ├── cursor.js             # Cursor inteligente con brillo monocromático
│   │   ├── modal.js              # Controlador de vistas de proyectos
│   │   └── animations.js         # Transiciones de entrada y ScrollTrigger con GSAP
│   └── main.js                   # Script principal de inicialización
```

---

## ✏️ ¿Cómo subir y administrar la información?

¡No necesitas tocar archivos HTML ni CSS! Para agregar, editar o eliminar proyectos, experiencia o habilidades, simplemente abre:

👉 **`js/data/portfolio-data.js`**

### Ejemplos de Modificación:

#### 1. Editar Datos Personales y Hero
```javascript
personal: {
  name: "Leandro Coronel",
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

---

## 🎨 Animación de Universo y Tema Monocromático

- **Estrellas y Polvo Cósmico:** Canvas dinámico optimizado a 60 FPS con profundidad multi-capa.
- **Planetas Minimalistas:** Cuerpos celestes flotantes con suaves gradientes en tonos grises/blancos y anillos de luz.
- **Interactividad:** El movimiento del cursor genera reacciones magnéticas en el polvo estelar y destellos láser grises; los planetas esconden easter eggs al hacer clic.
- **Modo Accesibilidad:** Respeta automáticamente la preferencia `prefers-reduced-motion` del sistema operativo.

---

## 🛠️ Ejecución Local

Puedes abrir directamente el archivo `index.html` en cualquier navegador moderno o servirlo con cualquier servidor estático local (como Live Server en VS Code, `npx serve`, Vite, o GitHub Pages).

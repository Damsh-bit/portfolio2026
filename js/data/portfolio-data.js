/**
 * =========================================================================
 * PORTFOLIO DATA CONFIGURATION
 * =========================================================================
 * Modify this file to update any information across the entire website.
 * No HTML edits required!
 */

export const portfolioData = {
  personal: {
    name: "Damián Coronel",
    fullName: "Damián Coronel",
    jobTitle: "Senior WordPress Developer | WooCommerce, PHP, Core Web Vitals",
    shortRole: "DESARROLLADOR WEB — SITIOS A MEDIDA, DE INICIO A FIN",
    email: "damiancoronel.dev@gmail.com",
    baseLocation: "Argentina — remoto",
    currentCompany: "DigitalYA — Madrid, España",
    focus: "Desarrollo Web · WordPress · JavaScript",
    languagesSummary: "ES nativo · EN B1 · PT A1",
    upworkRating: "5.0",
    bioParagraphs: [
      "Soy <strong>desarrollador WordPress senior</strong> y webmaster técnico, con más de tres años construyendo, optimizando y escalando sitios en producción para agencias de <strong>Argentina, España y Estados Unidos</strong>.",
      "Especializado en desarrollo de temas y plugins a medida, soluciones e-commerce con <strong>WooCommerce</strong>, optimización de <strong>Core Web Vitals</strong> y SEO técnico — entregando entornos rápidos, seguros y mantenibles en coordinación con equipos de diseño y marketing."
    ],
    socials: [
      { name: "GitHub", url: "https://github.com/Damsh-bit" },
      { name: "LinkedIn", url: "https://www.linkedin.com/in/damian-coronel-849b901b5/" },
      { name: "Upwork", url: "https://www.upwork.com/freelancers/~01791b0632a4d94424" }
    ],
    meta: {
      description: "Damián Coronel — Desarrollador WordPress Senior y Webmaster Técnico con más de 3 años de experiencia en WordPress, WooCommerce, PHP, optimización de Core Web Vitals, SEO técnico e integraciones de CRM y pasarelas de pago.",
      keywords: "WordPress Developer, Senior WordPress Developer, WooCommerce Developer, PHP Developer, Webmaster Técnico, Elementor, ACF, Gutenberg, Divi, Core Web Vitals, SEO técnico, JavaScript ES6, MySQL, Zoho CRM, Stripe, PayPal, cPanel, Plesk, Git, Figma, Desarrollador Web Argentina",
      author: "Damián Coronel"
    }
  },

  hero: {
    titleLines: [
      "Hola, soy Damián.",
      "Desarrollo <em>sitios web</em>",
      "completos, de punta a punta."
    ],
    ctas: {
      primary: "Hablemos de tu proyecto",
      secondary: "Escribime sin compromiso"
    },
    scrollCue: "SCROLL"
  },

  // Projects are not here: client work lives in content/client-projects.json
  // and personal projects in content/personal-projects.config.json — both
  // editable from the /admin panel.

  industries: [
    {
      name: "Inmobiliarias & Construcción",
      summary: "Portfolios de propiedades y obras con fichas técnicas y contacto directo con el equipo comercial.",
      stack: ["JetEngine", "Filtros por zona/precio/tipo", "Google Maps", "Captación de leads"]
    },
    {
      name: "Abogados & Estudios Jurídicos",
      summary: "Sitios corporativos que transmiten seriedad y facilitan agendar una consulta.",
      stack: ["Calendly", "Formularios por tipo de consulta", "Blog legal (CMS)", "Cumplimiento GDPR"]
    },
    {
      name: "Finanzas & Contabilidad",
      summary: "Landings de asesoría fiscal y financiera enfocadas en generar consultas calificadas.",
      stack: ["Formularios validados", "Leads a base de datos", "Schema.org", "Icons SVG animados"]
    },
    {
      name: "Gastronomía & Hotelería",
      summary: "Restaurantes y locales con menú, reservas y galería de ambiente para atraer comensales.",
      stack: ["Reservas online", "Menú interactivo", "Galería lightbox", "Stripe / PayPal"]
    },
    {
      name: "Salud & Bienestar",
      summary: "Sitios para profesionales de la salud con foco en confianza, accesibilidad y turnos.",
      stack: ["Turnos online", "Formularios de consulta", "SEO local", "Accesibilidad WCAG"]
    },
    {
      name: "Ecommerce & Retail",
      summary: "Tiendas online completas, del catálogo al checkout, listas para escalar en ventas.",
      stack: ["WooCommerce", "Carrito persistente", "Checkout optimizado", "Inventario en tiempo real"]
    },
    {
      name: "B2B & Industrial",
      summary: "Sitios corporativos con cotizadores y catálogos técnicos para procesos de compra complejos.",
      stack: ["Cotizador dinámico", "PDF automático", "Login de clientes", "Catálogo técnico"]
    },
    {
      name: "Estudios Creativos & Arquitectura",
      summary: "Portfolios visuales de alto impacto para estudios de diseño, 3D y arquitectura.",
      stack: ["Galerías 3D interactivas", "Swiper.js", "Antes/Después", "Animaciones on scroll"]
    }
  ],

  experience: [
    {
      period: "Sep 2023 — Actualidad",
      title: "Desarrollador WordPress Senior / Webmaster Técnico",
      company: "DigitalYA — Madrid, España · Remoto",
      description: [
        "Diseñé y mantuve la arquitectura de un portfolio de sitios WordPress en producción, garantizando un uptime del 99,9 %, plugins y temas actualizados y cero vulnerabilidades críticas de seguridad mediante gestión proactiva de parches.",
        "Lideré el ciclo completo de desarrollo de proyectos a medida en WordPress y WooCommerce: desde el relevamiento técnico y la personalización de temas y plugins hasta el despliegue y el soporte post-lanzamiento.",
        "Optimicé las Core Web Vitals (LCP, CLS, FID) en múltiples sitios de clientes, mejorando los puntajes de Google PageSpeed y contribuyendo a avances medibles en el posicionamiento SEO.",
        "Coordiné sprints interdisciplinarios con los equipos de diseño y marketing, traduciendo requerimientos de negocio en implementaciones escalables y pixel-perfect con Elementor y ACF.",
        "Integré APIs de terceros y herramientas de CRM (ZOHO) para automatizar la captación de leads y agilizar los flujos de trabajo del cliente, reduciendo la carga manual de datos.",
        "Implementé entornos de staging y checklists de despliegue que redujeron los incidentes en producción y aceleraron los ciclos de release."
      ]
    },
    {
      period: "Jul 2023 — Ago 2023",
      title: "Desarrollador WordPress",
      company: "Bubo Branding — Buenos Aires, Argentina",
      description: [
        "Desarrollé sitios WordPress responsive y accesibles (estándar ADA), desde la entrega del diseño hasta el lanzamiento, cumpliendo consistentemente con los plazos y el alcance acordados.",
        "Supervisé las revisiones de código de desarrolladores junior, haciendo cumplir estándares y buenas prácticas que elevaron la calidad general del equipo.",
        "Mejoré el rendimiento de los sitios de clientes mediante estrategias de caché, pipelines de optimización de imágenes y tuning de consultas a base de datos, logrando tiempos de carga más rápidos y mayor retención de usuarios.",
        "Aumenté la visibilidad orgánica de varios clientes a través de auditorías de SEO on-page e implementación de datos estructurados (Schema.org), mejorando el posicionamiento en las SERP."
      ]
    },
    {
      period: "Mar 2023 — Jul 2023",
      title: "Desarrollador Web y Soporte Técnico",
      company: "Digitaliza — Florida, Miami, EE. UU. · Remoto",
      description: [
        "Desarrollé y lancé sitios WordPress a medida a partir de diseños en Figma/PSD aprobados por el cliente, gestionando la configuración completa de hosting: DNS, certificados SSL y ajustes del lado del servidor.",
        "Implementé y configuré múltiples integraciones de CRM (ZOHO, HubSpot), adaptando los flujos de trabajo a los procesos de cada cliente y reduciendo los tiempos de onboarding.",
        "Brindé soporte técnico post-venta 24/7 a una cartera de clientes en crecimiento, sosteniendo altos niveles de retención gracias a la rápida resolución de incidentes.",
        "Gestioné migraciones de servidor de más de 10 sitios activos sin pérdida de datos y con mínima interrupción del servicio, aplicando procedimientos de despliegue escalonado."
      ]
    }
  ],

  education: [
    {
      title: "Técnico Superior en Programación — UNLZ",
      period: "Mar 2019 – Jul 2022"
    },
    {
      title: "Diploma en JavaScript Experto — Platzi",
      period: "Jul 2022"
    },
    {
      title: "Diploma en Desarrollo con PHP Experto — Platzi",
      period: "Ago 2022"
    },
    {
      title: "Diploma en Desarrollo con React — Platzi",
      period: "Nov 2022"
    }
  ],

  skills: [
    {
      category: "CMS Y E-COMMERCE",
      items: [
        { name: "WordPress", icon: "wordpress" },
        { name: "WooCommerce", icon: "woocommerce" },
        { name: "Elementor", icon: "elementor" },
        { name: "Gutenberg", icon: null },
        { name: "ACF", icon: null },
        { name: "Divi", icon: null }
      ]
    },
    {
      category: "LENGUAJES",
      items: [
        { name: "PHP", icon: "php" },
        { name: "JavaScript (ES6+)", icon: "javascript" },
        { name: "Python", icon: "python" },
        { name: "Java", icon: null },
        { name: "HTML5", icon: "html5" },
        { name: "CSS3", icon: "css3" },
        { name: "Sass", icon: "sass" },
        { name: "MySQL", icon: "mysql" }
      ]
    },
    {
      category: "RENDIMIENTO Y SEO",
      items: [
        { name: "Core Web Vitals", icon: null },
        { name: "PageSpeed", icon: "googlepagespeedinsights" },
        { name: "Yoast SEO", icon: "yoast" },
        { name: "Rank Math", icon: null },
        { name: "WP Rocket", icon: null },
        { name: "Redis", icon: "redis" }
      ]
    },
    {
      category: "DEVOPS Y HERRAMIENTAS",
      items: [
        { name: "REST API", icon: null },
        { name: "Zoho CRM", icon: "zoho" },
        { name: "Stripe", icon: "stripe" },
        { name: "PayPal", icon: "paypal" },
        { name: "cPanel", icon: "cpanel" },
        { name: "Plesk", icon: null },
        { name: "Linux VPS", icon: "linux" },
        { name: "Git", icon: "git" },
        { name: "GitHub", icon: "github" },
        { name: "Figma", icon: "figma" },
        { name: "GTmetrix", icon: null }
      ]
    }
  ],
  // Click-to-open easter eggs on the surface of the 3D Earth (space-scene.js).
  // lat/lon in degrees; edit freely — no code changes needed.
  earthHotspots: [
    {
      name: "Buenos Aires",
      lat: -34.6,
      lon: -58.4,
      title: "Base de operaciones",
      text: "Acá nací y acá programo. Argentina, GMT-3 — el punto de partida de cada proyecto."
    },
    {
      name: "Madrid",
      lat: 40.4,
      lon: -3.7,
      title: "Puente remoto",
      text: "A 10.000 km, el equipo actual en DigitalYA. El trabajo remoto no conoce husos horarios."
    },
    {
      name: "Atlántico Sur",
      lat: 5,
      lon: -35,
      title: "Señal en tránsito",
      text: "En algún punto de este océano viajan los commits, los deploys y algún que otro café virtual."
    }
  ]
};

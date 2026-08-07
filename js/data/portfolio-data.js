/**
 * =========================================================================
 * PORTFOLIO DATA CONFIGURATION
 * =========================================================================
 * Modify this file to update any information across the entire website.
 * No HTML edits required!
 */

export const portfolioData = {
  personal: {
    name: "Leandro Coronel",
    fullName: "Leandro Damian Coronel",
    jobTitle: "Senior WordPress Developer | WooCommerce, PHP, Core Web Vitals",
    shortRole: "SR. WORDPRESS DEVELOPER — ESPECIALISTA EN RENDIMIENTO WEB Y CMS",
    email: "damiancoronel.dev@gmail.com",
    baseLocation: "Argentina — remoto",
    currentCompany: "DigitalYA — Madrid, España",
    focus: "WordPress · WooCommerce · Core Web Vitals",
    languagesSummary: "ES nativo · EN B1 · PT A1",
    bioParagraphs: [
      "Soy <strong>desarrollador WordPress senior</strong> y webmaster técnico, con más de tres años construyendo, optimizando y escalando sitios en producción para agencias de <strong>Argentina, España y Estados Unidos</strong>.",
      "Especializado en desarrollo de temas y plugins a medida, soluciones e-commerce con <strong>WooCommerce</strong>, optimización de <strong>Core Web Vitals</strong> y SEO técnico — entregando entornos rápidos, seguros y mantenibles en coordinación con equipos de diseño y marketing."
    ],
    socials: [
      { name: "GitHub", url: "https://github.com" },
      { name: "LinkedIn", url: "https://linkedin.com" },
      { name: "Upwork", url: "https://upwork.com" }
    ],
    meta: {
      description: "Leandro Damian Coronel — Desarrollador WordPress Senior y Webmaster Técnico con más de 3 años de experiencia en WordPress, WooCommerce, PHP, optimización de Core Web Vitals, SEO técnico e integraciones de CRM y pasarelas de pago.",
      keywords: "WordPress Developer, Senior WordPress Developer, WooCommerce Developer, PHP Developer, Webmaster Técnico, Elementor, ACF, Gutenberg, Divi, Core Web Vitals, SEO técnico, JavaScript ES6, MySQL, Zoho CRM, Stripe, PayPal, cPanel, Plesk, Git, Figma, Desarrollador Web Argentina",
      author: "Leandro Damian Coronel"
    }
  },

  hero: {
    titleLines: [
      "Construyo y escalo",
      "sitios <em>WordPress</em>",
      "de alto rendimiento."
    ],
    scrollCue: "SCROLL"
  },

  projects: [
    {
      id: "alzstats",
      index: "01",
      title: "alzstats.pro",
      subtitle: "Plataforma de estadísticas y análisis avanzado",
      tags: ["Next.js", "Supabase", "Gemini API"],
      summary: "Plataforma interactiva de analíticas en tiempo real con inteligencia artificial integrando Gemini API.",
      description: "Desarrollo integral de dashboard de estadísticas y analítica técnica. Implementación de autenticación segura, persistencia de datos en Supabase y generación de informes automatizados mediante IA.",
      image: null, // Add image URL here (e.g. "assets/projects/alzstats.png")
      link: "https://alzstats.pro",
      featured: true
    },
    {
      id: "jma-gestion",
      index: "02",
      title: "JMA Gestión de Inmuebles",
      subtitle: "Portal Inmobiliario personalizado",
      tags: ["WordPress", "Jet Engine", "Crocoblock"],
      summary: "Sitio web inmobiliario de alto rendimiento con filtrado dinámico de propiedades y motor de búsqueda customizado.",
      description: "Diseño y arquitectura backend en WordPress utilizando JetEngine y Crocoblock para estructuras de Custom Post Types complejas, filtros facetados y optimización de velocidad de carga para SEO.",
      image: null,
      link: "#",
      featured: true
    },
    {
      id: "ethos-trust",
      index: "03",
      title: "Ethos Trust",
      subtitle: "Sistema de diseño corporativo y SEO técnico",
      tags: ["Design System", "SEO técnico", "i18n ES/EN"],
      summary: "Plataforma corporativa internacional con sistema de diseño modular, soporte multilenguaje y Core Web Vitals > 95.",
      description: "Construcción de sitio corporativo enfocado en conversión y confianza. Implementación de arquitectura multilenguaje (i18n), optimización estricta de rendimiento y marcado semántico avanzado.",
      image: null,
      link: "#",
      featured: true
    },
    {
      id: "moi-fotografia",
      index: "04",
      title: "MOI Fotografía",
      subtitle: "Portfolio de fotografía con carga progresiva",
      tags: ["WordPress", "Galería a medida"],
      summary: "Sitio web para estudio fotográfico profesional con galerías de alta resolución y optimización de carga de imágenes.",
      description: "Desarrollo de tema WordPress custom orientado a impacto visual sin sacrificar rendimiento. Carga diferida (lazy loading), compresión WebP automatizada y animaciones fluidas.",
      image: null,
      link: "#",
      featured: true
    }
  ],

  experience: [
    {
      period: "Nov 2022 — Actualidad",
      title: "Desarrollador WordPress Senior / Webmaster Técnico",
      company: "DigitalYA — Madrid, España · Remoto",
      description: "Lidero el ciclo completo de proyectos WordPress y WooCommerce personalizados, optimizo Core Web Vitals e integro APIs y CRM (Zoho) para automatizar flujos de clientes, coordinando sprints con equipos de diseño y marketing."
    },
    {
      period: "Jul 2022 — Nov 2022",
      title: "Desarrollador Web",
      company: "Bubo Branding — CABA, Argentina",
      description: "Desarrollo de sitios WordPress responsivos y accesibles, revisión de código de desarrolladores junior y mejoras de rendimiento mediante caché, optimización de imágenes y ajuste de consultas a base de datos."
    },
    {
      period: "Mar 2019 — Jul 2022",
      title: "Desarrollador Web y Soporte Técnico",
      company: "Digitaliza — Florida, Miami, EE. UU. · Remoto",
      description: "Desarrollo de sitios a medida desde diseños en Figma/PSD, configuración de hosting, DNS y SSL, integraciones de CRM (Zoho, HubSpot) y migraciones de servidor sin pérdida de datos."
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
  ]
};

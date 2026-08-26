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

  projects: [
    {
      id: "reconocer",
      index: "01",
      title: "Reconocer",
      subtitle: "Landing",
      tags: ["Landing", "Smooth Scroll", "SEO técnico"],
      summary: "Plataforma de soluciones de producción y fabricación con galería de casos de éxito.",
      description: "Reconocer es una plataforma que conecta empresas con soluciones de producción y fabricación, transformando ideas en realidad. La propuesta: mostrar un portfolio de casos de éxito demostrando capacidad para ejecutar proyectos complejos. Desarrollé un sitio responsivo con componentes interactivos para visualizar casos, navegación fluida con smooth scroll y parallax effects. Implementé lazy loading de imágenes, transiciones CSS3 suaves, y formulario de contacto con validación frontend/backend. Optimizado para SEO con meta tags dinámicos y estructura HTML5 semántica. Performance en Lighthouse 90+.",
      image: "assets/projects/reconocer.png",
      gallery: ["assets/projects/reconocer.png"],
      link: "#",
      type: "trabajo",
      featured: true
    },
    {
      id: "azahara",
      index: "02",
      title: "Azahara",
      subtitle: "Landing - Restaurante",
      tags: ["Landing", "Restaurante", "Core Web Vitals"],
      summary: "Restaurante gourmet con propuesta gastronómica contemporánea y diseño premium.",
      description: "Azahara es un restaurante de alta cocina que combina tradición con modernidad, ofreciendo experiencia culinaria en ambientes elegantes. El desafío: comunicar la propuesta premium del lugar. Creé un sitio de alto impacto visual con diseño dark elegante. Implementé animaciones entrance en hero section, fade-in effects en scroll, y transiciones suaves entre componentes. Optimicé carga de imágenes premium mediante WebP y srcset responsivo. Incluye navegación sticky header con smooth scrolling y CTA buttons con hover effects. Mobile-first responsive design, optimizado para Core Web Vitals (LCP, CLS, FID) y analytics con GTM.",
      image: "assets/projects/azahara.png",
      gallery: ["assets/projects/azahara.png"],
      link: "#",
      type: "trabajo",
      featured: true
    },
    {
      id: "macarena",
      index: "03",
      title: "Macarena",
      subtitle: "Landing - Restaurante",
      tags: ["Multi-página", "Galería dinámica", "REST API"],
      summary: "Grupo de restaurantes tradicionales que reinventan la cocina del sur con toque contemporáneo.",
      description: "Macarena es un grupo de restaurantes con raíces en gastronomía tradicional, que moderniza la cocina clásica manteniendo su esencia. Necesitaban presentar múltiples locales con identidad única. Desarrollé plataforma multi-página con arquitectura escalable. Implementé galería de imágenes con filtros dinámicos (por restaurante/categoría), lightbox modal y lazy loading optimizado. Navegación con tabs interactivos, acordeones expandibles y rutas dinámicas por restaurante. Integración con API REST para integridad de datos. Responsive con breakpoints optimizados. Analytics con GTM y tracking de eventos.",
      image: "assets/projects/macarena.png",
      gallery: ["assets/projects/macarena.png"],
      link: "#",
      type: "trabajo",
      featured: true
    },
    {
      id: "bonded-finance",
      index: "04",
      title: "Bonded Finance",
      subtitle: "Landing - Servicios Financieros",
      tags: ["Landing", "Formularios", "SEO técnico"],
      summary: "Servicios financieros y contables personalizados para empresas en Valencia.",
      description: "Bonded Finance es un despacho de servicios financieros especializados en asesoría tributaria, fiscal y financiera. Ofrecen soluciones personalizadas que impulsan eficiencia, control y crecimiento empresarial. Creé una landing corporativa con estructura clara y CTAs estratégicos. Implementé formulario de contacto con validación HTML5, backend API y almacenamiento de leads en database. Secciones con icons SVG animados, slider de servicios interactivo con JavaScript vanilla, y schema.org structured data para SEO. Testing de accesibilidad (WCAG 2.1). Integración con email service para notificaciones automáticas. Performance optimizado.",
      image: "assets/projects/bonded-finance.png",
      gallery: ["assets/projects/bonded-finance.png"],
      link: "#",
      type: "trabajo",
      featured: true
    },
    {
      id: "nova-carlaria",
      index: "05",
      title: "Nova Carlaria",
      subtitle: "Landing - Construcción",
      tags: ["Filtros en tiempo real", "Google Maps", "PWA"],
      summary: "Empresa constructora que transforma conceptos arquitectónicos en espacios habitables de diseño moderno.",
      description: "Nova Carlaria es una constructora especializada en proyectos residenciales de diseño moderno, aplicando métodos innovadores para garantizar control, calidad y cumplimiento en cada fase. Necesitaban mostrar su portafolio y generar consultas. Desarrollé sitio web con galería masiva de proyectos inmobiliarios. Sistema de filtrado en tiempo real (zona/estilo/estado), toggle de vista grid/lista, e imagen principal con zoom on hover. Lazy loading para optimizar performance, modal detallado por proyecto con galería lightbox. Integración Google Maps para ubicaciones. PWA features (offline capability), responsive mobile-first y analytics para tracking de proyectos visitados.",
      image: "assets/projects/nova-carlaria.png",
      gallery: ["assets/projects/nova-carlaria.png"],
      link: "#",
      type: "trabajo",
      featured: true
    },
    {
      id: "quinta",
      index: "06",
      title: "Quinta",
      subtitle: "Landing + Ecommerce - Restaurante",
      tags: ["Ecommerce", "Reservas online", "Stripe/PayPal"],
      summary: "Restaurante con menú personalizado y sistema online de reservas y pedidos.",
      description: "Quinta es un restaurante que ofrece experiencia gastronómica diferenciada con múltiples opciones de menú personalizadas según el día y ocasión. El reto: permitir reservas y pedidos online de forma ágil. Desarrollé plataforma híbrida web + ecommerce. Sistema de reservas online con date picker dinámico, validación de disponibilidad en tiempo real y confirmación por email automática. Menú interactivo con filtros, búsqueda y zoom de imágenes. Carrito de compras para pedidos takeaway con integración de pasarelas de pago (Stripe/PayPal). Backend con gestión de reservas, órdenes y notificaciones en tiempo real. Dashboard admin para gestión. Fully responsive.",
      image: "assets/projects/quinta.png",
      gallery: ["assets/projects/quinta.png"],
      link: "#",
      type: "trabajo",
      featured: true
    },
    {
      id: "conica",
      index: "07",
      title: "Conica",
      subtitle: "Landing - Servicios Creativos",
      tags: ["3D/Rendering", "Swiper.js", "AOS"],
      summary: "Estudio de visualización 3D que crea renderizados fotorealistas y experiencias interactivas para arquitectos.",
      description: "Conica Studio es un estudio especializado en llevar visiones arquitectónicas a la vida mediante visuales inmersivos. Ofrecen rendering fotorealista, animaciones dinámicas y experiencias interactivas en tiempo real. Necesitaban un portafolio impactante para atraer arquitectos y desarrolladores. Creé sitio con galería de transiciones 3D CSS, visor de imagen con zoom interactivo y fullscreen mode. Showcase de proyectos con slider antes/después (Swiper.js), lazy loading de videos embebidos (Vimeo/YouTube), y animaciones entrance en scroll (AOS library). Formulario de contacto con validación e integración API. Dark mode toggle, code splitting para performance optimizada y SEO portfolio.",
      image: "assets/projects/conica.png",
      gallery: ["assets/projects/conica.png"],
      link: "#",
      type: "trabajo",
      featured: true
    },
    {
      id: "puntosil",
      index: "08",
      title: "Puntosil",
      subtitle: "Landing - B2B",
      tags: ["B2B", "Cotizador dinámico", "PDF automático"],
      summary: "Empresa de identificación y trazabilidad de productos que ofrece soluciones industriales completas.",
      description: "Puntosil es una empresa que ofrece servicios de identificación y logística para productos y mercancías, aportando soluciones industriales desde etiquetado hasta sistemas de trazabilidad completos. Se dirigía a empresas B2B buscando optimizar control de inventario. Desarrollé sitio corporativo B2B con diseño profesional modular. Componentes reutilizables para servicios con accordion expandible, tabs informativos y formulario de cotización con validación avanzada. Cálculo dinámico de presupuesto en tiempo real, integración backend para guardar requests. Generación automática de PDF con propuesta técnica, slider de testimonios carrusel. SEO optimizado para keywords B2B. Lead tracking analytics. Fully responsive.",
      image: "assets/projects/puntosil.png",
      gallery: ["assets/projects/puntosil.png"],
      link: "#",
      type: "trabajo",
      featured: true
    },
    {
      id: "king-nutrition",
      index: "09",
      title: "King Nutrition",
      subtitle: "Ecommerce",
      tags: ["Ecommerce", "Carrito persistente", "Checkout"],
      summary: "Tienda online de suplementación deportiva con ingredientes naturales y fórmulas de alto rendimiento.",
      description: "King Nutrition es una marca de suplementación deportiva que ofrece productos con ingredientes naturales para mejorar rendimiento físico, recuperación y bienestar. El objetivo: crear una plataforma ecommerce robusta para venta online. Desarrollé tienda full-featured con catálogo dinámico. Filtros por categoría/precio/rating, búsqueda con autocomplete, paginación optimizada. Product detail pages con galería zoomable, selector de variantes, y sección de reseñas verificadas. Carrito persistente (localStorage + sincronización), checkout optimizado con validación y autocompletar. Integración de pasarela de pagos, cupones dinámicos, gestión de inventario en tiempo real. Admin dashboard para productos y órdenes. Email confirmation automático y analytics de conversión.",
      image: "assets/projects/king-nutrition.png",
      gallery: ["assets/projects/king-nutrition.png"],
      link: "#",
      type: "trabajo",
      featured: true
    },
    {
      id: "fix-home",
      index: "10",
      title: "Fix Home",
      subtitle: "Landing - Servicios de Construcción",
      tags: ["Landing", "Antes/Después", "SEO local"],
      summary: "Constructora especializada en espacios exteriores premium (patios, pérgolas, terrazas) en Houston.",
      description: "Fix Home es una constructora enfocada en crear espacios exteriores lujosos (patios, pérgolas, terrazas de concreto) personalizados. Ofrecen servicios de diseño y construcción con alta calidad. Necesitaban mostrar portfolio visual y generar solicitudes de cotización. Creé landing con hero impactante. Galería de proyectos con filtrado por tipo, cards responsiva, y modal detallado con slider antes/después interactivo. Sección testimonios con carrusel autoplay, formulario multi-paso para solicitud de cotización con validación. Google Reviews embebido, iconografía SVG animada con hover effects. Lazy loading de imágenes, social media links. SEO local optimization (schema.org local business). Fully responsive.",
      image: "assets/projects/fix-home.png",
      gallery: ["assets/projects/fix-home.png"],
      link: "#",
      type: "trabajo",
      featured: true
    },
    {
      id: "polackio",
      index: "11",
      title: "Polackio",
      subtitle: "Landing + Ecommerce - Productos de Lujo",
      tags: ["Three.js", "Customización 3D", "Ecommerce"],
      summary: "Estudio artesanal de figuras 3D personalizadas de alto lujo para colecciones privadas.",
      description: "Polackio es un estudio especializado en diseño y fabricación de figuras 3D artesanales personalizadas de lujo absoluto. Cada pieza es una obra de arte curada para colecciones privadas de clientes que valoran exclusividad y calidad artesanal. Creé plataforma art + ecommerce con diseño dark elegante y tipografía sofisticada. Galería con visor 3D interactivo 360° (Three.js), sistema de customización en tiempo real (selector de materiales/acabados). Carrito ecommerce para venta de figuras, integración de pagos seguros para productos premium. Instagram feed embebido, formulario de encargos personalizados con upload de referencias. Email marketing integration, analytics de comportamiento de usuario. Performance optimizado.",
      image: "assets/projects/polackio.png",
      gallery: ["assets/projects/polackio.png"],
      link: "#",
      type: "trabajo",
      featured: true
    },
    {
      id: "legal-partners",
      index: "12",
      title: "Legal Partners",
      subtitle: "Landing - Servicios Legales",
      tags: ["Corporativo", "Calendly", "GDPR"],
      summary: "Despacho de abogados corporativos con servicios legales estratégicos nacionales e internacionales.",
      description: "Legal Partners es un despacho de abogados que ofrece asesoría legal estratégica y orientada a resultados, protegiendo assets y futuro regulatorio de empresas. El objetivo: posicionarse como referencia en asesoría corporativa de alto nivel. Desarrollé sitio web profesional con jerarquía visual clara. Secciones de servicios con expand/collapse, galería de team con información individual, testimonios. Integración Calendly para agendar consultas online directamente. Formulario de contacto con campos dinámicos según tipo de consulta, newsletter subscription. Blog section con artículos legales (CMS integrado). SEO local optimization, GDPR compliance en formularios. Performance optimizado. Diseño corporativo profesional.",
      image: "assets/projects/legal-partners.png",
      gallery: ["assets/projects/legal-partners.png"],
      link: "#",
      type: "trabajo",
      featured: true
    },
    {
      id: "ventura",
      index: "13",
      title: "Ventura",
      subtitle: "B2B + Ecommerce",
      tags: ["B2B/B2C", "Login clientes", "Cotizador"],
      summary: "Distribuidor de materiales de construcción profesionales (madera, revestimientos, tejas) en Houston.",
      description: "Ventura es una distribuidora de materiales de construcción profesionales que ofrece suministros de alta calidad para contratistas. Se posiciona como proveedor confiable con precios competitivos y atención personalizada a nivel regional. El reto: crear plataforma B2B/B2C híbrida funcional. Desarrollé portal con doble funcionalidad: catálogo informativo + ecommerce. Catálogo dinámico con filtros avanzados (material/especificación técnica/rango precio), búsqueda textual. Stock en tiempo real integrado con inventory system. Sistema de cotización para grandes órdenes (carritos guardados, comparación de precios). Login de clientes con historial de pedidos y precios personalizados. Bulk download (listados Excel). Pasarela B2B integrada. Admin panel para gestión de productos y órdenes. SEO ecommerce y analytics.",
      image: "assets/projects/ventura.png",
      gallery: ["assets/projects/ventura.png"],
      link: "#",
      type: "trabajo",
      featured: true
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
  ]
};

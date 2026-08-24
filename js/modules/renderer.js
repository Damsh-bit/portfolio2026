/**
 * =========================================================================
 * DYNAMIC DOM RENDERER & SEO INJECTOR
 * =========================================================================
 * Reads portfolioData configuration and generates semantic HTML content.
 */

import { portfolioData } from '../data/portfolio-data.js';

export function renderPortfolio() {
  injectSEO();
  renderHeader();
  renderHero();
  renderProjects();
  renderExperience();
  renderAbout();
  renderContact();
  renderFooter();
}

/** Inject Dynamic Meta Tags and JSON-LD Structured Data */
function injectSEO() {
  const { personal } = portfolioData;

  // Title
  document.title = `${personal.name} — ${personal.jobTitle}`;

  // Meta description & keywords
  updateMetaTag('description', personal.meta.description);
  updateMetaTag('keywords', personal.meta.keywords);
  updateMetaTag('author', personal.meta.author);

  // Schema JSON-LD Injection
  const jsonLdScript = document.getElementById('json-ld-data') || document.createElement('script');
  jsonLdScript.id = 'json-ld-data';
  jsonLdScript.type = 'application/ld+json';
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": personal.fullName,
    "jobTitle": personal.jobTitle,
    "email": `mailto:${personal.email}`,
    "address": { "@type": "PostalAddress", "addressCountry": "AR" },
    "worksFor": { "@type": "Organization", "name": "DigitalYA" },
    "alumniOf": { "@type": "CollegeOrUniversity", "name": "Universidad Nacional de Lomas de Zamora" },
    "knowsLanguage": ["Spanish", "English", "Portuguese"],
    "knowsAbout": [
      "WordPress", "WooCommerce", "PHP", "JavaScript", "MySQL", 
      "Elementor", "ACF", "Core Web Vitals", "SEO técnico", "Zoho CRM", 
      "REST API", "Stripe", "PayPal", "cPanel", "Plesk", "Git"
    ]
  };

  jsonLdScript.textContent = JSON.stringify(schemaData, null, 2);
  if (!document.getElementById('json-ld-data')) {
    document.head.appendChild(jsonLdScript);
  }
}

function updateMetaTag(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

/** Header & Nav */
function renderHeader() {
  const logoEl = document.getElementById('headerLogo');
  if (logoEl) logoEl.textContent = portfolioData.personal.name.toUpperCase();
}

/** Hero Section */
function renderHero() {
  const { personal, hero } = portfolioData;

  const eyebrowEl = document.getElementById('heroEyebrow');
  if (eyebrowEl) eyebrowEl.innerHTML = `<span>${personal.shortRole}</span>`;

  const titleEl = document.getElementById('heroTitle');
  if (titleEl) {
    titleEl.innerHTML = hero.titleLines
      .map(line => `<span class="line"><span>${line}</span></span>`)
      .join('');
  }

  const footEl = document.getElementById('heroFoot');
  if (footEl) {
    footEl.innerHTML = `
      <div><strong>Base</strong><span class="mono">${personal.baseLocation}</span></div>
      <div><strong>Actualmente</strong><span class="mono">${personal.currentCompany}</span></div>
      <div><strong>Foco</strong><span class="mono">${personal.focus}</span></div>
    `;
  }

  const ctaPrimaryEl = document.getElementById('heroCtaPrimary');
  if (ctaPrimaryEl) ctaPrimaryEl.innerHTML = `${hero.ctas.primary} <span class="arrow">→</span>`;

  const ctaSecondaryEl = document.getElementById('heroCtaSecondary');
  if (ctaSecondaryEl) ctaSecondaryEl.textContent = hero.ctas.secondary;
}

/** Selected Work Grid */
function renderProjects() {
  const gridEl = document.getElementById('workGrid');
  const countEl = document.getElementById('workCount');

  if (countEl) {
    countEl.textContent = `(${String(portfolioData.projects.length).padStart(2, '0')})`;
  }

  if (gridEl) {
    gridEl.innerHTML = portfolioData.projects.map((project, idx) => `
      <div class="work-card reveal" data-project="${idx}" data-type="${project.type || 'trabajo'}">
        <div class="thumb">
          ${project.image
            ? `<img src="${project.image}" alt="${project.title}" loading="lazy">`
            : `<span>${project.subtitle || 'Ver detalles del proyecto'}</span>`}
        </div>
        <div class="meta">
          <div>
            <span class="index mono">${project.index || String(idx + 1).padStart(2, '0')}</span>
            <h3>${project.title}<span class="underline"></span></h3>
            <div class="tags mono">${project.tags.join(' · ')}</div>
          </div>
          <span class="arrow">↗</span>
        </div>
      </div>
    `).join('');
  }
}

/** Experience Timeline & Education */
function renderExperience() {
  const container = document.getElementById('experienceContainer');
  const eduContainer = document.getElementById('educationContainer');
  const countEl = document.getElementById('expCount');

  if (countEl) {
    countEl.textContent = `(${String(portfolioData.experience.length).padStart(2, '0')})`;
  }

  if (container) {
    container.innerHTML = portfolioData.experience.map(item => `
      <div class="exp-row reveal">
        <span class="period mono">${item.period}</span>
        <div>
          <h3>${item.title}</h3>
          <div class="company mono">${item.company}</div>
          <p>${item.description}</p>
        </div>
      </div>
    `).join('');
  }

  if (eduContainer) {
    eduContainer.innerHTML = portfolioData.education.map(item => `
      <div class="edu-item">
        <span>${item.title}</span>
        <span class="mono">${item.period}</span>
      </div>
    `).join('');
  }
}

/** About Section & Categorized Tech Skills */
function renderAbout() {
  const { personal, skills } = portfolioData;

  const bioEl = document.getElementById('aboutBio');
  if (bioEl) {
    bioEl.innerHTML = `
      ${personal.bioParagraphs.map(p => `<p>${p}</p>`).join('')}
      <span class="lang-line mono">${personal.languagesSummary}</span>
    `;
  }

  const skillsEl = document.getElementById('aboutSkills');
  if (skillsEl) {
    skillsEl.innerHTML = skills.map(group => `
      <div class="skills-group">
        <span class="label mono">${group.category}</span>
        <div class="tags">
          ${group.items.map(item => {
            const iconUrl = item.icon ? `https://cdn.simpleicons.org/${item.icon}/d4d4d8` : null;
            return `
              <span class="tag">
                ${iconUrl ? `<img class="tech-icon" src="${iconUrl}" alt="" onerror="this.remove()">` : ''}
                ${item.name}
              </span>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  }
}

/** Contact Section */
function renderContact() {
  const { personal } = portfolioData;

  const emailEl = document.getElementById('contactEmail');
  if (emailEl) {
    emailEl.href = `mailto:${personal.email}`;
    emailEl.innerHTML = `
      ${personal.email}
      <span class="underline"></span>
    `;
  }
}

/** Footer Socials */
function renderFooter() {
  const socialsEl = document.getElementById('footerSocials');
  if (socialsEl) {
    socialsEl.innerHTML = portfolioData.personal.socials.map(s => `
      <a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}</a>
    `).join('');
  }

  const linkedinFab = document.getElementById('linkedinFab');
  const linkedin = portfolioData.personal.socials.find(s => s.name === 'LinkedIn');
  if (linkedinFab && linkedin) linkedinFab.href = linkedin.url;
}

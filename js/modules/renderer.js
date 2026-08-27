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
  renderIndustries();
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
  if (logoEl) {
    const tag = portfolioData.personal.name.replace(/\s+/g, '');
    logoEl.innerHTML = `<span class="logo-bracket">&lt;</span><span class="logo-name">${tag}</span><span class="logo-bracket">/&gt;</span>`;
  }
}

const SOCIAL_ICONS = {
  GitHub: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.57 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05a9.32 9.32 0 0 1 2.5-.35c.85 0 1.71.12 2.5.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .28.18.61.69.5A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/></svg>',
  LinkedIn: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
  Upwork: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M18.56 7.6c-1.87 0-3.3 1.23-3.87 3.06-.42-1.83-1.13-3.06-2.6-3.06-1.2 0-2.03.77-2.5 1.79l-.16-1.52H6.85v6.5c0 1.24-.55 2.14-1.6 2.14-1.06 0-1.6-.9-1.6-2.14V7.87H1.06v6.4c0 2.48 1.55 4.3 4.19 4.3 2.34 0 3.6-1.5 3.6-3.9V9.9c.3-.68.86-1.24 1.56-1.24 1.05 0 1.4 1.02 1.4 2.55v5.7h2.6v-5.7c0-.3 0-.6-.03-.87.3-1.06 1-1.7 1.86-1.7 1.6 0 2.55 1.4 2.55 3.36 0 1.97-1 3.36-2.55 3.36-.4 0-.77-.1-1.1-.27l-.4 2.5c.5.2 1.06.32 1.68.32 3.05 0 5.1-2.5 5.1-5.9 0-3.4-2.03-5.94-5.36-5.94z"/></svg>'
};

/** Hero social links (GitHub, LinkedIn) — Upwork lives in the rating pill instead */
function renderHeroLinks() {
  const linksEl = document.getElementById('heroLinks');
  if (!linksEl) return;
  linksEl.innerHTML = portfolioData.personal.socials
    .filter(s => s.name !== 'Upwork')
    .map(s => {
      const nameSpan = s.name === 'GitHub'
        ? `<span class="hero-link-name-neon-violet">${s.name}</span>`
        : `<span>${s.name}</span>`;
      const badge = s.name === 'LinkedIn' ? '<span class="open-to-work-badge">· Open to Work</span>' : '';
      return `
    <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="hero-link">
      ${SOCIAL_ICONS[s.name] || ''}${nameSpan}${badge}
    </a>
  `;
    }).join('');
}

/** Hero Section */
function renderHero() {
  const { personal, hero } = portfolioData;

  const eyebrowEl = document.getElementById('heroEyebrow');
  if (eyebrowEl) eyebrowEl.innerHTML = `<span>${personal.shortRole}</span>`;

  const roleEl = document.getElementById('heroRole');
  if (roleEl) roleEl.textContent = personal.jobTitle.split('|')[0].trim();

  renderHeroLinks();

  const titleEl = document.getElementById('heroTitle');
  if (titleEl) {
    titleEl.innerHTML = hero.titleLines
      .map(line => `<span class="line"><span>${line}</span></span>`)
      .join('');
  }

  const linkedin = personal.socials.find(s => s.name === 'LinkedIn');

  const ctaPrimaryEl = document.getElementById('heroCtaPrimary');
  if (ctaPrimaryEl) {
    ctaPrimaryEl.innerHTML = `${hero.ctas.primary} <span class="arrow">→</span>`;
    if (linkedin) ctaPrimaryEl.href = linkedin.url;
  }

  const ctaSecondaryEl = document.getElementById('heroCtaSecondary');
  if (ctaSecondaryEl) {
    ctaSecondaryEl.textContent = hero.ctas.secondary;
    if (linkedin) ctaSecondaryEl.href = linkedin.url;
  }

  const upwork = personal.socials.find(s => s.name === 'Upwork');
  const ratingEl = document.getElementById('heroRating');
  const ratingTextEl = document.getElementById('heroRatingText');
  if (ratingEl && upwork) ratingEl.href = upwork.url;
  if (ratingTextEl) ratingTextEl.textContent = `${personal.upworkRating} en Upwork`;
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

/** Industries / Rubros Grid */
function renderIndustries() {
  const gridEl = document.getElementById('industriesGrid');
  const countEl = document.getElementById('industriesCount');

  if (countEl) {
    countEl.textContent = `(${String(portfolioData.industries.length).padStart(2, '0')})`;
  }

  if (gridEl) {
    gridEl.innerHTML = portfolioData.industries.map((item, idx) => `
      <div class="industry-card reveal">
        <span class="index mono">${String(idx + 1).padStart(2, '0')}</span>
        <h3>${item.name}</h3>
        <p>${item.summary}</p>
        <div class="stack mono">${item.stack.join(' <span class="plus">+</span> ')}</div>
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
          <ul>${item.description.map(point => `<li>${point}</li>`).join('')}</ul>
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

  const linkedin = personal.socials.find(s => s.name === 'LinkedIn');
  const linkedinEl = document.getElementById('contactLinkedin');
  if (linkedinEl && linkedin) linkedinEl.href = linkedin.url;

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

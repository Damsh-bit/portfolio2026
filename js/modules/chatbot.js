/**
 * =========================================================================
 * CHATBOT WIDGET
 * =========================================================================
 * Floating assistant with an automated menu (about / projects / contact)
 * and a multi-step quote form driven entirely as a chat conversation.
 * A small node-graph script ("NODES") drives bot messages, quick-reply
 * buttons, and text-input steps; answers collected along the quote flow
 * are compiled into a summary and a ready-to-send email.
 */

import { portfolioData } from '../data/portfolio-data.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const QUOTE_FIELDS = [
  { key: 'name', label: 'Nombre' },
  { key: 'contactInfo', label: 'Contacto' },
  { key: 'siteType', label: 'Tipo de sitio' },
  { key: 'hasReference', label: 'Diseño / referencias' },
  { key: 'budget', label: 'Presupuesto' },
  { key: 'timeline', label: 'Tiempo estimado' },
  { key: 'details', label: 'Detalles' }
];

function buildSummaryHtml(answers) {
  const rows = QUOTE_FIELDS.map((f) => `
    <div>
      <span>${escapeHtml(f.label)}</span>
      <strong>${escapeHtml(answers[f.key] || '—')}</strong>
    </div>
  `).join('');
  return `<div class="chat-summary">${rows}</div>`;
}

function buildSummaryLines(answers) {
  return QUOTE_FIELDS.map((f) => `${f.label}: ${answers[f.key] || '-'}`);
}

export function initChatbot() {
  const { personal } = portfolioData;
  const linkedin = personal.socials.find((s) => s.name === 'LinkedIn');

  const fab = document.getElementById('chatFab');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatPanelClose');
  const bodyEl = document.getElementById('chatPanelBody');
  const footerEl = document.getElementById('chatPanelFooter');

  if (!fab || !panel || !closeBtn || !bodyEl || !footerEl) return;

  let started = false;
  let quoteAnswers = {};
  let typingEl = null;
  let requestId = 0; // guards against a stale renderNode() finishing after a newer one started

  // ------------------------------------------------------------------
  // Conversation script: each node is a short bot turn + how the user
  // can respond (quick-reply chips and/or a free-text input).
  // ------------------------------------------------------------------
  const NODES = {
    menu: {
      messages: [
        'Hola 👋 Soy el asistente virtual de Damián.',
        'Puedo contarte sobre él, mostrarte sus proyectos, ponerte en contacto o armar una cotización. ¿Qué te gustaría hacer?'
      ],
      quickReplies: [
        { label: '👋 Conocer a Damián', next: 'about' },
        { label: '📁 Ver proyectos', action: 'scrollToProjects' },
        { label: '✉️ Contactarlo', next: 'contact' },
        { label: '💻 Cotizar un sitio', action: 'resetQuote', next: 'quote_name' }
      ]
    },

    about: {
      messages: [
        `Soy el asistente de <strong>${personal.name}</strong> — ${personal.jobTitle}.`,
        `Trabaja remoto desde Argentina, construyendo y optimizando sitios en producción para agencias de Argentina, España y Estados Unidos.`,
        `Se especializa en temas y plugins a medida, e-commerce con WooCommerce, y Core Web Vitals / SEO técnico.`,
        `Idiomas: ${personal.languagesSummary} · Calificación en Upwork: ${personal.upworkRating}/5 ⭐`
      ],
      quickReplies: [
        { label: '📁 Ver proyectos', action: 'scrollToProjects' },
        { label: '✉️ Contactarlo', next: 'contact' },
        { label: '⬅️ Volver al menú', next: 'menu' }
      ]
    },

    contact: {
      messages: ['Podés escribirle directo por acá 👇'],
      quickReplies: [
        { label: '💼 LinkedIn', href: linkedin ? linkedin.url : '#', external: true },
        { label: '✉️ Email', href: `mailto:${personal.email}` },
        { label: '💻 Cotizar un sitio', action: 'resetQuote', next: 'quote_name' },
        { label: '⬅️ Volver al menú', next: 'menu' }
      ]
    },

    quote_name: {
      messages: [
        'Genial 🚀 Te hago algunas preguntas rápidas para armar tu cotización.',
        'Podés escribir "cancelar" en cualquier momento para volver al menú.',
        '¿Cómo te llamás?'
      ],
      storeKey: 'name',
      input: { placeholder: 'Tu nombre…', next: 'quote_contact' }
    },

    quote_contact: {
      messages: ['¿Cuál es la mejor forma de contactarte? (email o teléfono)'],
      storeKey: 'contactInfo',
      input: { placeholder: 'Email o teléfono…', next: 'quote_type' }
    },

    quote_type: {
      messages: ['¿Qué tipo de sitio necesitás?'],
      storeKey: 'siteType',
      quickReplies: [
        { label: 'Landing page', value: 'Landing page', next: 'quote_reference' },
        { label: 'Tienda online', value: 'Tienda online (e-commerce)', next: 'quote_reference' },
        { label: 'Sitio corporativo', value: 'Sitio corporativo', next: 'quote_reference' },
        { label: 'Web app a medida', value: 'Web app / sistema a medida', next: 'quote_reference' },
        { label: 'Otro', value: 'Otro', next: 'quote_reference' }
      ]
    },

    quote_reference: {
      messages: ['¿Ya tenés diseño o referencias definidas?'],
      storeKey: 'hasReference',
      quickReplies: [
        { label: 'Sí, tengo referencias', value: 'Sí, tiene referencias/diseño', next: 'quote_budget' },
        { label: 'No, necesito ayuda', value: 'No, necesita ayuda con el diseño', next: 'quote_budget' },
        { label: 'Tengo una idea', value: 'Tiene una idea, sin definir', next: 'quote_budget' }
      ]
    },

    quote_budget: {
      messages: ['¿Cuál es tu presupuesto aproximado?'],
      storeKey: 'budget',
      quickReplies: [
        { label: 'Menos de USD 500', value: 'Menos de USD 500', next: 'quote_timeline' },
        { label: 'USD 500 – 1500', value: 'USD 500 – 1500', next: 'quote_timeline' },
        { label: 'USD 1500 – 3000', value: 'USD 1500 – 3000', next: 'quote_timeline' },
        { label: 'Más de USD 3000', value: 'Más de USD 3000', next: 'quote_timeline' },
        { label: 'Prefiero conversarlo', value: 'Prefiere conversarlo', next: 'quote_timeline' }
      ]
    },

    quote_timeline: {
      messages: ['¿Para cuándo lo necesitás?'],
      storeKey: 'timeline',
      quickReplies: [
        { label: 'Lo antes posible', value: 'Lo antes posible', next: 'quote_details' },
        { label: 'En 1 mes', value: 'En las próximas semanas', next: 'quote_details' },
        { label: 'En 2-3 meses', value: 'En 2 a 3 meses', next: 'quote_details' },
        { label: 'Sin apuro', value: 'Sin apuro', next: 'quote_details' }
      ]
    },

    quote_details: {
      messages: ['Contame un poco más sobre tu proyecto (opcional).'],
      storeKey: 'details',
      input: { placeholder: 'Escribí tu respuesta…', next: 'quote_summary' },
      quickReplies: [
        { label: 'Omitir', value: '—', next: 'quote_summary' }
      ]
    },

    quote_summary: {
      messages: (answers) => [
        '¡Listo! 🎉 Este es el resumen de tu cotización:',
        buildSummaryHtml(answers),
        'Le va a llegar a Damián para que te responda a la brevedad.'
      ],
      quickReplies: [
        { label: '📩 Enviar por email', action: 'sendQuoteEmail' },
        { label: '📋 Copiar resumen', action: 'copySummary' },
        { label: '🔄 Nueva cotización', action: 'resetQuote', next: 'quote_name' },
        { label: '⬅️ Volver al menú', next: 'menu' }
      ]
    }
  };

  // ------------------------------------------------------------------
  // Rendering helpers
  // ------------------------------------------------------------------

  function scrollToBottom() {
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function appendMessage(role, content, { html = false } = {}) {
    const row = document.createElement('div');
    row.className = `chat-msg chat-msg-${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble';
    if (html) bubble.innerHTML = content;
    else bubble.textContent = content;
    row.appendChild(bubble);
    bodyEl.appendChild(row);
    if (window.gsap) {
      gsap.fromTo(row, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, ease: 'power2.out' });
    }
    scrollToBottom();
  }

  function showTyping() {
    typingEl = document.createElement('div');
    typingEl.className = 'chat-msg chat-msg-bot';
    typingEl.innerHTML = '<div class="chat-msg-bubble chat-typing"><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span></div>';
    bodyEl.appendChild(typingEl);
    if (window.gsap) gsap.fromTo(typingEl, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    scrollToBottom();
  }

  function hideTyping() {
    if (typingEl) {
      typingEl.remove();
      typingEl = null;
    }
  }

  async function playBotMessages(messages, myRequestId) {
    for (const msg of messages) {
      await wait(350 + Math.random() * 200);
      if (myRequestId !== requestId) return false;

      showTyping();
      await wait(400 + Math.min(650, msg.length * 7));
      if (myRequestId !== requestId) return false;

      hideTyping();
      appendMessage('bot', msg, { html: true });
    }
    return true;
  }

  function clearFooter() {
    footerEl.innerHTML = '';
  }

  function renderFooter(node) {
    clearFooter();

    if (node.quickReplies && node.quickReplies.length) {
      const wrap = document.createElement('div');
      wrap.className = 'chat-quick-replies';
      node.quickReplies.forEach((reply) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chat-quick-reply';
        btn.textContent = reply.label;
        btn.addEventListener('click', () => handleReply(node, reply));
        wrap.appendChild(btn);
      });
      footerEl.appendChild(wrap);
      if (window.gsap) {
        gsap.fromTo(wrap.children, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, stagger: 0.04, ease: 'power2.out' });
      }
    }

    if (node.input) {
      const row = document.createElement('form');
      row.className = 'chat-input-row';
      row.innerHTML = `
        <input type="text" class="chat-input" placeholder="${escapeHtml(node.input.placeholder || 'Escribí tu respuesta…')}" autocomplete="off" />
        <button type="submit" class="chat-send-btn" aria-label="Enviar">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      `;
      const input = row.querySelector('.chat-input');
      row.addEventListener('submit', (e) => {
        e.preventDefault();
        handleTextSubmit(node, input.value);
      });
      footerEl.appendChild(row);
      if (panel.classList.contains('is-open')) {
        requestAnimationFrame(() => input.focus());
      }
    }
  }

  async function renderNode(nodeId) {
    const node = NODES[nodeId];
    if (!node) return;

    const myRequestId = ++requestId;
    clearFooter();

    const rawMessages = typeof node.messages === 'function' ? node.messages(quoteAnswers) : node.messages;
    const finished = await playBotMessages(rawMessages, myRequestId);
    if (!finished) return;

    renderFooter(node);
  }

  const actions = {
    scrollToProjects() {
      close();
      const el = document.getElementById('work');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    },
    resetQuote() {
      quoteAnswers = {};
    },
    sendQuoteEmail() {
      const subject = `Cotización de sitio web — ${quoteAnswers.name || 'Nueva consulta'}`;
      const body = [...buildSummaryLines(quoteAnswers), '', 'Enviado desde el chatbot del portfolio.'].join('\n');
      window.location.href = `mailto:${personal.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      appendMessage('bot', `¡Se abrió tu cliente de correo con todo listo para enviar! 📬 Si no pasó nada, escribile directo a ${personal.email}.`, { html: false });
    },
    copySummary() {
      const text = buildSummaryLines(quoteAnswers).join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => appendMessage('bot', 'Resumen copiado al portapapeles ✅'))
          .catch(() => appendMessage('bot', 'No pude copiarlo automáticamente — podés seleccionar el resumen de arriba manualmente.'));
      } else {
        appendMessage('bot', 'Tu navegador no permite copiar automáticamente — podés seleccionar el resumen de arriba manualmente.');
      }
    }
  };

  function handleReply(node, reply) {
    appendMessage('user', reply.label);

    if (reply.href) {
      if (reply.external) window.open(reply.href, '_blank', 'noopener');
      else window.location.href = reply.href;
    }

    if (reply.action && actions[reply.action]) actions[reply.action]();

    if (node.storeKey && Object.prototype.hasOwnProperty.call(reply, 'value')) {
      quoteAnswers[node.storeKey] = reply.value;
    }

    if (reply.next) renderNode(reply.next);
  }

  function handleTextSubmit(node, rawValue) {
    const value = rawValue.trim();
    if (!value) return;

    appendMessage('user', value);

    if (value.toLowerCase() === 'cancelar') {
      quoteAnswers = {};
      renderNode('menu');
      return;
    }

    if (node.storeKey) quoteAnswers[node.storeKey] = value;
    if (node.input && node.input.next) renderNode(node.input.next);
  }

  // ------------------------------------------------------------------
  // Open / close
  // ------------------------------------------------------------------

  function open() {
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    fab.setAttribute('aria-expanded', 'true');
    document.body.classList.add('chat-open', 'chat-greeted');

    if (window.gsap) {
      gsap.fromTo(panel,
        { opacity: 0, y: 16, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' }
      );
    } else {
      panel.style.opacity = '1';
    }

    if (!started) {
      started = true;
      renderNode('menu');
    }
  }

  function close() {
    document.body.classList.remove('chat-open');
    fab.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');

    if (window.gsap) {
      gsap.to(panel, {
        opacity: 0, y: 12, scale: 0.97, duration: 0.22, ease: 'power2.in',
        onComplete: () => panel.classList.remove('is-open')
      });
    } else {
      panel.style.opacity = '0';
      panel.classList.remove('is-open');
    }
  }

  fab.addEventListener('click', () => {
    if (panel.classList.contains('is-open')) close();
    else open();
  });

  closeBtn.addEventListener('click', close);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) close();
  });

  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('is-open')) return;
    // Use composedPath (captured at dispatch time) rather than e.target: a
    // quick-reply click can synchronously clear the footer and detach the
    // clicked button before this bubbles up, which would make a plain
    // panel.contains(e.target) check see it as already "outside".
    const path = e.composedPath ? e.composedPath() : [e.target];
    if (path.includes(panel) || path.includes(fab)) return;
    close();
  });
}

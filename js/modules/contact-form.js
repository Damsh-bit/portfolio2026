/**
 * =========================================================================
 * CONTACT FORM CONTROLLER
 * =========================================================================
 * Validates the contact form and hands the message off via a mailto: link
 * (this is a static site with no backend, so there is nowhere to POST it).
 * The visitor's email client opens with the subject/body pre-filled —
 * they only need to hit send.
 */

import { portfolioData } from '../data/portfolio-data.js';

export function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const fields = {
    name: { input: document.getElementById('cfName'), error: document.getElementById('cfNameError') },
    email: { input: document.getElementById('cfEmail'), error: document.getElementById('cfEmailError') },
    message: { input: document.getElementById('cfMessage'), error: document.getElementById('cfMessageError') }
  };
  const note = document.getElementById('formNote');

  function validate() {
    let valid = true;
    Object.values(fields).forEach((f) => {
      f.error.textContent = '';
      f.input.classList.remove('invalid');
    });

    if (!fields.name.input.value.trim()) {
      fields.name.error.textContent = 'Ingresá tu nombre.';
      fields.name.input.classList.add('invalid');
      valid = false;
    }

    const emailVal = fields.email.input.value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
    if (!emailOk) {
      fields.email.error.textContent = 'Ingresá un email válido.';
      fields.email.input.classList.add('invalid');
      valid = false;
    }

    if (!fields.message.input.value.trim()) {
      fields.message.error.textContent = 'Escribí un mensaje.';
      fields.message.input.classList.add('invalid');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    note.textContent = '';

    if (!validate()) return;

    const name = fields.name.input.value.trim();
    const senderEmail = fields.email.input.value.trim();
    const message = fields.message.input.value.trim();

    const subject = encodeURIComponent(`Contacto desde portfolio — ${name}`);
    const body = encodeURIComponent(`${message}\n\n---\nDe: ${name} (${senderEmail})`);

    window.location.href = `mailto:${portfolioData.personal.email}?subject=${subject}&body=${body}`;

    note.textContent = 'Se abrió tu cliente de email con el mensaje listo para enviar.';
  });
}

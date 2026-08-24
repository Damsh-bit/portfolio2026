/**
 * =========================================================================
 * CONTACT FORM CONTROLLER
 * =========================================================================
 * Validates every form marked [data-contact-form] (the contact section form
 * and the hero popup form) and hands the message off via a mailto: link
 * (this is a static site with no backend, so there is nowhere to POST it).
 * The visitor's email client opens with the subject/body pre-filled —
 * they only need to hit send.
 */

import { portfolioData } from '../data/portfolio-data.js';

export function initContactForm() {
  document.querySelectorAll('form[data-contact-form]').forEach(initSingleForm);
}

function initSingleForm(form) {
  const fields = {
    name: form.querySelector('[name="name"]'),
    email: form.querySelector('[name="email"]'),
    message: form.querySelector('[name="message"]')
  };
  const note = form.querySelector('.form-note');

  function errorFor(input) {
    return input.closest('.form-row').querySelector('.form-error');
  }

  function validate() {
    let valid = true;
    Object.values(fields).forEach((input) => {
      errorFor(input).textContent = '';
      input.classList.remove('invalid');
    });

    if (!fields.name.value.trim()) {
      errorFor(fields.name).textContent = 'Ingresá tu nombre.';
      fields.name.classList.add('invalid');
      valid = false;
    }

    const emailVal = fields.email.value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
    if (!emailOk) {
      errorFor(fields.email).textContent = 'Ingresá un email válido.';
      fields.email.classList.add('invalid');
      valid = false;
    }

    if (!fields.message.value.trim()) {
      errorFor(fields.message).textContent = 'Escribí un mensaje.';
      fields.message.classList.add('invalid');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (note) note.textContent = '';

    if (!validate()) return;

    const name = fields.name.value.trim();
    const senderEmail = fields.email.value.trim();
    const message = fields.message.value.trim();

    const subject = encodeURIComponent(`Contacto desde portfolio — ${name}`);
    const body = encodeURIComponent(`${message}\n\n---\nDe: ${name} (${senderEmail})`);

    window.location.href = `mailto:${portfolioData.personal.email}?subject=${subject}&body=${body}`;

    if (note) note.textContent = 'Se abrió tu cliente de email con el mensaje listo para enviar.';
  });
}

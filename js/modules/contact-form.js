/**
 * =========================================================================
 * CONTACT FORM CONTROLLER
 * =========================================================================
 * Validates every form marked [data-contact-form] (the contact section form
 * and the hero popup form) and submits it to mail/send.php, which relays
 * the message through Hostinger's SMTP mailer via PHPMailer.
 */

const ENDPOINT = '/mail/send.php';

export function initContactForm() {
  document.querySelectorAll('form[data-contact-form]').forEach(initSingleForm);
}

function initSingleForm(form) {
  const fields = {
    name: form.querySelector('[name="name"]'),
    email: form.querySelector('[name="email"]'),
    message: form.querySelector('[name="message"]')
  };
  const honeypot = form.querySelector('[name="website"]');
  const note = form.querySelector('.form-note');
  const submitBtn = form.querySelector('.form-submit');

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (note) {
      note.textContent = '';
      note.classList.remove('is-error');
    }

    if (!validate()) return;

    const payload = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      message: fields.message.value.trim(),
      website: honeypot ? honeypot.value.trim() : ''
    };

    if (submitBtn) submitBtn.disabled = true;
    if (note) note.textContent = 'Enviando…';

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'No se pudo enviar el mensaje.');
      }

      if (note) note.textContent = data.message || 'Mensaje enviado. Te responderé a la brevedad.';
      form.reset();
    } catch (err) {
      if (note) {
        note.textContent = err.message || 'No se pudo enviar el mensaje. Intentá de nuevo más tarde.';
        note.classList.add('is-error');
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/**
 * =========================================================================
 * TYPEWRITER TITLE ANIMATIONS
 * =========================================================================
 * HTML-aware character-by-character typing effect for important titles.
 * Tags (e.g. <em>, <br>) are inserted atomically so inline markup embedded
 * in the source text is never broken mid-type.
 */

const TYPE_SPEED_MS = 32;

function parseIntoSteps(html) {
  const steps = [];
  let i = 0;

  while (i < html.length) {
    if (html[i] === '<') {
      const close = html.indexOf('>', i);
      if (close === -1) {
        steps.push({ type: 'char', value: html[i] });
        i++;
      } else {
        steps.push({ type: 'tag', value: html.slice(i, close + 1) });
        i = close + 1;
      }
    } else {
      steps.push({ type: 'char', value: html[i] });
      i++;
    }
  }

  return steps;
}

function typeInto(el, html, onDone) {
  const steps = parseIntoSteps(html);
  const caret = document.createElement('span');
  caret.className = 'type-caret';
  caret.textContent = '|';

  el.innerHTML = '';
  el.appendChild(caret);

  let buffer = '';
  let index = 0;

  function tick() {
    if (index >= steps.length) {
      caret.remove();
      if (onDone) onDone();
      return;
    }

    buffer += steps[index].value;
    index++;
    el.innerHTML = buffer;
    el.appendChild(caret);

    setTimeout(tick, TYPE_SPEED_MS);
  }

  tick();
}

function typeHeroTitle(titleEl) {
  const lineSpans = Array.from(titleEl.querySelectorAll('.line > span'));
  if (!lineSpans.length) return;

  const originals = lineSpans.map((span) => span.innerHTML);
  lineSpans.forEach((span) => { span.innerHTML = ''; });

  function typeLine(idx) {
    if (idx >= lineSpans.length) return;
    typeInto(lineSpans[idx], originals[idx], () => typeLine(idx + 1));
  }

  typeLine(0);
}

function initSectionTypewriters() {
  const titles = document.querySelectorAll('h2[data-typewriter]');
  if (!titles.length) return;

  const hasScrollTrigger = typeof ScrollTrigger !== 'undefined';

  titles.forEach((el) => {
    const original = el.innerHTML;
    el.style.opacity = '1';
    el.innerHTML = '';

    if (!hasScrollTrigger) {
      el.innerHTML = original;
      return;
    }

    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => typeInto(el, original)
    });
  });
}

export function initTyping() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroTitle = document.getElementById('heroTitle');

  if (reducedMotion) {
    document.querySelectorAll('h2[data-typewriter]').forEach((el) => {
      el.style.opacity = '1';
    });
    return;
  }

  if (heroTitle) typeHeroTitle(heroTitle);
  initSectionTypewriters();
}

/**
 * =========================================================================
 * TYPEWRITER TITLE ANIMATIONS
 * =========================================================================
 * HTML-aware character-by-character typing effect for important titles.
 * Tags (e.g. <em>, <br>) are inserted atomically so inline markup embedded
 * in the source text is never broken mid-type. Once a title finishes typing
 * it pauses, erases itself, and types back in — looping indefinitely.
 */

const TYPE_SPEED_MS = 32;
const LOOP_PAUSE_MS = 3000;

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

function renderStep(el, steps, count, caret) {
  el.innerHTML = steps.slice(0, count).map((s) => s.value).join('');
  el.appendChild(caret);
}

function typeInto(el, html, onDone) {
  const steps = parseIntoSteps(html);
  const caret = document.createElement('span');
  caret.className = 'type-caret';
  caret.textContent = '|';

  el.innerHTML = '';
  el.appendChild(caret);

  let index = 0;

  function tick() {
    if (index >= steps.length) {
      caret.remove();
      if (onDone) onDone();
      return;
    }
    index++;
    renderStep(el, steps, index, caret);
    setTimeout(tick, TYPE_SPEED_MS);
  }

  tick();
}

function eraseFrom(el, html, onDone) {
  const steps = parseIntoSteps(html);
  const caret = document.createElement('span');
  caret.className = 'type-caret';
  caret.textContent = '|';

  let index = steps.length;
  renderStep(el, steps, index, caret);

  function tick() {
    if (index <= 0) {
      el.innerHTML = '';
      caret.remove();
      if (onDone) onDone();
      return;
    }
    index--;
    renderStep(el, steps, index, caret);
    setTimeout(tick, TYPE_SPEED_MS);
  }

  setTimeout(tick, TYPE_SPEED_MS);
}

/** Types the given title in, waits, erases it, then repeats forever. */
function loopTitle(el, html) {
  function cycle() {
    typeInto(el, html, () => {
      setTimeout(() => eraseFrom(el, html, cycle), LOOP_PAUSE_MS);
    });
  }
  cycle();
}

function typeHeroTitle(titleEl) {
  const lineSpans = Array.from(titleEl.querySelectorAll('.line > span'));
  if (!lineSpans.length) return;

  const originals = lineSpans.map((span) => span.innerHTML);
  lineSpans.forEach((span) => { span.innerHTML = ''; });

  function typeAll(onDone) {
    function step(idx) {
      if (idx >= lineSpans.length) { onDone(); return; }
      typeInto(lineSpans[idx], originals[idx], () => step(idx + 1));
    }
    step(0);
  }

  function eraseAll(onDone) {
    function step(idx) {
      if (idx < 0) { onDone(); return; }
      eraseFrom(lineSpans[idx], originals[idx], () => step(idx - 1));
    }
    step(lineSpans.length - 1);
  }

  function cycle() {
    typeAll(() => {
      setTimeout(() => eraseAll(cycle), LOOP_PAUSE_MS);
    });
  }

  cycle();
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
      onEnter: () => loopTitle(el, original)
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

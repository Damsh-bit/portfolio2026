/**
 * =========================================================================
 * SHIP DASHBOARD
 * =========================================================================
 * Minimalist bottom-right HUD readout: Buenos Aires weather, local time,
 * and when the portfolio was last actually updated (the repo's latest
 * commit, via GitHub's public API). No visitor/analytics stats — this is
 * a static site with no backend, and fabricating numbers to look like real
 * tracking would be dishonest, so those are left out rather than faked.
 */

const BUENOS_AIRES = { lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires' };
const REPO = 'Damsh-bit/portfolio2026';

// WMO weather codes (Open-Meteo) collapsed to a small glyph set
const WEATHER_ICONS = {
  0: '☀', 1: '🌤', 2: '⛅', 3: '☁',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌦',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '🌨', 75: '🌨',
  80: '🌦', 81: '🌧', 82: '⛈',
  95: '⛈', 96: '⛈', 99: '⛈'
};

function formatRelativeDate(iso) {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months}m`;
  return `hace ${Math.floor(months / 12)}a`;
}

export function initShipDashboard() {
  const root = document.getElementById('shipDashboard');
  if (!root) return;

  const timeEl = document.getElementById('shipTime');
  const weatherEl = document.getElementById('shipWeather');
  const updatedEl = document.getElementById('shipUpdated');

  function tickClock() {
    if (!timeEl) return;
    timeEl.textContent = new Intl.DateTimeFormat('es-AR', {
      timeZone: BUENOS_AIRES.tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date());
  }
  tickClock();
  setInterval(tickClock, 1000);

  if (weatherEl) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${BUENOS_AIRES.lat}&longitude=${BUENOS_AIRES.lon}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(BUENOS_AIRES.tz)}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        const c = data.current;
        const icon = WEATHER_ICONS[c.weather_code] || '·';
        weatherEl.textContent = `${Math.round(c.temperature_2m)}°C ${icon}`;
      })
      .catch(() => { weatherEl.textContent = '—'; });
  }

  if (updatedEl) {
    fetch(`https://api.github.com/repos/${REPO}/commits?per_page=1`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((commits) => {
        const date = commits && commits[0] && commits[0].commit && commits[0].commit.committer.date;
        updatedEl.textContent = date ? formatRelativeDate(date) : '—';
      })
      .catch(() => { updatedEl.textContent = '—'; });
  }
}

// ============================================================
// COTIZACIÓN DEL DÓLAR (DolarAPI con fallback)
// ============================================================

const STORAGE_KEY = 'nexotribu_dolar_v1';

// Valores por defecto si todo falla
const FALLBACK = {
  rate: 1580,
  source: 'fallback',
  updated_at: null,
};

let cachedRate = null;
let cachedSource = 'fallback';
let cachedUpdated = null;

export function getDolarRate() {
  if (cachedRate) {
    return {
      rate: cachedRate,
      source: cachedSource,
      updated_at: cachedUpdated,
    };
  }
  loadFromStorage();
  return {
    rate: cachedRate || FALLBACK.rate,
    source: cachedSource,
    updated_at: cachedUpdated,
  };
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d.rate) {
        cachedRate = d.rate;
        cachedSource = d.source || 'cache';
        cachedUpdated = d.updated_at;
      }
    }
  } catch (e) {
    // ignore
  }
}

export async function fetchDolarMEP() {
  const sources = [
    { url: 'https://dolarapi.com/v1/dolares/bolsa', label: 'MEP' },
    { url: 'https://dolarapi.com/v1/dolares/blue', label: 'Blue' },
    { url: 'https://dolarapi.com/v1/dolares/cripto', label: 'Cripto' },
  ];

  for (const s of sources) {
    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 5000);

      const res = await fetch(s.url, { signal: ctrl.signal });
      clearTimeout(timeoutId);

      if (!res.ok) continue;
      const data = await res.json();
      if (!data || !data.venta) continue;

      cachedRate = data.venta;
      cachedSource = s.label;
      cachedUpdated = data.fechaActualizacion || new Date().toISOString();

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            rate: cachedRate,
            source: cachedSource,
            updated_at: cachedUpdated,
          })
        );
      } catch (e) {
        // ignore
      }

      return {
        rate: cachedRate,
        source: cachedSource,
        updated_at: cachedUpdated,
      };
    } catch (e) {
      // intentar la próxima fuente
    }
  }

  // Todas fallaron
  return getDolarRate();
}

export function formatUpdatedAt(dateStr) {
  if (!dateStr) return 'sin actualizar';
  try {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return 'sin actualizar';
  }
}
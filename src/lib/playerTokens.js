// ============================================================
// GESTIÓN DE TOKENS DE JUGADOR (localStorage)
// ============================================================

const STORAGE_KEY = 'nexotribu_player_tokens';

/**
 * Obtiene todos los tokens guardados
 * Estructura: [{ token, tournament_slug, tournament_name, email, saved_at }]
 */
export function getSavedTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Error leyendo tokens:', err);
    return [];
  }
}

/**
 * Guarda un nuevo token (evita duplicados)
 */
export function saveToken({ token, tournament_slug, tournament_name, email }) {
  if (!token) return;
  const tokens = getSavedTokens();
  const existing = tokens.find((t) => t.token === token);
  if (existing) {
    // Actualizar info si cambió
    existing.tournament_slug = tournament_slug;
    existing.tournament_name = tournament_name;
    existing.email = email;
  } else {
    tokens.push({
      token,
      tournament_slug,
      tournament_name,
      email,
      saved_at: new Date().toISOString(),
    });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

/**
 * Elimina un token específico
 */
export function removeToken(token) {
  const tokens = getSavedTokens().filter((t) => t.token !== token);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

/**
 * Limpia todos los tokens
 */
export function clearAllTokens() {
  localStorage.removeItem(STORAGE_KEY);
}
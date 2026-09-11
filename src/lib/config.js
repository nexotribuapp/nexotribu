// ============================================================
// CONFIGURACIÓN GLOBAL DE LA PLATAFORMA
// Actualizá estos valores cuando tengas las URLs reales
// ============================================================

export const BRAND = {
  name: 'NexoTribu',
  contact_email: 'contacto@nexotribu.app',

  // Redes oficiales
  discord_url: 'https://discord.gg/nexotribu',   // ← CAMBIAR cuando tengas el server
  telegram_url: 'https://t.me/nexotribu',        // ← CAMBIAR cuando tengas el canal
  instagram_url: 'https://instagram.com/nexotribu',

  // Juegos soportados
  games: [
    {
      id: 'eFootball',
      label: 'eFootball',
      icon: '⚽',
      game_id_label: 'Usuario de eFootball',
      game_id_placeholder: 'Ej: JUANP_10',
      game_id_help: 'Tu nombre de usuario en el juego (Konami ID).',
    },
    {
      id: 'EA FC',
      label: 'EA FC',
      icon: '🎮',
      game_id_label: 'ID de EA / PSN / Xbox',
      game_id_placeholder: 'Ej: JuanP_FC26',
      game_id_help: 'Tu EA ID, PSN ID o Gamertag de Xbox.',
    },
  ],
};

export function getGameConfig(gameId) {
  return BRAND.games.find((g) => g.id === gameId) || BRAND.games[0];
}
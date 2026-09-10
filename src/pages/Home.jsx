import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      setTournaments(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ padding: '40px 0' }}>
      <section style={{ padding: '20px 0 40px' }}>
        <h1 style={{
          fontSize: 'clamp(30px, 5vw, 52px)',
          fontWeight: 800,
          letterSpacing: '-1.5px',
          lineHeight: 1.05,
          marginBottom: '14px',
        }}>
          Competiciones de{' '}
          <span style={{
            background: 'linear-gradient(120deg, #00e0ff, #7b5cff 60%, #ff3d71)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            habilidad
          </span>{' '}
          en eFootball y EA FC
        </h1>
        <p style={{ color: '#8a94a8', fontSize: '17px', maxWidth: '640px' }}>
          Inscribite con tu email. Reporta resultados desde tu panel.
          Historial verificable con captura de cada partido y cada premio.
        </p>
      </section>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        margin: '20px 0', flexWrap: 'wrap', gap: '12px',
      }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Inscripciones abiertas</h2>
        <span className="pill green">{tournaments.length} disponibles</span>
      </div>

      {loading ? (
        <div className="empty">
          <span className="spinner"></span>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="empty">
          <p style={{ marginBottom: '16px' }}>Todavía no hay torneos abiertos.</p>
          <p className="muted" style={{ fontSize: '13px' }}>
            Si sos organizador, <a href="/login" style={{ color: '#00e0ff' }}>creá tu primer torneo</a>.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {tournaments.map((t) => {
            const typeLabel = t.type === '1v1' ? '1 vs 1' : t.type === 'liga' ? 'Liga' : 'Coop 2v2';
            const hasBanner = t.banner_url && t.banner_url.trim();
            return (
              <a
                key={t.id}
                href={`/torneo/${t.slug}`}
                style={{
                  background: 'linear-gradient(180deg, #161d2e 0%, #1c2438 100%)',
                  border: '1px solid #232c44',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  transition: '0.22s',
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{
                  height: '140px',
                  background: hasBanner
                    ? `url(${t.banner_url}) center/cover`
                    : 'linear-gradient(135deg, #1a2540, #0e1524)',
                  display: 'grid',
                  placeItems: 'center',
                }}>
                  {!hasBanner && (
                    <span style={{ fontSize: '48px', opacity: 0.4 }}>
                      {t.game === 'eFootball' ? '⚽' : '🎮'}
                    </span>
                  )}
                </div>
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.3px' }}>
                    {t.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="pill blue">{typeLabel}</span>
                    <span className="pill">{t.platform || '—'}</span>
                    {t.is_paid ? (
                      <span className="pill yellow">USD {t.price}</span>
                    ) : (
                      <span className="pill green">Gratis</span>
                    )}
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    paddingTop: '12px', borderTop: '1px solid #232c44',
                    fontSize: '13px', color: '#8a94a8', marginTop: 'auto',
                  }}>
                    <span>{t.prize || 'A definir'}</span>
                    <span>Ver más →</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
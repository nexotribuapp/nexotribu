import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Panel({ user, organizer }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setTournaments(data || []);
      setLoading(false);
    }
    load();
  }, [user.id]);

  const initials = organizer?.name?.charAt(0)?.toUpperCase() || '?';

  // Contadores
  const totalParticipants = tournaments.reduce((acc, t) => acc, 0);
  const openCount = tournaments.filter((t) => t.status === 'open').length;
  const finishedCount = tournaments.filter((t) => t.status === 'finished').length;

  // Filtro
  const filtered = tournaments.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'open') return t.status === 'open';
    if (filter === 'in_progress') return t.status === 'in_progress';
    if (filter === 'finished') return t.status === 'finished';
    return true;
  });

  return (
    <div style={{ padding: '40px 0' }}>
      {/* HEADER CON CARD PRO */}
      <div className="pro-card">
        <div className="pro-card-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #ffd166, #ffb02e)',
              display: 'grid', placeItems: 'center',
              fontSize: '26px', fontWeight: 800, color: '#1a1408',
              boxShadow: '0 4px 16px rgba(255, 176, 46, 0.4)',
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  margin: 0,
                }} className="pro-text-gradient">
                  {organizer?.name}
                </h2>
                <span className="pro-badge">⭐ PLAN PRO</span>
              </div>
              <p className="muted" style={{ fontSize: '13px' }}>
                {user.email}
              </p>
            </div>
            <div style={{
              padding: '12px 18px',
              background: 'rgba(255, 209, 102, 0.08)',
              border: '1px solid rgba(255, 209, 102, 0.3)',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Estado
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#22d67f', marginTop: '2px' }}>
                Activo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px', marginBottom: '32px',
      }}>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Mis torneos</div>
          <div style={{ fontSize: '26px', fontWeight: 800 }}>{tournaments.length}</div>
        </div>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Abiertos</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#22d67f' }}>{openCount}</div>
        </div>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Finalizados</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ff3d71' }}>{finishedCount}</div>
        </div>
      </div>

      {/* TÍTULO + BOTÓN CREAR */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Mis torneos</h3>
        <Link to="/panel/crear" className="btn btn-primary">
          + Crear torneo
        </Link>
      </div>

      {/* FILTROS */}
      {tournaments.length > 0 && (
        <div style={{
          display: 'flex', gap: '6px', marginBottom: '20px',
          borderBottom: '1px solid #232c44', paddingBottom: '12px',
          overflowX: 'auto',
        }}>
          {[
            { id: 'all', label: 'Todos', count: tournaments.length },
            { id: 'open', label: 'Abiertos', count: openCount },
            { id: 'finished', label: 'Finalizados', count: finishedCount },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '9px',
                fontSize: '13px',
                fontWeight: 600,
                background: filter === f.id ? 'rgba(0, 224, 255, 0.08)' : 'transparent',
                color: filter === f.id ? '#00e0ff' : '#8a94a8',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: '0.18s',
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      )}

      {/* LISTA */}
      {loading ? (
        <div className="empty">
          <span className="spinner"></span>
          <p style={{ marginTop: '12px' }}>Cargando torneos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <p style={{ marginBottom: '16px' }}>
            {tournaments.length === 0
              ? 'Todavía no creaste ningún torneo.'
              : 'No hay torneos con ese filtro.'}
          </p>
          {tournaments.length === 0 && (
            <Link to="/panel/crear" className="btn btn-primary">
              + Crear mi primer torneo
            </Link>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {filtered.map((t) => (
            <Link
              key={t.id}
              to={`/panel/torneo/${t.id}`}
              style={{
                background: 'linear-gradient(180deg, #161d2e 0%, #1c2438 100%)',
                border: '1px solid #232c44', borderRadius: '14px',
                overflow: 'hidden', transition: '0.22s',
                textDecoration: 'none', color: 'inherit',
                display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{
                height: '140px',
                background: t.banner_url
                  ? `url(${t.banner_url}) center/cover`
                  : 'linear-gradient(135deg, #1a2540, #0e1524)',
                position: 'relative',
                display: 'grid', placeItems: 'center',
              }}>
                {!t.banner_url && (
                  <span style={{ fontSize: '44px', opacity: 0.4 }}>
                    {t.game === 'eFootball' ? '⚽' : '🎮'}
                  </span>
                )}
                <span
                  className={`pill ${t.status === 'open' ? 'green' : t.status === 'finished' ? 'red' : 'blue'}`}
                  style={{ position: 'absolute', top: '12px', right: '12px' }}
                >
                  {t.status === 'open' ? 'Abierto' : t.status === 'finished' ? 'Finalizado' : 'En curso'}
                </span>
              </div>

              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.3px' }}>
                  {t.name}
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="pill blue">{t.type === '1v1' ? '1 vs 1' : t.type === 'liga' ? 'Liga' : 'Coop 2v2'}</span>
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
                  <span>{t.max_participants} cupos</span>
                  <span>Gestionar →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
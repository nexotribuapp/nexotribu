import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Panel({ user, organizer }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '18px',
        background: 'linear-gradient(120deg, #161d2e, #1c2438)',
        border: '1px solid #232c44', borderRadius: '16px',
        padding: '22px', marginBottom: '24px', flexWrap: 'wrap',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #00e0ff, #7b5cff)',
          display: 'grid', placeItems: 'center',
          fontSize: '26px', fontWeight: 800, color: '#04121f',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            {organizer?.name}
          </h2>
          <p className="muted" style={{ fontSize: '13px' }}>
            {user.email} &middot; <span className="pill green">Aprobado</span>
          </p>
        </div>
      </div>

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
          <div className="muted" style={{ fontSize: '12px' }}>Estado</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#22d67f' }}>Activo</div>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Mis torneos</h3>
        <Link to="/panel/crear" className="btn btn-primary">
          + Crear torneo
        </Link>
      </div>

      {loading ? (
        <div className="empty">
          <span className="spinner"></span>
          <p style={{ marginTop: '12px' }}>Cargando torneos...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="empty">
          <p style={{ marginBottom: '16px' }}>Todavía no creaste ningún torneo.</p>
          <Link to="/panel/crear" className="btn btn-primary">
            + Crear mi primer torneo
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {tournaments.map((t) => (
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
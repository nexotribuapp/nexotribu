import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Panel({ user, organizer }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
      {/* HEADER */}
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
          <div className="muted" style={{ fontSize: '12px' }}>Estado</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#22d67f' }}>Activo</div>
        </div>
      </div>

      {/* CREAR TORNEO */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Mis torneos</h3>
        <button className="btn btn-primary" disabled>
          + Crear torneo (próximamente)
        </button>
      </div>

      {/* LISTA DE TORNEOS */}
      {loading ? (
        <div className="empty">
          <span className="spinner"></span>
          <p style={{ marginTop: '12px' }}>Cargando torneos...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="empty">
          <p style={{ marginBottom: '16px' }}>Todavía no creaste ningún torneo.</p>
          <p className="muted" style={{ fontSize: '13px' }}>
            Muy pronto vas a poder crear torneos desde acá.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
        }}>
          {tournaments.map((t) => (
            <div key={t.id} className="panel">
              <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                {t.name}
              </h4>
              <p className="muted" style={{ fontSize: '13px' }}>{t.game} &middot; {t.type}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
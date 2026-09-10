import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Torneo() {
  const { slug } = useParams();
  const [tournament, setTournament] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: t, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error || !t) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setTournament(t);

      const { data: o } = await supabase
        .from('organizers')
        .select('name, email')
        .eq('id', t.organizer_id)
        .maybeSingle();

      setOrganizer(o);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#e7ecf5' }}>
          Torneo no encontrado
        </h2>
        <p style={{ marginBottom: '20px' }}>Este torneo no existe o fue eliminado.</p>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    );
  }

  const rules = tournament.rules || [];
  const typeLabel = tournament.type === '1v1' ? '1 vs 1' : tournament.type === 'liga' ? 'Liga' : 'Coop 2v2';
  const hasBanner = tournament.banner_url && tournament.banner_url.trim();

  return (
    <div style={{ padding: '30px 0' }}>
      <Link to="/" className="muted" style={{ fontSize: '13px', display: 'inline-block', marginBottom: '20px' }}>
        ← Volver a torneos
      </Link>

      {/* HERO */}
      <div style={{
        position: 'relative',
        borderRadius: '18px',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #161d2e 0%, #1c2438 100%)',
        border: '1px solid #232c44',
        marginBottom: '28px',
      }}>
        <div style={{
          height: '240px',
          background: hasBanner
            ? `url(${tournament.banner_url}) center/cover`
            : 'linear-gradient(135deg, #1a2540, #0e1524)',
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(10,14,26,0.95) 100%)',
          }} />
          {!hasBanner && (
            <span style={{ fontSize: '80px', opacity: 0.4, position: 'relative', zIndex: 2 }}>
              {tournament.game === 'eFootball' ? '⚽' : '🎮'}
            </span>
          )}
        </div>

        <div style={{ padding: '0 32px 32px', marginTop: '-40px', position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <span className="pill blue">{tournament.game}</span>
            <span className="pill">{typeLabel}</span>
            <span className="pill">{tournament.platform || '—'}</span>
            {tournament.is_paid ? (
              <span className="pill yellow">Torneo con aporte</span>
            ) : (
              <span className="pill green">Gratis</span>
            )}
            {tournament.status === 'open' && <span className="pill green">Inscripciones abiertas</span>}
          </div>

          <h1 style={{
            fontSize: 'clamp(26px, 4vw, 38px)',
            fontWeight: 800,
            letterSpacing: '-1px',
            marginBottom: '12px',
          }}>
            {tournament.name}
          </h1>

          {tournament.description && (
            <p style={{ color: '#8a94a8', maxWidth: '720px', marginBottom: '16px', lineHeight: 1.6 }}>
              {tournament.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span className="pill">🛡 {organizer?.name || 'Organizador'}</span>
            <span className="pill">👥 {tournament.max_participants} cupos</span>
            <span className="pill">🏆 {tournament.prize || 'A definir'}</span>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* IZQUIERDA */}
        <div>
          {rules.length > 0 && (
            <div className="panel">
              <h3>📋 Reglas del torneo</h3>
              <ul style={{ paddingLeft: '20px', color: '#8a94a8', fontSize: '14px', lineHeight: 1.9 }}>
                {rules.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <div style={{
                marginTop: '16px', padding: '12px 14px',
                background: 'rgba(0, 224, 255, 0.04)',
                border: '1px solid rgba(0, 224, 255, 0.2)',
                borderRadius: '10px', fontSize: '13px',
                display: 'flex', gap: '10px', alignItems: 'flex-start',
              }}>
                <span style={{ color: '#00e0ff' }}>🔒</span>
                <span>
                  <b style={{ color: '#e7ecf5' }}>Competición de habilidad.</b>{' '}
                  El resultado depende exclusivamente del desempeño. No es juego de azar.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside>
          <div className="panel" style={{ position: 'sticky', top: '88px' }}>
            <h3>Inscripción</h3>

            <div style={{ margin: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #232c44', fontSize: '14px' }}>
                <span className="muted">Aporte</span>
                <b style={{ color: tournament.is_paid ? '#00e0ff' : '#22d67f' }}>
                  {tournament.is_paid ? `USD ${tournament.price}` : 'Gratis'}
                </b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #232c44', fontSize: '14px' }}>
                <span className="muted">Cupos</span>
                <b>{tournament.max_participants}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #232c44', fontSize: '14px' }}>
                <span className="muted">Inicio</span>
                <b>{tournament.start_date || '—'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '14px' }}>
                <span className="muted">Formato</span>
                <b>{tournament.format || '—'}</b>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button className="btn btn-primary btn-block" disabled>
                Inscripción próximamente
              </button>
            </div>

            <p className="muted" style={{ fontSize: '11px', marginTop: '12px', textAlign: 'center' }}>
              Competición de habilidad. Premios al mejor desempeño.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Torneo() {
  const { slug } = useParams();
  const [tournament, setTournament] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [participants, setParticipants] = useState([]);
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

      // Cargar organizador y participantes en paralelo
      const [orgRes, partsRes] = await Promise.all([
        supabase
          .from('organizers')
          .select('name, email')
          .eq('id', t.organizer_id)
          .maybeSingle(),
        supabase
          .from('participants')
          .select('id, name, email, payment_status, created_at')
          .eq('tournament_id', t.id)
          .in('payment_status', ['paid', 'free'])
          .order('created_at', { ascending: true }),
      ]);

      setOrganizer(orgRes.data);
      setParticipants(partsRes.data || []);
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

  // Calcular cupos
  const confirmedCount = participants.length;
  const spotsLeft = tournament.max_participants - confirmedCount;
  const occupancyPct = Math.min(100, Math.round((confirmedCount / tournament.max_participants) * 100));
  const isFull = spotsLeft <= 0;
  const isLow = spotsLeft > 0 && spotsLeft <= 3;

  // Texto y color del badge de cupos
  let cuposLabel = '';
  let cuposClass = 'green';
  if (isFull) {
    cuposLabel = 'Cupos agotados';
    cuposClass = 'red';
  } else if (isLow) {
    cuposLabel = `Últimos ${spotsLeft} cupos`;
    cuposClass = 'yellow';
  } else {
    cuposLabel = `Quedan ${spotsLeft} de ${tournament.max_participants} cupos`;
    cuposClass = 'green';
  }

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
            {isFull && <span className="pill red">Completo</span>}
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
            <span className="pill">👥 {confirmedCount} / {tournament.max_participants} inscriptos</span>
            <span className="pill">🏆 {tournament.prize || 'A definir'}</span>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* IZQUIERDA */}
        <div>
          {/* PARTICIPANTES */}
          <div className="panel" style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px',
            }}>
              <h3 style={{ margin: 0 }}>👥 Participantes ({confirmedCount})</h3>
              <span className={`pill ${cuposClass}`}>{cuposLabel}</span>
            </div>

            {/* BARRA DE PROGRESO */}
            <div style={{
              height: '8px', borderRadius: '4px',
              background: '#101625', overflow: 'hidden',
              marginBottom: '20px',
            }}>
              <div style={{
                height: '100%',
                width: `${occupancyPct}%`,
                background: isFull
                  ? 'linear-gradient(90deg, #ff3d71, #ff6b8a)'
                  : isLow
                    ? 'linear-gradient(90deg, #ffb02e, #ff3d71)'
                    : 'linear-gradient(90deg, #22d67f, #00e0ff)',
                transition: 'width 0.4s ease',
              }} />
            </div>

            {participants.length === 0 ? (
              <p className="muted" style={{ fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                Todavía nadie se inscribió. ¡Sé el primero!
              </p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '10px',
              }}>
                {participants.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      padding: '10px 12px',
                      background: '#101625',
                      borderRadius: '10px',
                      border: '1px solid #232c44',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00e0ff, #7b5cff)',
                      display: 'grid', placeItems: 'center',
                      fontWeight: 800, color: '#04121f', fontSize: '13px',
                      flexShrink: 0,
                    }}>
                      {(p.name || p.email)[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <b style={{
                        display: 'block',
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {p.name || p.email.split('@')[0]}
                      </b>
                      <span className="muted" style={{
                        fontSize: '11px',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {p.email}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REGLAS */}
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

            {/* PRECIO */}
            <div style={{
              textAlign: 'center',
              padding: '16px',
              background: tournament.is_paid
                ? 'linear-gradient(135deg, rgba(0,224,255,.08), rgba(123,92,255,.06))'
                : 'rgba(34,214,127,.06)',
              border: tournament.is_paid
                ? '1px solid rgba(0,224,255,.25)'
                : '1px solid rgba(34,214,127,.25)',
              borderRadius: '12px',
              marginBottom: '16px',
            }}>
              <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                {tournament.is_paid ? 'Aporte de participación' : 'Sin costo'}
              </div>
              <div style={{
                fontSize: '26px',
                fontWeight: 800,
                color: tournament.is_paid ? '#00e0ff' : '#22d67f',
              }}>
                {tournament.is_paid ? `USD ${tournament.price}` : 'Gratis'}
              </div>
            </div>

            {/* DATOS */}
            <div style={{ margin: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #232c44', fontSize: '14px' }}>
                <span className="muted">Cupos disponibles</span>
                <b style={{ color: isFull ? '#ff3d71' : isLow ? '#ffb02e' : '#22d67f' }}>
                  {spotsLeft} / {tournament.max_participants}
                </b>
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

            {/* BOTÓN */}
            <div style={{ marginTop: '20px' }}>
              {tournament.status !== 'open' ? (
                <button className="btn btn-ghost btn-block" disabled>
                  Inscripciones cerradas
                </button>
              ) : isFull ? (
                <button className="btn btn-ghost btn-block" disabled>
                  Cupos agotados
                </button>
              ) : (
                <Link
                  to={`/torneo/${tournament.slug}/inscribirse`}
                  className="btn btn-primary btn-block"
                >
                  Inscribirme →
                </Link>
              )}
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
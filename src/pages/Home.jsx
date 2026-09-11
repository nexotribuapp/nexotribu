import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [participants, setParticipants] = useState({});
  const [stats, setStats] = useState({
    organizers: 0,
    players: 0,
    inscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: tournamentsData } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      const list = tournamentsData || [];
      setTournaments(list);

      const [orgsRes, playersRes, partsRes] = await Promise.all([
        supabase.from('organizers').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('players').select('id', { count: 'exact', head: true }),
        supabase.from('participants').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        organizers: orgsRes.count || 0,
        players: playersRes.count || 0,
        inscriptions: partsRes.count || 0,
      });

      const openList = list.filter((t) => t.status === 'open');
      if (openList.length > 0) {
        const counts = {};
        await Promise.all(
          openList.map(async (t) => {
            const { data } = await supabase.rpc('get_public_participants', {
              p_tournament_id: t.id,
            });
            counts[t.id] = (data || []).length;
          })
        );
        setParticipants(counts);
      }

      setLoading(false);
    }
    load();
  }, []);

  const open = tournaments.filter((t) => t.status === 'open');
  const live = tournaments.filter((t) => t.status === 'groups' || t.status === 'in_progress');
  const finished = tournaments.filter((t) => t.status === 'finished');

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
          Inscribite con tu cuenta de Google. Reporta resultados desde tu panel.
          Historial verificable con captura de cada partido y cada premio.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '16px',
          marginTop: '32px',
          maxWidth: '900px',
        }}>
          <StatBox value={stats.inscriptions} label="Inscripciones" color="#00e0ff" />
          <StatBox value={open.length} label="Inscripciones abiertas" color="#22d67f" />
          <StatBox value={finished.length} label="Torneos finalizados" color="#ffd166" />
          <StatBox value={stats.organizers} label="Organizadores" color="#7b5cff" />
          <StatBox value={stats.players} label="Jugadores en ranking" color="#ff3d71" />
        </div>
      </section>

      {loading ? (
        <div className="empty">
          <span className="spinner"></span>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <>
              <SectionHead icon="⚡" title="Inscripciones abiertas" pill={`${open.length} disponibles`} pillClass="green" />
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
                marginBottom: '40px',
              }}>
                {open.map((t) => (
                  <TournamentCard key={t.id} tournament={t} participantCount={participants[t.id] || 0} />
                ))}
              </div>
            </>
          )}

          {live.length > 0 && (
            <>
              <SectionHead icon="🏆" title="En juego ahora" pill="En vivo" pillClass="blue" />
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
                marginBottom: '40px',
              }}>
                {live.map((t) => (
                  <TournamentCard key={t.id} tournament={t} participantCount={participants[t.id] || 0} />
                ))}
              </div>
            </>
          )}

          {finished.length > 0 && (
            <>
              <SectionHead
                icon="🏅"
                title="Torneos finalizados"
                pill={`${finished.length} cerrados`}
                pillClass="gold"
                action={<Link to="/ranking" className="btn btn-ghost btn-sm">Ver ranking →</Link>}
              />
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
              }}>
                {finished.map((t) => (
                  <TournamentCard key={t.id} tournament={t} participantCount={participants[t.id] || 0} isFinished />
                ))}
              </div>
            </>
          )}

          {open.length === 0 && live.length === 0 && finished.length === 0 && (
            <div className="empty">
              <p style={{ marginBottom: '16px' }}>Todavía no hay torneos creados.</p>
              <Link to="/login" className="btn btn-primary">
                Soy organizador, quiero crear uno
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatBox({ value, label, color = '#00e0ff' }) {
  return (
    <div className="panel" style={{
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: '26px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div className="muted" style={{
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        lineHeight: 1.3,
      }}>{label}</div>
    </div>
  );
}

function SectionHead({ icon, title, pill, pillClass, action }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      <h2 style={{
        fontSize: '22px',
        fontWeight: 700,
        letterSpacing: '-0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {icon} {title}
      </h2>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {pill && <span className={`pill ${pillClass || ''}`}>{pill}</span>}
        {action}
      </div>
    </div>
  );
}

function TournamentCard({ tournament: t, participantCount, isFinished }) {
  const hasBanner = t.banner_url && t.banner_url.trim();
  const isPaid = t.is_paid;
  const isPro = true;

  const confirmedCount = participantCount || 0;
  const spotsLeft = t.max_participants - confirmedCount;
  const occupancyPct = Math.min(100, Math.round((confirmedCount / t.max_participants) * 100));
  const isFull = spotsLeft <= 0;
  const isLow = spotsLeft > 0 && spotsLeft <= 3;

  let cuposLabel = '';
  let cuposClass = 'green';
  if (isFinished) { cuposLabel = 'Finalizado'; cuposClass = 'gold'; }
  else if (isFull) { cuposLabel = 'Cupos agotados'; cuposClass = 'red'; }
  else if (isLow) { cuposLabel = `Últimos ${spotsLeft} cupos`; cuposClass = 'yellow'; }
  else { cuposLabel = `Quedan ${spotsLeft} de ${t.max_participants} cupos`; cuposClass = 'green'; }

  const typeLabel = { '1v1': '1 vs 1', 'liga': 'Liga', 'coop': 'Coop 2v2' }[t.type] || t.type;
  const priceARS = isPaid ? Math.round(t.price * 1580) : 0;

  return (
    <Link
      to={`/torneo/${t.slug}`}
      className={`t-card ${isPro ? 'pro' : ''}`}
      style={{
        background: isPro
          ? 'linear-gradient(135deg, #1a1408 0%, #2a1f0a 50%, #1a1408 100%)'
          : 'linear-gradient(180deg, #161d2e 0%, #1c2438 100%)',
        border: isPro ? 'none' : '1px solid #232c44',
        borderRadius: '14px',
        overflow: 'hidden',
        transition: '0.22s',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: 'inherit',
        position: 'relative',
        minHeight: '340px',
        opacity: isFinished ? 0.9 : 1,
      }}
    >
      {isPro && (
        <div style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          padding: '5px 10px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #ffd166, #ffb02e)',
          color: '#1a1408',
          fontSize: '10px',
          fontWeight: 900,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          boxShadow: '0 4px 16px rgba(255, 176, 46, 0.5)',
          zIndex: 5,
        }}>⭐ PRO</div>
      )}

      {isFinished && (
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          padding: '5px 10px',
          borderRadius: '20px',
          background: 'rgba(255, 209, 102, 0.15)',
          border: '1px solid rgba(255, 209, 102, 0.4)',
          color: '#ffd166',
          fontSize: '10px',
          fontWeight: 900,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          zIndex: 5,
        }}>🏅 Finalizado</div>
      )}

      <div style={{
        height: '150px',
        background: hasBanner
          ? `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(10,14,26,0.6) 100%), url(${t.banner_url}) center/cover`
          : 'linear-gradient(135deg, #1a2540, #0e1524)',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
      }}>
        {!hasBanner && (
          <span style={{ fontSize: '52px', opacity: 0.4 }}>
            {t.game === 'eFootball' ? '⚽' : '🎮'}
          </span>
        )}
      </div>

      <div style={{
        padding: '18px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
      }}>
        <h3 style={{
          fontSize: '17px',
          fontWeight: 700,
          letterSpacing: '-0.3px',
          color: isPro ? '#ffd166' : '#e7ecf5',
        }}>{t.name}</h3>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="pill blue">{typeLabel}</span>
          <span className="pill">{t.platform || '—'}</span>
          {isPaid ? (
            <span className="pill red">USD {t.price}</span>
          ) : (
            <span className="pill green">Gratis</span>
          )}
        </div>

        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            fontSize: '12px',
          }}>
            <span className={`pill ${cuposClass}`} style={{ fontSize: '10px' }}>{cuposLabel}</span>
          </div>
          <div style={{
            height: '4px',
            borderRadius: '2px',
            background: '#101625',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${occupancyPct}%`,
              background: isFinished
                ? 'linear-gradient(90deg, #ffd166, #ffb02e)'
                : isFull
                  ? 'linear-gradient(90deg, #ff3d71, #ff6b8a)'
                  : isLow
                    ? 'linear-gradient(90deg, #ffb02e, #ff3d71)'
                    : 'linear-gradient(90deg, #22d67f, #00e0ff)',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: isPro ? '1px solid rgba(255,209,102,.15)' : '1px solid #232c44',
          marginTop: 'auto',
          gap: '8px',
        }}>
          <span style={{
            fontSize: '13px',
            color: isPaid ? '#00e0ff' : '#22d67f',
            fontWeight: 700,
          }}>
            {isPaid ? `${priceARS.toLocaleString('es-AR')} NC` : 'Sin aporte'}
          </span>
          <span className="muted" style={{ fontSize: '12px' }}>
            {isFinished ? 'Ver resultados →' : isPaid ? `$${priceARS.toLocaleString('es-AR')} ARS` : 'Gratis'}
          </span>
        </div>
      </div>
    </Link>
  );
}
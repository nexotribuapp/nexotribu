import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PerfilJugador() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState('resumen');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPlayer(data);
      setLoading(false);
    }
    load();
  }, [id]);

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
          Jugador no encontrado
        </h2>
        <Link to="/ranking" className="btn btn-primary">Volver al ranking</Link>
      </div>
    );
  }

  const stats = player.stats || {};
  const prizesHistory = (player.prizes_history || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const matchHistory = (player.match_history || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ padding: '30px 0' }}>
      <Link to="/ranking" className="muted" style={{ fontSize: '13px', display: 'inline-block', marginBottom: '20px' }}>
        ← Volver al ranking
      </Link>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: '24px',
        alignItems: 'center',
        background: 'linear-gradient(120deg, #161d2e, #1c2438)',
        border: '1px solid #232c44',
        borderRadius: '18px',
        padding: '28px',
        marginBottom: '24px',
      }}>
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '22px',
          background: 'linear-gradient(135deg, #00e0ff, #7b5cff)',
          display: 'grid',
          placeItems: 'center',
          fontSize: '36px',
          fontWeight: 800,
          color: '#04121f',
        }}>
          {(player.alias || '?')[0].toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.6px', marginBottom: '6px' }}>
            {player.alias}
          </h1>
          <p className="muted" style={{ fontSize: '13px' }}>
            {player.game_handle || '—'}
            {player.country && ` · ${player.country}`}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <span className="pill blue">Nivel {Math.floor((stats.elo || 1000) / 100)}</span>
            {stats.cups_won > 0 && (
              <span className="pill" style={{
                background: 'linear-gradient(135deg, #ffd166, #ffb02e)',
                color: '#1a1408',
                border: 'none',
              }}>
                🏆 {stats.cups_won} {stats.cups_won === 1 ? 'copa' : 'copas'}
              </span>
            )}
          </div>
        </div>
        <div style={{
          padding: '14px 22px',
          borderRadius: '14px',
          background: '#101625',
          border: '1px solid #232c44',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#00e0ff' }}>
            {Math.round(stats.elo || 1000)}
          </div>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            ELO
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid #232c44',
        marginBottom: '24px',
        overflowX: 'auto',
      }}>
        {[
          { id: 'resumen', label: 'Resumen' },
          { id: 'partidos', label: `Partidos (${matchHistory.length})` },
          { id: 'premios', label: `Premios (${prizesHistory.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              color: tab === t.id ? '#00e0ff' : '#8a94a8',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #00e0ff' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: '0.18s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumen' && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '14px',
            marginBottom: '24px',
          }}>
            <StatBox label="Torneos" value={stats.tournaments_played || 0} />
            <StatBox label="Partidos" value={stats.matches_played || 0} />
            <StatBox label="Ganados" value={stats.matches_won || 0} color="#22d67f" />
            <StatBox label="Empates" value={stats.matches_drawn || 0} color="#ffb02e" />
            <StatBox label="Perdidos" value={stats.matches_lost || 0} color="#ff3d71" />
            <StatBox label="Copas" value={stats.cups_won || 0} color="#ffd166" />
            <StatBox
              label="NexoCoins"
              value={(stats.nexo_won || 0).toLocaleString('es-AR')}
              color="#00e0ff"
            />
          </div>

          <div className="panel">
            <h3>ℹ Sobre este perfil</h3>
            <p className="muted" style={{ fontSize: '14px', lineHeight: 1.6 }}>
              Este perfil público muestra el historial deportivo verificado del jugador.
              Cada partido incluye la captura oficial subida por el organizador.
              Cada premio incluye el comprobante de entrega. El ranking es auditable y permanente.
            </p>
          </div>
        </>
      )}

      {tab === 'partidos' && (
        matchHistory.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎮</div>
            <p>Sin partidos registrados todavía.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {matchHistory.map((m, i) => {
              const isWin = m.result === 'win';
              const isDraw = m.result === 'draw';
              const borderColor = isWin ? '#22d67f' : isDraw ? '#ffb02e' : '#ff3d71';

              return (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr auto',
                    gap: '14px',
                    alignItems: 'center',
                    padding: '14px',
                    background: '#101625',
                    border: '1px solid #232c44',
                    borderLeft: `3px solid ${borderColor}`,
                    borderRadius: '12px',
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    background: '#161d2e',
                    overflow: 'hidden',
                    display: 'grid',
                    placeItems: 'center',
                  }}>
                    {m.proof ? (
                      <img src={m.proof} alt="Captura" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '24px', color: '#8a94a8' }}>🖼</span>
                    )}
                  </div>
                  <div>
                    <b style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                      vs {m.rival}
                    </b>
                    <span className="muted" style={{ fontSize: '11px', display: 'block' }}>
                      {m.round} · {m.tournament_name}
                    </span>
                    <span className="muted" style={{ fontSize: '11px' }}>
                      {m.game} · {m.date}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>
                      {m.my_score} - {m.rival_score}
                    </div>
                    <span className={`pill ${isWin ? 'green' : isDraw ? 'yellow' : 'red'}`}>
                      {isWin ? 'Victoria' : isDraw ? 'Empate' : 'Derrota'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'premios' && (
        prizesHistory.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
            <p>Sin premios registrados todavía.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {prizesHistory.map((p, i) => {
              const pos = p.position || 1;
              const medalBg = pos === 1 ? 'linear-gradient(135deg, #ffd166, #ffb02e)'
                : pos === 2 ? 'linear-gradient(135deg, #e0e0e0, #a8a8a8)'
                : pos === 3 ? 'linear-gradient(135deg, #cd7f32, #8b4513)'
                : 'linear-gradient(135deg, #6b7a9e, #3f4b6a)';
              const posLabel = pos === 1 ? '1er lugar' : pos === 2 ? '2do lugar' : pos === 3 ? '3er lugar' : `${pos}to lugar`;

              return (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: '14px',
                    alignItems: 'center',
                    padding: '14px',
                    background: pos === 1 ? 'rgba(255,209,102,.04)' : '#101625',
                    border: `1px solid ${pos === 1 ? 'rgba(255,209,102,.3)' : '#232c44'}`,
                    borderRadius: '12px',
                  }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: medalBg,
                    color: '#04121f',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: '15px',
                  }}>
                    {pos}
                  </div>
                  <div>
                    <b style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                      {posLabel} · {p.tournament_name}
                    </b>
                    <span className="muted" style={{ fontSize: '11px' }}>
                      {p.game} · {p.date}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <b style={{ color: '#ffd166', fontSize: '16px', display: 'block' }}>
                      {(p.nexo_won || 0).toLocaleString('es-AR')} NC
                    </b>
                    {p.proof_url && (
                      <a
                        href={p.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#00e0ff', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}
                      >
                        👁 Ver Instagram
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function StatBox({ label, value, color = '#e7ecf5' }) {
  return (
    <div className="panel" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '22px', fontWeight: 800, color }}>{value}</div>
      <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '4px' }}>
        {label}
      </div>
    </div>
  );
}
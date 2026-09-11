import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function GestionTorneo({ user }) {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showSorteo, setShowSorteo] = useState(false);
  const [sorteoStep, setSorteoStep] = useState(0);
  const [showWinners, setShowWinners] = useState(false);
  const [saving, setSaving] = useState(false);
  const [winnersForm, setWinnersForm] = useState({
    first: { name: '', instagram_url: '', nexo_won: 0 },
    second: { name: '', instagram_url: '', nexo_won: 0 },
    third: { name: '', instagram_url: '', nexo_won: 0 },
    fourth: { name: '', instagram_url: '', nexo_won: 0 },
  });

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line
  }, [id]);

  async function loadAll() {
    setLoading(true);

    const { data: t, error: tErr } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (tErr || !t) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    if (t.organizer_id !== user.id) {
      setError('No tenés permiso para gestionar este torneo');
      setLoading(false);
      return;
    }

    setTournament(t);

    const [pRes, mRes] = await Promise.all([
      supabase
        .from('participants')
        .select('*')
        .eq('tournament_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', id)
        .order('created_at', { ascending: true }),
    ]);

    setParticipants(pRes.data || []);
    setMatches(mRes.data || []);
    setLoading(false);
  }

  async function approvePayment(pid) {
    const { error: err } = await supabase
      .from('participants')
      .update({ payment_status: 'paid' })
      .eq('id', pid);
    if (!err) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === pid ? { ...p, payment_status: 'paid' } : p))
      );
    }
  }

  async function rejectPayment(pid) {
    const { error: err } = await supabase
      .from('participants')
      .update({ payment_status: 'rejected' })
      .eq('id', pid);
    if (!err) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === pid ? { ...p, payment_status: 'rejected' } : p))
      );
    }
  }

  async function startSorteo() {
    setStarting(true);
    setShowSorteo(true);
    setSorteoStep(0);

    await new Promise((r) => setTimeout(r, 900));
    setSorteoStep(1);
    await new Promise((r) => setTimeout(r, 900));
    setSorteoStep(2);

    const { data, error: rpcError } = await supabase.rpc('start_tournament', {
      p_tournament_id: tournament.id,
      p_organizer_id: user.id,
    });

    if (rpcError || data?.error) {
      setShowSorteo(false);
      setStarting(false);
      alert('Error: ' + (rpcError?.message || data?.error));
      return;
    }

    setSorteoStep(3);
    await new Promise((r) => setTimeout(r, 1200));
    setShowSorteo(false);
    setStarting(false);
    await loadAll();
  }

  async function generateKnockout() {
    if (!confirm('¿Generar los cruces de eliminatorias?')) return;

    const { data, error: rpcError } = await supabase.rpc('generate_knockout', {
      p_tournament_id: tournament.id,
      p_organizer_id: user.id,
    });

    if (rpcError || data?.error) {
      alert('Error: ' + (rpcError?.message || data?.error));
      return;
    }

    alert('Se generaron ' + data.match_count + ' partidos de ' + data.round);
    await loadAll();
  }

  function openWinnersModal() {
    const confirmed = participants.filter(
      (p) => p.payment_status === 'paid' || p.payment_status === 'free'
    ).length;

    const dist = tournament.prize_distribution || {
      organizer_pct: 15, first_pct: 50, second_pct: 30, third_pct: 15, fourth_pct: 5,
    };
    const totalUSD = tournament.is_paid ? tournament.price * confirmed : 0;
    const platformFee = totalUSD * 0.05;
    const organizerUSD = totalUSD * (dist.organizer_pct / 100);
    const poolUSD = totalUSD - platformFee - organizerUSD;
    const firstPrize = poolUSD * (dist.first_pct / 100);
    const secondPrize = poolUSD * (dist.second_pct / 100);
    const thirdPrize = poolUSD * (dist.third_pct / 100);
    const fourthPrize = poolUSD * (dist.fourth_pct / 100);

    const existing = tournament.winners || {};
    setWinnersForm({
      first: {
        name: existing.first?.name || '',
        instagram_url: existing.first?.instagram_url || '',
        nexo_won: existing.first?.nexo_won || Math.round(firstPrize * 1000),
      },
      second: {
        name: existing.second?.name || '',
        instagram_url: existing.second?.instagram_url || '',
        nexo_won: existing.second?.nexo_won || Math.round(secondPrize * 1000),
      },
      third: {
        name: existing.third?.name || '',
        instagram_url: existing.third?.instagram_url || '',
        nexo_won: existing.third?.nexo_won || Math.round(thirdPrize * 1000),
      },
      fourth: {
        name: existing.fourth?.name || '',
        instagram_url: existing.fourth?.instagram_url || '',
        nexo_won: existing.fourth?.nexo_won || Math.round(fourthPrize * 1000),
      },
    });
    setShowWinners(true);
  }

  async function saveWinners() {
    if (!winnersForm.first.name.trim()) {
      alert('Cargá al menos al ganador del 1er lugar');
      return;
    }

    setSaving(true);

    const winners = {};
    ['first', 'second', 'third', 'fourth'].forEach((slot) => {
      if (winnersForm[slot].name.trim()) {
        winners[slot] = {
          name: winnersForm[slot].name.trim(),
          instagram_url: winnersForm[slot].instagram_url.trim() || null,
          nexo_won: winnersForm[slot].nexo_won,
        };
      }
    });

    // 1. Guardar ganadores y cerrar el torneo
    const { error: saveError } = await supabase.rpc('save_winners', {
      p_tournament_id: tournament.id,
      p_organizer_id: user.id,
      p_winners: winners,
    });

    if (saveError) {
      alert('Error: ' + saveError.message);
      setSaving(false);
      return;
    }

    // 2. Actualizar ranking
    const { error: rankError } = await supabase.rpc('update_ranking_from_winners', {
      p_tournament_id: tournament.id,
      p_winners: winners,
    });

    if (rankError) {
      console.warn('Ranking no actualizado:', rankError.message);
    }

    // 3. Notificar a los ganadores
    for (const slot of ['first', 'second', 'third', 'fourth']) {
      if (winners[slot]) {
        const participant = participants.find(
          (p) => (p.name || p.email.split('@')[0]) === winners[slot].name
        );
        if (participant) {
          const positionLabel =
            slot === 'first' ? '1er' :
            slot === 'second' ? '2do' :
            slot === 'third' ? '3er' : '4to';
          await supabase.rpc('create_notification', {
            p_participant_id: participant.id,
            p_message: '🏆 ¡Felicitaciones! Ganaste el ' + positionLabel +
              ' lugar en ' + tournament.name + '. Premio: ' +
              winners[slot].nexo_won.toLocaleString('es-AR') + ' NexoCoins.',
          });
        }
      }
    }

    setSaving(false);
    setShowWinners(false);
    await loadAll();
    alert('✅ Ganadores guardados. Ranking actualizado.');
  }

  async function resetMatch(matchId) {
    if (!confirm('¿Borrar el resultado de este partido?')) return;
    await supabase.from('matches').update({
      home_score: null,
      away_score: null,
      status: 'scheduled',
      reported_by: null,
      confirmed_by: null,
      disputed: false,
      dispute_reason: null,
    }).eq('id', matchId);
    await loadAll();
  }

  function copyPublicLink() {
    navigator.clipboard.writeText(
      window.location.origin + '/torneo/' + tournament.slug
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

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
        <Link to="/panel" className="btn btn-primary">Volver al panel</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#ff3d71' }}>
          Sin permiso
        </h2>
        <p style={{ marginBottom: '20px' }}>{error}</p>
        <Link to="/panel" className="btn btn-primary">Volver al panel</Link>
      </div>
    );
  }

  const confirmed = participants.filter(
    (p) => p.payment_status === 'paid' || p.payment_status === 'free'
  ).length;
  const pending = participants.filter(
    (p) => p.payment_status === 'pending_review'
  ).length;
  const hasBanner = tournament.banner_url && tournament.banner_url.trim();

  const statusLabel =
    tournament.status === 'open' ? 'Abierto' :
    tournament.status === 'groups' ? 'Fase de grupos' :
    tournament.status === 'in_progress' ? 'En curso' :
    tournament.status === 'finished' ? 'Finalizado' : tournament.status;

  const matchesByRound = matches.reduce((acc, m) => {
    const r = m.round || 'Sin ronda';
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});

  return (
    <div style={{ padding: '30px 0' }}>
      <Link to="/panel" className="muted" style={{ fontSize: '13px', display: 'inline-block', marginBottom: '20px' }}>
        ← Volver al panel
      </Link>

      {/* HEADER */}
      <div style={{
        position: 'relative', borderRadius: '18px', overflow: 'hidden',
        background: 'linear-gradient(180deg, #161d2e 0%, #1c2438 100%)',
        border: '1px solid #232c44', marginBottom: '24px',
      }}>
        <div style={{
          height: '160px',
          background: hasBanner ? `url(${tournament.banner_url}) center/cover` : 'linear-gradient(135deg, #1a2540, #0e1524)',
          display: 'grid', placeItems: 'center', position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(10,14,26,0.95) 100%)' }} />
          {!hasBanner && (
            <span style={{ fontSize: '60px', opacity: 0.4, position: 'relative', zIndex: 2 }}>
              {tournament.game === 'eFootball' ? '⚽' : '🎮'}
            </span>
          )}
        </div>

        <div style={{ padding: '0 32px 28px', marginTop: '-32px', position: 'relative', zIndex: 3 }}>
          <span className={`pill ${tournament.status === 'open' ? 'green' : tournament.status === 'finished' ? 'gold' : 'blue'}`}>
            {statusLabel}
          </span>
          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 800, letterSpacing: '-1px', margin: '12px 0' }}>
            {tournament.name}
          </h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
            <button onClick={copyPublicLink} className="btn btn-ghost btn-sm">
              {copiedLink ? '✓ Copiado' : '🔗 Copiar link público'}
            </button>
            <a href={`/torneo/${tournament.slug}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
              👁 Ver público
            </a>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '16px', marginBottom: '32px',
      }}>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Confirmados</div>
          <div style={{ fontSize: '26px', fontWeight: 800 }}>{confirmed} / {tournament.max_participants}</div>
        </div>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Pendientes</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffb02e' }}>{pending}</div>
        </div>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Partidos</div>
          <div style={{ fontSize: '26px', fontWeight: 800 }}>{matches.length}</div>
        </div>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Jugados</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#22d67f' }}>
            {matches.filter((m) => m.status === 'played').length}
          </div>
        </div>
      </div>

      {/* ACCIONES */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <h3>⚙ Acciones del torneo</h3>

        {tournament.status === 'open' && (
          <>
            <p className="muted" style={{ fontSize: '13px', marginBottom: '16px' }}>
              {confirmed < 4
                ? `Necesitás al menos 4 participantes confirmados. Tenés ${confirmed}.`
                : `Todo listo para iniciar con ${confirmed} participantes.`}
            </p>
            <button onClick={startSorteo} disabled={confirmed < 4 || starting} className="btn btn-primary">
              🎲 Iniciar sorteo en vivo
            </button>
          </>
        )}

        {tournament.status === 'groups' && (
          <>
            <p className="muted" style={{ fontSize: '13px', marginBottom: '16px' }}>
              Cuando terminen los partidos de grupos, generá los cruces de eliminatorias.
            </p>
            <button onClick={generateKnockout} className="btn btn-primary">
              🏆 Generar eliminatorias
            </button>
          </>
        )}

        {(tournament.status === 'in_progress' || tournament.status === 'finished') && (
          <>
            <p className="muted" style={{ fontSize: '13px', marginBottom: '16px' }}>
              {tournament.status === 'finished'
                ? 'Torneo finalizado. Podés editar los ganadores si necesitás corregir algo.'
                : 'Cuando terminen todos los partidos, cargá los ganadores para cerrar el torneo.'}
            </p>
            <button onClick={openWinnersModal} className="btn btn-primary">
              🏆 {tournament.status === 'finished' ? 'Editar ganadores' : 'Cargar ganadores'}
            </button>
          </>
        )}
      </div>

      {/* PARTIDOS */}
      {matches.length > 0 && (
        <div className="panel" style={{ marginBottom: '24px' }}>
          <h3>🎮 Partidos ({matches.length})</h3>
          {Object.entries(matchesByRound).map(([round, roundMatches]) => (
            <div key={round} style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px',
                color: '#00e0ff', fontWeight: 700, marginBottom: '10px',
              }}>
                {round}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {roundMatches.map((m) => (
                  <div key={m.id} style={{
                    padding: '10px 14px', background: '#101625',
                    border: '1px solid #232c44', borderRadius: '10px',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', fontSize: '13px', gap: '10px',
                  }}>
                    <span style={{ flex: 1 }}>{m.home}</span>
                    <span style={{ fontWeight: 700, padding: '0 12px', minWidth: '60px', textAlign: 'center', color: '#00e0ff' }}>
                      {m.home_score !== null ? `${m.home_score} - ${m.away_score}` : 'vs'}
                    </span>
                    <span style={{ flex: 1, textAlign: 'right' }}>{m.away}</span>
                    <span className={`pill ${m.status === 'played' ? 'green' : m.status === 'disputed' ? 'red' : m.status === 'pending_confirmation' ? 'yellow' : ''}`}>
                      {m.status === 'played' ? 'OK' :
                       m.status === 'pending_confirmation' ? 'Pdte' :
                       m.status === 'disputed' ? 'Disputa' : 'Prog'}
                    </span>
                    {m.status !== 'scheduled' && (
                      <button onClick={() => resetMatch(m.id)} className="btn btn-ghost btn-sm" title="Resetear">↺</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PARTICIPANTES */}
      <div className="panel">
        <h3>👥 Participantes ({participants.length})</h3>
        {participants.length === 0 ? (
          <p className="muted">Sin participantes todavía.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Aporte</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td><b>{p.name || p.email.split('@')[0]}</b></td>
                    <td className="muted">{p.email}</td>
                    <td>
                      <span className={`pill ${p.payment_status === 'paid' || p.payment_status === 'free' ? 'green' : p.payment_status === 'rejected' ? 'red' : 'yellow'}`}>
                        {p.payment_status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {p.payment_status === 'pending_review' && (
                          <>
                            <button onClick={() => approvePayment(p.id)} className="btn btn-success btn-sm">✓</button>
                            <button onClick={() => rejectPayment(p.id)} className="btn btn-danger btn-sm">✕</button>
                          </>
                        )}
                        <a href={`/acceso/${p.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                          Ver ficha
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL SORTEO */}
      {showSorteo && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5, 8, 16, 0.92)',
          backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center',
          padding: '20px', zIndex: 200,
        }}>
          <div style={{
            background: '#1c2438', border: '1px solid #232c44',
            borderRadius: '20px', padding: '40px 32px',
            maxWidth: '500px', width: '100%', textAlign: 'center',
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              margin: '0 auto 20px',
              background: 'radial-gradient(circle at 30% 30%, rgba(0,224,255,.5), rgba(123,92,255,.3) 60%, transparent)',
              display: 'grid', placeItems: 'center',
              animation: sorteoStep >= 3 ? 'none' : 'spin 1s linear infinite',
              fontSize: '36px',
            }}>🏆</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '10px' }}>
              {sorteoStep === 0 && 'Preparando sorteo...'}
              {sorteoStep === 1 && 'Mezclando participantes...'}
              {sorteoStep === 2 && 'Distribuyendo grupos...'}
              {sorteoStep === 3 && '¡Sorteo completado!'}
            </h2>
          </div>
        </div>
      )}

      {/* MODAL GANADORES */}
      {showWinners && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center',
          padding: '20px', zIndex: 200, overflowY: 'auto',
        }}>
          <div style={{
            background: '#1c2438', border: '1px solid #232c44',
            borderRadius: '18px', padding: '28px',
            maxWidth: '520px', width: '100%',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>
              🏆 Cargar ganadores
            </h2>
            <p className="muted" style={{ fontSize: '13px', marginBottom: '20px' }}>
              Al guardar, se actualiza el ranking automáticamente y se notifica a los ganadores.
            </p>

            {['first', 'second', 'third', 'fourth'].map((slot, i) => (
              <div key={slot} style={{
                padding: '14px', background: '#101625',
                borderRadius: '10px', marginBottom: '12px',
                border: '1px solid #232c44',
              }}>
                <div style={{
                  fontSize: '12px', textTransform: 'uppercase',
                  letterSpacing: '0.6px', fontWeight: 700,
                  color: i === 0 ? '#ffd166' : i === 1 ? '#e0e0e0' : i === 2 ? '#cd7f32' : '#6b7a9e',
                  marginBottom: '10px',
                }}>
                  {['🥇 1er lugar', '🥈 2do lugar', '🥉 3er lugar', '4to lugar'][i]} &middot; {winnersForm[slot].nexo_won.toLocaleString('es-AR')} NC
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <input
                    placeholder="Nombre del ganador"
                    value={winnersForm[slot].name}
                    onChange={(e) => setWinnersForm((p) => ({
                      ...p,
                      [slot]: { ...p[slot], name: e.target.value },
                    }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    placeholder="Link de Instagram (opcional)"
                    value={winnersForm[slot].instagram_url}
                    onChange={(e) => setWinnersForm((p) => ({
                      ...p,
                      [slot]: { ...p[slot], instagram_url: e.target.value },
                    }))}
                  />
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={saveWinners}
                disabled={saving}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {saving ? 'Guardando...' : 'Guardar y cerrar torneo'}
              </button>
              <button onClick={() => setShowWinners(false)} className="btn btn-ghost">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
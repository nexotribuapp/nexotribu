import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PlayerPanel() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modales
  const [reportingMatch, setReportingMatch] = useState(null);
  const [reportForm, setReportForm] = useState({ home_score: '', away_score: '', proof_url: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPanel();
    // eslint-disable-next-line
  }, [token]);

  async function loadPanel() {
    setLoading(true);
    const { data: res, error: rpcError } = await supabase.rpc('get_player_panel', {
      p_token: token,
    });

    if (rpcError || res?.error) {
      setError(rpcError?.message || res?.error);
      setLoading(false);
      return;
    }

    setData(res);
    setLoading(false);
  }

  async function handleReport() {
    if (!reportingMatch) return;
    if (reportForm.home_score === '' || reportForm.away_score === '') {
      alert('Completá ambos goles');
      return;
    }

    setSubmitting(true);
    const { data: res, error: rpcError } = await supabase.rpc('report_match_result', {
      p_token: token,
      p_match_id: reportingMatch.id,
      p_home_score: parseInt(reportForm.home_score),
      p_away_score: parseInt(reportForm.away_score),
      p_proof_url: reportForm.proof_url || null,
    });

    if (rpcError || res?.error) {
      alert('Error: ' + (rpcError?.message || res?.error));
      setSubmitting(false);
      return;
    }

    setReportingMatch(null);
    setReportForm({ home_score: '', away_score: '', proof_url: '' });
    setSubmitting(false);
    await loadPanel();
  }

  async function handleConfirm(matchId) {
    if (!confirm('¿Confirmás el resultado reportado por tu rival?')) return;
    setSubmitting(true);
    const { data: res, error: rpcError } = await supabase.rpc('confirm_match_result', {
      p_token: token,
      p_match_id: matchId,
    });

    if (rpcError || res?.error) {
      alert('Error: ' + (rpcError?.message || res?.error));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    await loadPanel();
  }

  async function handleDispute(matchId) {
    const reason = prompt('Motivo de la disputa:');
    if (!reason) return;

    setSubmitting(true);
    const { error: updateError } = await supabase
      .from('matches')
      .update({ status: 'disputed', disputed: true, dispute_reason: reason })
      .eq('id', matchId);

    if (updateError) {
      alert('Error: ' + updateError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    await loadPanel();
  }

  if (loading) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#e7ecf5' }}>Enlace inválido</h2>
        <p style={{ marginBottom: '20px' }}>{error}</p>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    );
  }

  const { participant, tournament, matches } = data;
  const playerMatches = matches || [];
  const played = playerMatches.filter((m) => m.status === 'played');

  let wins = 0, draws = 0, losses = 0;
  played.forEach((m) => {
    const isHome = m.home === participant.name;
    const myScore = isHome ? m.home_score : m.away_score;
    const rivalScore = isHome ? m.away_score : m.home_score;
    if (myScore > rivalScore) wins++;
    else if (myScore < rivalScore) losses++;
    else draws++;
  });

  const statusLabel =
    participant.payment_status === 'paid' ? 'Pago confirmado' :
    participant.payment_status === 'free' ? 'Inscripto' :
    participant.payment_status === 'pending_review' ? 'En revisión' : 'Pendiente';

  const statusClass =
    participant.payment_status === 'paid' || participant.payment_status === 'free' ? 'green' :
    participant.payment_status === 'pending_review' ? 'yellow' : 'red';

  return (
    <div style={{ padding: '40px 0' }}>
      <Link to={`/torneo/${tournament.slug}`} className="muted" style={{ fontSize: '13px', display: 'inline-block', marginBottom: '20px' }}>
        ← Volver al torneo
      </Link>

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
          {(participant.name || participant.email)[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '4px' }}>
            {participant.name || participant.email.split('@')[0]}
          </h2>
          <p className="muted" style={{ fontSize: '13px' }}>
            {tournament.name} · {tournament.game}
          </p>
        </div>
        <span className={`pill ${statusClass}`}>{statusLabel}</span>
      </div>

      {/* STATS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '14px', marginBottom: '28px',
      }}>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800 }}>{played.length}</div>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Jugados</div>
        </div>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#22d67f' }}>{wins}</div>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Ganados</div>
        </div>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffb02e' }}>{draws}</div>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Empates</div>
        </div>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ff3d71' }}>{losses}</div>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Perdidos</div>
        </div>
      </div>

      {/* MIS PARTIDOS */}
      <div className="panel">
        <h3>🎮 Mis partidos ({playerMatches.length})</h3>

        {playerMatches.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center', padding: '30px 0' }}>
            Todavía no hay partidos asignados.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {playerMatches.map((m) => {
              const isHome = m.home === participant.name;
              const rival = isHome ? m.away : m.home;
              const myScore = isHome ? m.home_score : m.away_score;
              const rivalScore = isHome ? m.away_score : m.home_score;
              const reportedByMe = m.reported_by === participant.id;
              const canReport = m.status === 'scheduled';
              const canValidate = m.status === 'pending_confirmation' && !reportedByMe;
              const canDispute = m.status === 'pending_confirmation' && !reportedByMe;

              let resultLabel = '';
              let resultClass = 'muted';
              if (m.status === 'played') {
                if (myScore > rivalScore) { resultLabel = 'Victoria'; resultClass = 'green'; }
                else if (myScore < rivalScore) { resultLabel = 'Derrota'; resultClass = 'red'; }
                else { resultLabel = 'Empate'; resultClass = 'yellow'; }
              }

              const statusPill =
                m.status === 'played' ? <span className={`pill ${resultClass}`}>{resultLabel}</span> :
                m.status === 'pending_confirmation' ? (
                  reportedByMe
                    ? <span className="pill yellow">Esperando rival</span>
                    : <span className="pill yellow">Revisar resultado</span>
                ) :
                m.status === 'disputed' ? <span className="pill red">En disputa</span> :
                <span className="pill">Programado</span>;

              return (
                <div
                  key={m.id}
                  style={{
                    padding: '14px 16px',
                    background: '#101625',
                    border: '1px solid #232c44',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    fontSize: '12px',
                    color: '#8a94a8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    <span>{m.round}</span>
                    {statusPill}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '12px',
                    alignItems: 'center',
                    marginBottom: (canReport || canValidate) ? '14px' : 0,
                  }}>
                    <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>
                      {m.home} {isHome && <span style={{ color: '#00e0ff', fontSize: '11px' }}>(vos)</span>}
                    </div>
                    <div style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      color: '#00e0ff',
                      textAlign: 'center',
                      minWidth: '70px',
                    }}>
                      {m.home_score !== null ? `${m.home_score} - ${m.away_score}` : 'vs'}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>
                      {m.away} {!isHome && <span style={{ color: '#00e0ff', fontSize: '11px' }}>(vos)</span>}
                    </div>
                  </div>

                  {m.proof_url && (
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                      <a href={m.proof_url} target="_blank" rel="noreferrer" style={{ color: '#00e0ff', fontSize: '12px' }}>
                        📸 Ver captura
                      </a>
                    </div>
                  )}

                  {canReport && (
                    <button
                      onClick={() => {
                        setReportingMatch(m);
                        setReportForm({ home_score: '', away_score: '', proof_url: '' });
                      }}
                      className="btn btn-primary btn-block"
                    >
                      📝 Reportar resultado
                    </button>
                  )}

                  {canValidate && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleConfirm(m.id)}
                        className="btn btn-success"
                        style={{ flex: 1 }}
                        disabled={submitting}
                      >
                        ✓ Confirmar
                      </button>
                      <button
                        onClick={() => handleDispute(m.id)}
                        className="btn btn-danger"
                        style={{ flex: 1 }}
                        disabled={submitting}
                      >
                        ✕ Disputar
                      </button>
                    </div>
                  )}

                  {m.status === 'disputed' && m.dispute_reason && (
                    <div style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 61, 113, 0.06)',
                      border: '1px solid rgba(255, 61, 113, 0.25)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#c5cdda',
                      marginTop: '10px',
                    }}>
                      <b style={{ color: '#ff3d71' }}>Motivo:</b> {m.dispute_reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ENLACE */}
      <div className="panel" style={{ marginTop: '20px' }}>
        <h3>🔑 Mi enlace de acceso</h3>
        <p className="muted" style={{ fontSize: '13px', marginBottom: '12px' }}>
          Guardá este enlace. Es tu credencial única.
        </p>
        <div style={{
          background: '#101625',
          border: '1px dashed #232c44',
          borderRadius: '10px',
          padding: '12px',
          fontFamily: 'monospace',
          fontSize: '11px',
          wordBreak: 'break-all',
          color: '#00e0ff',
        }}>
          {window.location.href}
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Enlace copiado');
          }}
          className="btn btn-ghost btn-sm"
          style={{ marginTop: '10px' }}
        >
          📋 Copiar enlace
        </button>
      </div>

      {/* MODAL REPORTAR */}
      {reportingMatch && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'grid', placeItems: 'center',
          padding: '20px', zIndex: 100,
        }}>
          <div style={{
            background: '#1c2438',
            border: '1px solid #232c44',
            borderRadius: '18px',
            padding: '28px',
            maxWidth: '440px',
            width: '100%',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>
              Reportar resultado
            </h2>
            <p className="muted" style={{ fontSize: '14px', marginBottom: '20px' }}>
              {reportingMatch.home} vs {reportingMatch.away}
            </p>

            <div className="form-row">
              <div className="form-group">
                <label>{reportingMatch.home}</label>
                <input
                  type="number"
                  min="0"
                  value={reportForm.home_score}
                  onChange={(e) => setReportForm((p) => ({ ...p, home_score: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>{reportingMatch.away}</label>
                <input
                  type="number"
                  min="0"
                  value={reportForm.away_score}
                  onChange={(e) => setReportForm((p) => ({ ...p, away_score: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Link de captura (opcional)</label>
              <input
                value={reportForm.proof_url}
                onChange={(e) => setReportForm((p) => ({ ...p, proof_url: e.target.value }))}
                placeholder="https://i.ibb.co/..."
              />
              <small>Subí la captura a imgbb.com y pegá el link.</small>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleReport}
                disabled={submitting}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {submitting ? 'Enviando...' : 'Enviar reporte'}
              </button>
              <button
                onClick={() => setReportingMatch(null)}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
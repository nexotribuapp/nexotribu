import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function GestionTorneo({ user }) {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

    const { data: parts } = await supabase
      .from('participants')
      .select('*')
      .eq('tournament_id', id)
      .order('created_at', { ascending: false });

    setParticipants(parts || []);
    setLoading(false);
  }

  async function approvePayment(participantId) {
    const { error: err } = await supabase
      .from('participants')
      .update({ payment_status: 'paid' })
      .eq('id', participantId);

    if (!err) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, payment_status: 'paid' } : p))
      );
    }
  }

  async function rejectPayment(participantId) {
    const { error: err } = await supabase
      .from('participants')
      .update({ payment_status: 'rejected' })
      .eq('id', participantId);

    if (!err) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, payment_status: 'rejected' } : p))
      );
    }
  }

  async function toggleStatus() {
    if (!tournament) return;
    const next =
      tournament.status === 'open' ? 'in_progress' :
      tournament.status === 'in_progress' ? 'finished' : 'open';

    const { error: err } = await supabase
      .from('tournaments')
      .update({ status: next })
      .eq('id', tournament.id);

    if (!err) setTournament((prev) => ({ ...prev, status: next }));
  }

  function copyPublicLink() {
    const url = `${window.location.origin}/torneo/${tournament.slug}`;
    navigator.clipboard.writeText(url);
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
        <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#ff3d71' }}>Sin permiso</h2>
        <p style={{ marginBottom: '20px' }}>{error}</p>
        <Link to="/panel" className="btn btn-primary">Volver al panel</Link>
      </div>
    );
  }

  const confirmed = participants.filter(
    (p) => p.payment_status === 'paid' || p.payment_status === 'free'
  ).length;
  const pending = participants.filter((p) => p.payment_status === 'pending_review').length;
  const hasBanner = tournament.banner_url && tournament.banner_url.trim();
  const statusLabel =
    tournament.status === 'open' ? 'Abierto' :
    tournament.status === 'in_progress' ? 'En curso' :
    tournament.status === 'finished' ? 'Finalizado' : tournament.status;

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
          <span className={`pill ${tournament.status === 'open' ? 'green' : tournament.status === 'finished' ? 'red' : 'blue'}`}>
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
            <button onClick={toggleStatus} className="btn btn-ghost btn-sm">
              🔄 Cambiar estado
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
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
          <div className="muted" style={{ fontSize: '12px' }}>Aporte</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: tournament.is_paid ? '#00e0ff' : '#22d67f' }}>
            {tournament.is_paid ? `USD ${tournament.price}` : 'Gratis'}
          </div>
        </div>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Formato</div>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{tournament.format || '—'}</div>
        </div>
      </div>

      {/* ACCIONES DE TORNEO */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <h3>⚙ Acciones del torneo</h3>
        <p className="muted" style={{ fontSize: '13px', marginBottom: '16px' }}>
          Estas acciones las vas a poder usar una vez que tengas los inscriptos confirmados.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" disabled>🎲 Iniciar sorteo (próximamente)</button>
          <button className="btn btn-ghost" disabled>📊 Ver bracket (próximamente)</button>
          <button className="btn btn-ghost" disabled>🏆 Cargar ganadores (próximamente)</button>
        </div>
      </div>

      {/* PARTICIPANTES */}
      <div className="panel">
        <h3>👥 Participantes ({participants.length})</h3>

        {participants.length === 0 ? (
          <div className="empty">
            <p>Todavía no hay inscriptos en este torneo.</p>
            <p className="muted" style={{ fontSize: '13px', marginTop: '10px' }}>
              Compartí el link público para que los jugadores se anoten.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8a94a8', borderBottom: '1px solid #232c44' }}>
                  <th style={{ padding: '10px 8px' }}>Nombre</th>
                  <th style={{ padding: '10px 8px' }}>Email</th>
                  <th style={{ padding: '10px 8px' }}>WhatsApp</th>
                  <th style={{ padding: '10px 8px' }}>Estado</th>
                  <th style={{ padding: '10px 8px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #232c44' }}>
                    <td style={{ padding: '10px 8px' }}>
                      <b>{p.name || p.email.split('@')[0]}</b>
                    </td>
                    <td style={{ padding: '10px 8px', color: '#8a94a8' }}>
                      {p.email}
                    </td>
                    <td style={{ padding: '10px 8px', color: '#8a94a8' }}>
                      {p.whatsapp || '—'}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span className={`pill ${p.payment_status === 'paid' || p.payment_status === 'free' ? 'green' : p.payment_status === 'rejected' ? 'red' : 'yellow'}`}>
                        {p.payment_status === 'paid' ? 'Pagado' :
                         p.payment_status === 'free' ? 'Confirmado' :
                         p.payment_status === 'pending_review' ? 'Por validar' :
                         p.payment_status === 'rejected' ? 'Rechazado' : p.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      {p.payment_status === 'pending_review' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => approvePayment(p.id)} className="btn btn-success btn-sm">
                            ✓ Aprobar
                          </button>
                          <button onClick={() => rejectPayment(p.id)} className="btn btn-danger btn-sm">
                            ✕ Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
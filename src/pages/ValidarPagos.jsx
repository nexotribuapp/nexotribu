import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ValidarPagos({ user }) {
  const [pendings, setPendings] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    loadAll();
  }, [user.id]);

  async function loadAll() {
    setLoading(true);

    // Obtener torneos del organizador
    const { data: tournaments } = await supabase
      .from('tournaments')
      .select('id, name')
      .eq('organizer_id', user.id);

    if (!tournaments || tournaments.length === 0) {
      setLoading(false);
      return;
    }

    const tournamentIds = tournaments.map((t) => t.id);

    // Pendientes de revisión
    const { data: pend } = await supabase
      .from('participants')
      .select('*')
      .in('tournament_id', tournamentIds)
      .eq('payment_status', 'pending_review')
      .order('created_at', { ascending: false });

    // Aprobados
    const { data: appr } = await supabase
      .from('participants')
      .select('*')
      .in('tournament_id', tournamentIds)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });

    // Mapear nombres de torneos
    const withT = (arr) =>
      (arr || []).map((p) => ({
        ...p,
        _tournament_name: tournaments.find((t) => t.id === p.tournament_id)?.name || '—',
      }));

    setPendings(withT(pend));
    setApproved(withT(appr));
    setLoading(false);
  }

  async function approve(id) {
    const { error } = await supabase
      .from('participants')
      .update({ payment_status: 'paid' })
      .eq('id', id);

    if (!error) {
      setPendings((prev) => {
        const item = prev.find((p) => p.id === id);
        if (item) setApproved((a) => [{ ...item, payment_status: 'paid' }, ...a]);
        return prev.filter((p) => p.id !== id);
      });
    }
  }

  async function reject(id) {
    const { error } = await supabase
      .from('participants')
      .update({ payment_status: 'rejected' })
      .eq('id', id);

    if (!error) setPendings((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0' }}>
      <Link to="/panel" className="muted" style={{ fontSize: '13px', display: 'inline-block', marginBottom: '20px' }}>
        ← Volver al panel
      </Link>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.8px' }}>
            💳 Validar pagos
          </h1>
          <p className="muted" style={{ fontSize: '14px', marginTop: '6px' }}>
            Revisá los comprobantes que subieron los jugadores
          </p>
        </div>
        <span className={`pill ${pendings.length > 0 ? 'yellow' : 'green'}`}>
          {pendings.length} pendiente(s)
        </span>
      </div>

      {/* PENDIENTES */}
      {pendings.length === 0 ? (
        <div className="empty" style={{ marginBottom: '32px' }}>
          <div style={{ color: '#22d67f', fontSize: '40px', marginBottom: '12px' }}>✓</div>
          <p>No hay comprobantes pendientes. ¡Todo al día!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
          {pendings.map((p) => (
            <div key={p.id} className="panel">
              <div style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr auto',
                gap: '18px',
                alignItems: 'start',
              }}>
                {/* MINIATURA */}
                <div
                  onClick={() => setSelectedReceipt(p.payment_receipt_url)}
                  style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '10px',
                    background: '#101625',
                    border: '1px solid #232c44',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#8a94a8',
                  }}
                >
                  {p.payment_receipt_url ? (
                    <img
                      src={p.payment_receipt_url}
                      alt="Comprobante"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '32px' }}>🖼</span>
                  )}
                </div>

                {/* INFO */}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>
                    {p.name || p.email.split('@')[0]}
                  </div>
                  <div className="muted" style={{ fontSize: '12px', marginBottom: '10px' }}>
                    {p.email}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span className="pill">{p._tournament_name}</span>
                    {p.whatsapp && <span className="pill green">{p.whatsapp}</span>}
                  </div>
                  {p.payment_tx_id && (
                    <div className="muted" style={{ fontSize: '12px', marginTop: '8px' }}>
                      ID operación: <b style={{ color: '#e7ecf5' }}>{p.payment_tx_id}</b>
                    </div>
                  )}
                  {p.payment_notes && (
                    <div className="muted" style={{
                      fontSize: '12px', marginTop: '8px',
                      padding: '8px 12px',
                      background: '#101625',
                      borderRadius: '8px',
                      border: '1px solid #232c44',
                    }}>
                      "{p.payment_notes}"
                    </div>
                  )}
                </div>

                {/* ACCIONES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => approve(p.id)}
                    className="btn btn-success btn-sm"
                  >
                    ✓ Aprobar
                  </button>
                  <button
                    onClick={() => reject(p.id)}
                    className="btn btn-danger btn-sm"
                  >
                    ✕ Rechazar
                  </button>
                  {p.payment_receipt_url && (
                    <button
                      onClick={() => setSelectedReceipt(p.payment_receipt_url)}
                      className="btn btn-ghost btn-sm"
                    >
                      👁 Ver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* APROBADOS */}
      {approved.length > 0 && (
        <div className="panel">
          <h3>✓ Pagos aprobados ({approved.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8a94a8', borderBottom: '1px solid #232c44' }}>
                  <th style={{ padding: '10px 8px' }}>Jugador</th>
                  <th style={{ padding: '10px 8px' }}>Torneo</th>
                  <th style={{ padding: '10px 8px' }}>Email</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #232c44' }}>
                    <td style={{ padding: '10px 8px' }}>
                      <b>{p.name || p.email.split('@')[0]}</b>
                    </td>
                    <td style={{ padding: '10px 8px', color: '#8a94a8' }}>
                      {p._tournament_name}
                    </td>
                    <td style={{ padding: '10px 8px', color: '#8a94a8' }}>
                      {p.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL VISOR DE COMPROBANTE */}
      {selectedReceipt && (
        <div
          onClick={() => setSelectedReceipt(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(5, 8, 16, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'grid', placeItems: 'center',
            padding: '20px', zIndex: 100,
            cursor: 'pointer',
          }}
        >
          <img
            src={selectedReceipt}
            alt="Comprobante"
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              borderRadius: '12px',
            }}
          />
        </div>
      )}
    </div>
  );
}
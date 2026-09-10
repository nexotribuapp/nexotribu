import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin({ user }) {
  const [isAdmin, setIsAdmin] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAndLoad() {
      const { data: adminData } = await supabase
        .from('admin_emails')
        .select('email')
        .eq('email', user?.email)
        .maybeSingle();

      if (!adminData) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      const { data } = await supabase
        .from('organizers')
        .select('*')
        .eq('status', 'pending')
        .eq('profile_completed', true)
        .order('created_at', { ascending: false });

      setRequests(data || []);
      setLoading(false);
    }
    if (user) checkAndLoad();
  }, [user]);

  async function approve(id) {
    const { error } = await supabase
      .from('organizers')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', id);

    if (!error) setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  async function reject(id, reason) {
    const { error } = await supabase
      .from('organizers')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', id);

    if (!error) setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#e7ecf5' }}>
          Acceso restringido
        </h2>
        <p>Esta sección es solo para administradores de NexoTribu.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>
          Panel de administración
        </h1>
        <p className="muted" style={{ fontSize: '14px' }}>
          Solicitudes pendientes de aprobación: <b style={{ color: '#e7ecf5' }}>{requests.length}</b>
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="empty">
          <p>No hay solicitudes pendientes. Todo al día.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {requests.map((req) => (
            <div key={req.id} className="panel">
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #00e0ff, #7b5cff)',
                  display: 'grid', placeItems: 'center',
                  fontSize: '22px', fontWeight: 800, color: '#04121f',
                  flexShrink: 0,
                }}>
                  {(req.name || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>
                    {req.name}
                  </h3>
                  <p className="muted" style={{ fontSize: '13px', marginBottom: '12px' }}>
                    {req.email}
                  </p>

                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '10px', marginBottom: '14px', fontSize: '13px',
                  }}>
                    {req.whatsapp && (
                      <div>
                        <span className="muted">WhatsApp: </span>
                        <a
                          href={`https://wa.me/${req.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#00e0ff' }}
                        >
                          {req.whatsapp}
                        </a>
                      </div>
                    )}
                    {req.instagram && (
                      <div>
                        <span className="muted">Instagram: </span>
                        <a
                          href={`https://instagram.com/${req.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#00e0ff' }}
                        >
                          {req.instagram}
                        </a>
                      </div>
                    )}
                    {req.discord && (
                      <div>
                        <span className="muted">Discord: </span>
                        <span style={{ color: '#e7ecf5' }}>{req.discord}</span>
                      </div>
                    )}
                    {req.experience_years != null && (
                      <div>
                        <span className="muted">Experiencia: </span>
                        <span style={{ color: '#e7ecf5' }}>{req.experience_years} años</span>
                      </div>
                    )}
                    {req.community_size != null && (
                      <div>
                        <span className="muted">Comunidad: </span>
                        <span style={{ color: '#e7ecf5' }}>{req.community_size} personas</span>
                      </div>
                    )}
                  </div>

                  {req.motivation && (
                    <div style={{
                      background: '#101625', border: '1px solid #232c44',
                      borderRadius: '10px', padding: '12px 14px',
                      fontSize: '13px', color: '#c5cdda', marginBottom: '16px',
                    }}>
                      <b style={{ color: '#e7ecf5', fontSize: '12px' }}>Motivación:</b>
                      <p style={{ marginTop: '4px', lineHeight: 1.6 }}>{req.motivation}</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => approve(req.id)}
                      className="btn btn-success"
                    >
                      ✓ Aprobar
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Motivo del rechazo (opcional):');
                        if (reason !== null) reject(req.id, reason);
                      }}
                      className="btn btn-danger"
                    >
                      ✕ Rechazar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
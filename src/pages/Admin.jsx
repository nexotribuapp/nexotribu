import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Admin({ user }) {
  const [isAdmin, setIsAdmin] = useState(null);
  const [tab, setTab] = useState('pendientes');
  const [organizers, setOrganizers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAndLoad();
    // eslint-disable-next-line
  }, [user]);

  async function checkAndLoad() {
    setLoading(true);

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

    const [orgsRes, toursRes] = await Promise.all([
      supabase.from('organizers').select('*').order('created_at', { ascending: false }),
      supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
    ]);

    setOrganizers(orgsRes.data || []);
    setTournaments(toursRes.data || []);
    setLoading(false);
  }

  async function approve(id) {
    const { error } = await supabase
      .from('organizers')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', id);

    if (!error) {
      setOrganizers((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'approved' } : o)));
    }
  }

  async function reject(id) {
    const reason = prompt('Motivo del rechazo (opcional):');
    if (reason === null) return;

    const { error } = await supabase
      .from('organizers')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', id);

    if (!error) {
      setOrganizers((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'rejected' } : o)));
    }
  }

  async function suspend(id) {
    if (!confirm('¿Suspender este organizador?')) return;
    const { error } = await supabase
      .from('organizers')
      .update({ status: 'pending' })
      .eq('id', id);
    if (!error) {
      setOrganizers((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'pending' } : o)));
    }
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
        <p>Esta sección es solo para el CEO de NexoTribu.</p>
      </div>
    );
  }

  // Métricas globales
  const pendingOrgs = organizers.filter((o) => o.status === 'pending' && o.profile_completed);
  const approvedOrgs = organizers.filter((o) => o.status === 'approved');
  const rejectedOrgs = organizers.filter((o) => o.status === 'rejected');
  const openTournaments = tournaments.filter((t) => t.status === 'open');
  const paidTournaments = tournaments.filter((t) => t.is_paid);

  // Torneos del organizador seleccionado
  const selectedOrgTournaments = selectedOrg
    ? tournaments.filter((t) => t.organizer_id === selectedOrg.id)
    : [];

  // ──────────────────────────────────────────────────────
  // VISTA: DETALLE DE UN ORGANIZADOR
  // ──────────────────────────────────────────────────────
  if (selectedOrg) {
    return (
      <div style={{ padding: '40px 0' }}>
        <button
          onClick={() => setSelectedOrg(null)}
          className="muted"
          style={{ fontSize: '13px', display: 'inline-block', marginBottom: '20px' }}
        >
          ← Volver a la lista
        </button>

        <div className="panel" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #00e0ff, #7b5cff)',
              display: 'grid', placeItems: 'center',
              fontSize: '28px', fontWeight: 800, color: '#04121f',
            }}>
              {(selectedOrg.name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
                {selectedOrg.name}
              </h2>
              <p className="muted" style={{ fontSize: '13px' }}>{selectedOrg.email}</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span className={`pill ${
                  selectedOrg.status === 'approved' ? 'green' :
                  selectedOrg.status === 'rejected' ? 'red' : 'yellow'
                }`}>
                  {selectedOrg.status === 'approved' ? 'Aprobado' :
                   selectedOrg.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                </span>
                <span className="pill">{selectedOrgTournaments.length} torneos</span>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #232c44',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            fontSize: '13px',
          }}>
            {selectedOrg.instagram && (
              <div>
                <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Instagram</div>
                <a href={`https://instagram.com/${selectedOrg.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ color: '#00e0ff' }}>
                  {selectedOrg.instagram}
                </a>
              </div>
            )}
            {selectedOrg.discord && (
              <div>
                <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Discord</div>
                <span>{selectedOrg.discord}</span>
              </div>
            )}
            {selectedOrg.telegram && (
              <div>
                <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Telegram</div>
                <span>{selectedOrg.telegram}</span>
              </div>
            )}
            {selectedOrg.experience_years != null && (
              <div>
                <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Experiencia</div>
                <span>{selectedOrg.experience_years} años</span>
              </div>
            )}
            {selectedOrg.community_size != null && (
              <div>
                <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Comunidad</div>
                <span>{selectedOrg.community_size} personas</span>
              </div>
            )}
          </div>

          {selectedOrg.motivation && (
            <div style={{
              marginTop: '20px',
              padding: '14px',
              background: '#101625',
              border: '1px solid #232c44',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#c5cdda',
            }}>
              <b style={{ color: '#e7ecf5', display: 'block', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase' }}>
                Motivación
              </b>
              {selectedOrg.motivation}
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            {selectedOrg.status !== 'approved' && (
              <button onClick={() => approve(selectedOrg.id)} className="btn btn-success">
                ✓ Aprobar organizador
              </button>
            )}
            {selectedOrg.status !== 'rejected' && (
              <button onClick={() => reject(selectedOrg.id)} className="btn btn-danger">
                ✕ Rechazar
              </button>
            )}
            {selectedOrg.status === 'approved' && (
              <button onClick={() => suspend(selectedOrg.id)} className="btn btn-ghost">
                ⏸ Suspender
              </button>
            )}
          </div>
        </div>

        {/* Torneos del organizador */}
        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
          Torneos de {selectedOrg.name}
        </h3>

        {selectedOrgTournaments.length === 0 ? (
          <div className="empty">
            <p>Este organizador todavía no creó torneos.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}>
            {selectedOrgTournaments.map((t) => (
              <Link
                key={t.id}
                to={`/torneo/${t.slug}`}
                target="_blank"
                style={{
                  background: 'linear-gradient(180deg, #161d2e 0%, #1c2438 100%)',
                  border: '1px solid #232c44',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{
                  height: '100px',
                  background: t.banner_url ? `url(${t.banner_url}) center/cover` : 'linear-gradient(135deg, #1a2540, #0e1524)',
                  display: 'grid', placeItems: 'center',
                }}>
                  {!t.banner_url && (
                    <span style={{ fontSize: '36px', opacity: 0.4 }}>
                      {t.game === 'eFootball' ? '⚽' : '🎮'}
                    </span>
                  )}
                </div>
                <div style={{ padding: '14px' }}>
                  <b style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>{t.name}</b>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <span className="pill blue">{t.game}</span>
                    <span className="pill">{t.type}</span>
                    <span className={`pill ${t.status === 'open' ? 'green' : 'blue'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: '12px' }}>
                    {t.max_participants} cupos · {t.is_paid ? `USD ${t.price}` : 'Gratis'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────
  // VISTA: PANEL PRINCIPAL DEL CEO
  // ──────────────────────────────────────────────────────
  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ marginBottom: '32px' }}>
        <div className="pill gold" style={{
          background: 'linear-gradient(135deg, #ffd166, #ffb02e)',
          color: '#1a1408',
          border: 'none',
          marginBottom: '12px',
        }}>
          ⭐ CEO
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '6px' }}>
          Panel de control
        </h1>
        <p className="muted" style={{ fontSize: '14px' }}>
          Gestión completa de NexoTribu
        </p>
      </div>

      {/* MÉTRICAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Organizadores</div>
          <div style={{ fontSize: '26px', fontWeight: 800 }}>{organizers.length}</div>
        </div>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Aprobados</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#22d67f' }}>{approvedOrgs.length}</div>
        </div>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Pendientes</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffb02e' }}>{pendingOrgs.length}</div>
        </div>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Torneos totales</div>
          <div style={{ fontSize: '26px', fontWeight: 800 }}>{tournaments.length}</div>
        </div>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Torneos abiertos</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#00e0ff' }}>{openTournaments.length}</div>
        </div>
        <div className="panel">
          <div className="muted" style={{ fontSize: '12px' }}>Torneos pagos</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffd166' }}>{paidTournaments.length}</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '20px',
        borderBottom: '1px solid #232c44',
        paddingBottom: '12px',
        overflowX: 'auto',
      }}>
        {[
          { id: 'pendientes', label: `Pendientes`, count: pendingOrgs.length, alert: pendingOrgs.length > 0 },
          { id: 'aprobados', label: 'Aprobados', count: approvedOrgs.length },
          { id: 'rechazados', label: 'Rechazados', count: rejectedOrgs.length },
          { id: 'todos', label: 'Todos', count: organizers.length },
          { id: 'torneos', label: 'Torneos', count: tournaments.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              fontSize: '13px',
              fontWeight: 600,
              background: tab === t.id ? 'rgba(0, 224, 255, 0.08)' : 'transparent',
              color: tab === t.id ? '#00e0ff' : '#8a94a8',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: '0.18s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {t.label} ({t.count})
            {t.alert && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffb02e' }} />}
          </button>
        ))}
      </div>

      {/* CONTENIDO POR TAB */}
      {tab === 'pendientes' && (
        pendingOrgs.length === 0 ? (
          <div className="empty">
            <div style={{ color: '#22d67f', fontSize: '40px', marginBottom: '12px' }}>✓</div>
            <p>No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {pendingOrgs.map((o) => (
              <div key={o.id} className="panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, #00e0ff, #7b5cff)',
                    display: 'grid', placeItems: 'center',
                    fontSize: '22px', fontWeight: 800, color: '#04121f',
                  }}>
                    {(o.name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <b style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>{o.name}</b>
                    <span className="muted" style={{ fontSize: '13px' }}>{o.email}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setSelectedOrg(o)} className="btn btn-ghost btn-sm">
                      👁 Ver detalles
                    </button>
                    <button onClick={() => approve(o.id)} className="btn btn-success btn-sm">
                      ✓ Aprobar
                    </button>
                    <button onClick={() => reject(o.id)} className="btn btn-danger btn-sm">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {(tab === 'aprobados' || tab === 'rechazados' || tab === 'todos') && (() => {
        const list =
          tab === 'aprobados' ? approvedOrgs :
          tab === 'rechazados' ? rejectedOrgs :
          organizers;
        if (list.length === 0) return <div className="empty"><p>No hay organizadores en esta categoría.</p></div>;
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {list.map((o) => {
              const orgTournaments = tournaments.filter((t) => t.organizer_id === o.id);
              return (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrg(o)}
                  style={{
                    background: 'linear-gradient(180deg, #161d2e 0%, #1c2438 100%)',
                    border: '1px solid #232c44',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'left',
                    color: 'inherit',
                    cursor: 'pointer',
                    transition: '0.18s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #00e0ff, #7b5cff)',
                      display: 'grid', placeItems: 'center',
                      fontSize: '18px', fontWeight: 800, color: '#04121f',
                    }}>
                      {(o.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: '14px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.name}
                      </b>
                      <span className="muted" style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {o.email}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className={`pill ${
                      o.status === 'approved' ? 'green' :
                      o.status === 'rejected' ? 'red' : 'yellow'
                    }`}>
                      {o.status}
                    </span>
                    <span className="pill">{orgTournaments.length} torneos</span>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })()}

      {tab === 'torneos' && (
        tournaments.length === 0 ? (
          <div className="empty"><p>No hay torneos creados todavía.</p></div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}>
            {tournaments.map((t) => {
              const owner = organizers.find((o) => o.id === t.organizer_id);
              return (
                <Link
                  key={t.id}
                  to={`/torneo/${t.slug}`}
                  target="_blank"
                  style={{
                    background: 'linear-gradient(180deg, #161d2e 0%, #1c2438 100%)',
                    border: '1px solid #232c44',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{
                    height: '100px',
                    background: t.banner_url ? `url(${t.banner_url}) center/cover` : 'linear-gradient(135deg, #1a2540, #0e1524)',
                    display: 'grid', placeItems: 'center',
                  }}>
                    {!t.banner_url && (
                      <span style={{ fontSize: '36px', opacity: 0.4 }}>
                        {t.game === 'eFootball' ? '⚽' : '🎮'}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '14px' }}>
                    <b style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>{t.name}</b>
                    <div className="muted" style={{ fontSize: '11px', marginBottom: '8px' }}>
                      por {owner?.name || 'Desconocido'}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="pill blue">{t.game}</span>
                      <span className={`pill ${t.status === 'open' ? 'green' : 'blue'}`}>{t.status}</span>
                      {t.is_paid && <span className="pill yellow">USD {t.price}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSavedTokens, removeToken } from '../lib/playerTokens';

export default function MisAccesos() {
  const [loading, setLoading] = useState(true);
  const [accesses, setAccesses] = useState([]);

  useEffect(() => {
    loadAccesses();
  }, []);

  async function loadAccesses() {
    const saved = getSavedTokens();

    if (saved.length === 0) {
      setLoading(false);
      return;
    }

    const verified = await Promise.all(
      saved.map(async (t) => {
        const { data } = await supabase.rpc('get_participant_by_token', {
          p_token: t.token,
        });

        if (!data || data.error) {
          removeToken(t.token);
          return null;
        }

        return {
          ...t,
          participant: data.participant,
          tournament: data.tournament,
        };
      })
    );

    setAccesses(verified.filter(Boolean));
    setLoading(false);
  }

  function handleRemove(token) {
    if (!confirm('¿Eliminar este acceso de tu lista?')) return;
    removeToken(token);
    setAccesses((prev) => prev.filter((a) => a.token !== token));
  }

  if (loading) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0', maxWidth: '720px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 800,
          letterSpacing: '-1px',
          marginBottom: '8px',
        }}>
          Mis accesos a torneos
        </h1>
        <p className="muted" style={{ fontSize: '14px', lineHeight: 1.6 }}>
          Acá vas a encontrar todos los torneos en los que te inscribiste desde este navegador,
          junto con su enlace de acceso único.
        </p>
      </div>

      {accesses.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '8px',
            color: '#e7ecf5',
          }}>
            Todavía no tenés accesos guardados
          </h3>
          <p className="muted" style={{ fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
            Cuando te inscribas a un torneo, tu enlace de acceso va a aparecer acá automáticamente.
          </p>
          <Link to="/" className="btn btn-primary">
            Ver torneos abiertos
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {accesses.map((access) => {
            const p = access.participant;
            const t = access.tournament;
            const isPending =
              p.payment_status === 'pending' ||
              p.payment_status === 'pending_review';

            const statusLabel =
              p.payment_status === 'paid' ? 'Pagado' :
              p.payment_status === 'free' ? 'Confirmado' :
              p.payment_status === 'pending_review' ? 'En revisión' :
              p.payment_status === 'rejected' ? 'Rechazado' : 'Pendiente';

            const statusClass =
              p.payment_status === 'paid' || p.payment_status === 'free' ? 'green' :
              p.payment_status === 'pending_review' ? 'yellow' :
              p.payment_status === 'rejected' ? 'red' : 'yellow';

            return (
              <div key={access.token} className="panel" style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}>
                {/* ICONO */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: t?.banner_url
                    ? `url(${t.banner_url}) center/cover`
                    : 'linear-gradient(135deg, #1a2540, #0e1524)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '24px',
                  flexShrink: 0,
                }}>
                  {!t?.banner_url && (t?.game === 'eFootball' ? '⚽' : '🎮')}
                </div>

                {/* INFO */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px',
                    flexWrap: 'wrap',
                  }}>
                    <b style={{ fontSize: '15px' }}>{t?.name || 'Torneo'}</b>
                    <span className={`pill ${statusClass}`}>{statusLabel}</span>
                  </div>
                  <div className="muted" style={{ fontSize: '12px', marginBottom: '4px' }}>
                    {p?.name} · {p?.email}
                  </div>
                  <div className="muted" style={{ fontSize: '11px' }}>
                    {t?.game} · Inscripto el {new Date(p?.created_at || Date.now()).toLocaleDateString('es-AR')}
                  </div>
                </div>

                {/* ACCIONES */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Link
                    to={`/acceso/${access.token}`}
                    className="btn btn-primary btn-sm"
                  >
                    Entrar al panel
                  </Link>
                  <button
                    onClick={() => handleRemove(access.token)}
                    className="btn btn-ghost btn-sm"
                    title="Eliminar de mi lista"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INFO */}
      <div className="panel" style={{ marginTop: '28px' }}>
        <h3 style={{ marginBottom: '14px' }}>Cómo funcionan las cuentas de torneo</h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          fontSize: '13px',
          lineHeight: 1.6,
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>⏱</span>
            <div>
              <b style={{ color: '#e7ecf5', display: 'block', marginBottom: '2px' }}>
                Torneos relámpago (cuenta temporal)
              </b>
              <span className="muted">
                La cuenta se elimina automáticamente cuando finaliza el torneo.
                Tu historial deportivo queda guardado en el ranking público para siempre.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>📅</span>
            <div>
              <b style={{ color: '#e7ecf5', display: 'block', marginBottom: '2px' }}>
                Ligas de temporada (cuenta persistente)
              </b>
              <span className="muted">
                La cuenta se mantiene activa durante toda la temporada declarada por el organizador.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
            <div>
              <b style={{ color: '#e7ecf5', display: 'block', marginBottom: '2px' }}>
                Si cambiás de dispositivo o navegador
              </b>
              <span className="muted">
                Guardá el enlace de cada torneo. Estamos trabajando en un sistema de login por
                correo con código de verificación para que tus accesos estén disponibles en cualquier lugar.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
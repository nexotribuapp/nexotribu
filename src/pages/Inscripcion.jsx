import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getGameConfig } from '../lib/config';

export default function Inscripcion() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: '',
    discord: '',
    telegram: '',
    game_id: '',
  });

  // Verificar sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cargar torneo
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      setTournament(data);
      setLoading(false);
    }
    load();
  }, [slug]);

  // Pre-rellenar nombre con el de Google
  useEffect(() => {
    if (user && !form.name) {
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      if (googleName) {
        setForm((prev) => ({ ...prev, name: googleName }));
      }
    }
    // eslint-disable-next-line
  }, [user]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href,
      },
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: rpcError } = await supabase.rpc('register_participant_v2', {
      p_tournament_id: tournament.id,
      p_name: form.name.trim(),
      p_game_id: form.game_id.trim() || null,
      p_discord: form.discord.trim() || null,
      p_telegram: form.telegram.trim() || null,
    });

    if (rpcError) {
      setError(rpcError.message);
      setSubmitting(false);
      return;
    }

    if (data?.error) {
      setError(data.error);
      setSubmitting(false);
      return;
    }

    // Ir a la pantalla de éxito (por participant_id)
    if (data.is_paid) {
      navigate(`/torneo/${slug}/pago/${data.participant_id}`);
    } else {
      navigate(`/torneo/${slug}/success/${data.participant_id}`);
    }
  }

  if (loading || checkingAuth) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#e7ecf5' }}>
          Torneo no encontrado
        </h2>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    );
  }

  const gameConfig = getGameConfig(tournament.game);

  return (
    <div style={{ maxWidth: '560px', margin: '40px auto' }}>
      <Link to={`/torneo/${slug}`} className="muted" style={{ fontSize: '13px', display: 'inline-block', marginBottom: '16px' }}>
        ← Volver al torneo
      </Link>

      <div className="panel">
        <h2 style={{ marginBottom: '6px' }}>Inscripción</h2>
        <p className="muted" style={{ fontSize: '14px', marginBottom: '24px' }}>
          {tournament.name} · {tournament.game}
        </p>

        {/* Si NO está logueado → Google */}
        {!user ? (
          <>
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(0,224,255,.06), rgba(123,92,255,.04))',
              border: '1px solid rgba(0,224,255,.25)',
              borderRadius: '14px',
              marginBottom: '20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>🎮</div>
              <h3 style={{
                fontSize: '17px',
                fontWeight: 700,
                marginBottom: '8px',
                color: '#e7ecf5',
              }}>
                Creá tu cuenta en 1 click
              </h3>
              <p className="muted" style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                Con tu cuenta vas a poder anotarte a todos los torneos,
                ver tus partidos y acumular tu historial en el ranking.
              </p>

              <button
                onClick={handleGoogleLogin}
                className="btn btn-block"
                style={{
                  background: '#fff',
                  color: '#1a1408',
                  fontWeight: 700,
                  fontSize: '15px',
                  padding: '14px 20px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </button>

              <p className="muted" style={{ fontSize: '11px', marginTop: '14px' }}>
                Al continuar aceptás los <a href="#/terminos" style={{ color: '#00e0ff' }}>términos</a> y la <a href="#/privacidad" style={{ color: '#00e0ff' }}>política de privacidad</a>.
              </p>
            </div>
          </>
        ) : (
          /* Si YA está logueado → formulario corto */
          <>
            {/* Info del usuario */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              background: '#101625',
              border: '1px solid #232c44',
              borderRadius: '10px',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00e0ff, #7b5cff)',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                color: '#04121f',
                fontSize: '16px',
              }}>
                {(form.name || user.email || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', color: '#8a94a8' }}>Cuenta conectada</div>
                <b style={{ fontSize: '13px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </b>
              </div>
              <div className="pill green" style={{ fontSize: '10px' }}>✓ Listo</div>
            </div>

            {tournament.is_paid && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(0,224,255,.08), rgba(123,92,255,.06))',
                border: '1px solid rgba(0,224,255,.25)',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '20px',
              }}>
                <div className="muted" style={{ fontSize: '12px', marginBottom: '6px' }}>
                  Aporte de participación
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#00e0ff' }}>
                  USD {tournament.price}
                </div>
                <p className="muted" style={{ fontSize: '12px', marginTop: '6px' }}>
                  Vas a subir el comprobante en el próximo paso.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre / Alias <span className="required">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                  placeholder="Cómo querés aparecer en el ranking"
                />
              </div>

              <div className="form-group">
                <label>
                  {gameConfig.game_id_label}{' '}
                  <span style={{ color: '#8a94a8', fontWeight: 500 }}>({tournament.game})</span>
                </label>
                <input
                  value={form.game_id}
                  onChange={(e) => update('game_id', e.target.value)}
                  placeholder={gameConfig.game_id_placeholder}
                />
                <small>{gameConfig.game_id_help}</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discord</label>
                  <input
                    value={form.discord}
                    onChange={(e) => update('discord', e.target.value)}
                    placeholder="usuario#1234"
                  />
                </div>
                <div className="form-group">
                  <label>Telegram</label>
                  <input
                    value={form.telegram}
                    onChange={(e) => update('telegram', e.target.value)}
                    placeholder="@usuario"
                  />
                </div>
              </div>

              <div style={{
                marginTop: '8px',
                padding: '12px 14px',
                background: '#101625',
                border: '1px solid #232c44',
                borderRadius: '10px',
                fontSize: '12px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}>
                <span style={{ color: '#00e0ff' }}>🔒</span>
                <span className="muted">
                  Al anotarte aceptás participar en una <b style={{ color: '#e7ecf5' }}>competición de habilidad</b>. Los datos son verificados por el organizador.
                </span>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(255,61,113,.08)',
                  border: '1px solid rgba(255,61,113,.35)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: '#ff3d71',
                  marginTop: '16px',
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  {submitting
                    ? 'Anotando...'
                    : (tournament.is_paid ? 'Continuar al pago' : 'Confirmar inscripción')}
                </button>
                <Link to={`/torneo/${slug}`} className="btn btn-ghost">Cancelar</Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
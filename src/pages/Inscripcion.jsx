import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Inscripcion() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    email: '',
    name: '',
    whatsapp: '',
    game_id: '',
  });

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

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: rpcError } = await supabase.rpc('register_participant', {
      p_tournament_id: tournament.id,
      p_email: form.email.trim(),
      p_name: form.name.trim(),
      p_whatsapp: form.whatsapp.trim() || null,
      p_game_id: form.game_id.trim() || null,
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

    // Guardar el token en localStorage para reconocer al jugador
    localStorage.setItem('nexotribu_player_token', data.token);

    // Redirigir a la pantalla de éxito
    navigate(`/inscripcion-exitosa/${data.token}`);
  }

  if (loading) {
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

  return (
    <div style={{ maxWidth: '560px', margin: '40px auto' }}>
      <Link to={`/torneo/${slug}`} className="muted" style={{ fontSize: '13px', display: 'inline-block', marginBottom: '16px' }}>
        ← Volver al torneo
      </Link>

      <div className="panel">
        <h2 style={{ marginBottom: '6px' }}>Inscripción</h2>
        <p className="muted" style={{ fontSize: '14px', marginBottom: '24px' }}>
          {tournament.name}
        </p>

        {tournament.is_paid && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,224,255,.08), rgba(123,92,255,.06))',
            border: '1px solid rgba(0,224,255,.25)',
            borderRadius: '14px', padding: '16px', marginBottom: '20px',
          }}>
            <div className="muted" style={{ fontSize: '12px', marginBottom: '6px' }}>Aporte de participación</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#00e0ff' }}>
              USD {tournament.price}
            </div>
            <p className="muted" style={{ fontSize: '12px', marginTop: '6px' }}>
              Vas a poder elegir el medio de pago en el próximo paso.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email <span className="required">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
              placeholder="tu@email.com"
            />
            <small>Te enviamos tu enlace de acceso a este email.</small>
          </div>

          <div className="form-group">
            <label>Nombre / Alias <span className="required">*</span></label>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              placeholder="Cómo querés aparecer en el ranking"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>WhatsApp</label>
              <input
                value={form.whatsapp}
                onChange={(e) => update('whatsapp', e.target.value)}
                placeholder="+54 9 11 ..."
              />
            </div>
            <div className="form-group">
              <label>ID de juego</label>
              <input
                value={form.game_id}
                onChange={(e) => update('game_id', e.target.value)}
                placeholder="PSN / Xbox"
              />
            </div>
          </div>

          <div style={{
            marginTop: '16px', padding: '12px 14px',
            background: '#101625', border: '1px solid #232c44',
            borderRadius: '10px', fontSize: '12px',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
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
              borderRadius: '10px', padding: '12px 14px',
              fontSize: '13px', color: '#ff3d71', marginTop: '16px',
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
              {submitting ? 'Inscribiendo...' : (tournament.is_paid ? 'Continuar al pago' : 'Confirmar inscripción')}
            </button>
            <Link to={`/torneo/${slug}`} className="btn btn-ghost">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
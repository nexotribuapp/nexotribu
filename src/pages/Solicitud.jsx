import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Solicitud({ user, organizer, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: organizer?.name || '',
    instagram: '',
    discord: '',
    telegram: '',
    experience_years: '',
    community_size: '',
    motivation: '',
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!form.discord.trim() && !form.telegram.trim()) {
      setError('Necesitamos al menos un medio de contacto: Discord o Telegram');
      setLoading(false);
      return;
    }

    const { data, error: updateError } = await supabase
      .from('organizers')
      .update({
        name: form.name,
        instagram: form.instagram.trim() || null,
        discord: form.discord.trim() || null,
        telegram: form.telegram.trim() || null,
        experience_years: parseInt(form.experience_years) || null,
        community_size: parseInt(form.community_size) || null,
        motivation: form.motivation.trim(),
        profile_completed: true,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error(updateError);
      setError('Hubo un problema al enviar la solicitud. Intentá de nuevo.');
      setLoading(false);
      return;
    }

    setLoading(false);
    if (onComplete) onComplete(data);
    window.location.href = '/esperando';
  }

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto' }}>
      <div className="panel">
        <h2 style={{ marginBottom: '6px' }}>Querés ser organizador en NexoTribu</h2>
        <p className="muted" style={{ marginBottom: '24px', fontSize: '14px' }}>
          Contanos un poco sobre vos. Revisamos cada solicitud personalmente y te
          contactamos en las próximas 24-48 horas.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre o nombre de tu comunidad <span className="required">*</span></label>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              placeholder="Ej: Liga Argentina FC"
            />
          </div>

          <div className="form-group">
            <label>Instagram</label>
            <input
              value={form.instagram}
              onChange={(e) => update('instagram', e.target.value)}
              placeholder="@tucuenta"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Discord</label>
              <input
                value={form.discord}
                onChange={(e) => update('discord', e.target.value)}
                placeholder="usuario#1234 o @usuario"
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
          <small style={{ color: '#8a94a8', fontSize: '12px', marginTop: '-8px', display: 'block', marginBottom: '16px' }}>
            Uno de los dos es obligatorio. Es por donde te vamos a contactar.
          </small>

          <div className="form-row">
            <div className="form-group">
              <label>Años organizando torneos <span className="required">*</span></label>
              <input
                type="number"
                min="0"
                max="50"
                value={form.experience_years}
                onChange={(e) => update('experience_years', e.target.value)}
                required
                placeholder="Ej: 3"
              />
            </div>
            <div className="form-group">
              <label>Tamaño de tu comunidad <span className="required">*</span></label>
              <input
                type="number"
                min="0"
                max="100000"
                value={form.community_size}
                onChange={(e) => update('community_size', e.target.value)}
                required
                placeholder="Ej: 250 jugadores"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Por qué querés organizar en NexoTribu <span className="required">*</span></label>
            <textarea
              value={form.motivation}
              onChange={(e) => update('motivation', e.target.value)}
              required
              rows="4"
              placeholder="Contanos qué tipo de torneos hacés, con qué juegos, cómo manejás los pagos, etc."
            />
            <small>Cuanta más info nos des, más rápido te aprobamos.</small>
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,61,113,.08)',
              border: '1px solid rgba(255,61,113,.35)',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '13px',
              color: '#ff3d71',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Enviando solicitud...' : 'Enviar solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
}
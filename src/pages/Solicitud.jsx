import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Solicitud({ user, organizer, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: organizer?.name || '',
    whatsapp: '',
    instagram: '',
    discord: '',
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

    const { data, error: updateError } = await supabase
      .from('organizers')
      .update({
        name: form.name,
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        discord: form.discord,
        experience_years: parseInt(form.experience_years) || null,
        community_size: parseInt(form.community_size) || null,
        motivation: form.motivation,
        profile_completed: true,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error:', updateError);
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
        <h2>Querés ser organizador en NexoTribu</h2>
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

          <div className="form-row">
            <div className="form-group">
              <label>WhatsApp <span className="required">*</span></label>
              <input
                value={form.whatsapp}
                onChange={(e) => update('whatsapp', e.target.value)}
                required
                placeholder="+54 9 11 1234 5678"
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
          </div>

          <div className="form-group">
            <label>Usuario de Discord</label>
            <input
              value={form.discord}
              onChange={(e) => update('discord', e.target.value)}
              placeholder="usuario#1234 o @usuario"
            />
            <small>Opcional pero recomendado. Es donde suele coordinarse todo.</small>
          </div>

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
            <p style={{ color: '#ff3d71', fontSize: '13px', marginBottom: '16px' }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Enviando solicitud...' : 'Enviar solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { uploadToImgBB } from '../lib/imgbb';

export default function CrearTorneo({ user, organizer }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    game: 'eFootball',
    type: '1v1',
    format: 'Eliminacion directa',
    platform: 'Multiplataforma',
    start_date: '',
    max_participants: 16,
    prize: '',
    description: '',
    rules: '',
    is_paid: false,
    price: 0,
    account_lifecycle: 'temporal',
  });

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleBannerChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('El banner supera 5 MB');
      return;
    }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  function generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).slice(2, 6);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let banner_url = null;
      if (bannerFile) {
        banner_url = await uploadToImgBB(bannerFile);
      }

      const slug = generateSlug(form.name);
      const rulesArray = form.rules
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const payload = {
        organizer_id: user.id,
        slug,
        name: form.name,
        game: form.game,
        type: form.type,
        format: form.format,
        platform: form.platform,
        start_date: form.start_date || null,
        max_participants: parseInt(form.max_participants),
        prize: form.prize || 'A definir',
        description: form.description,
        rules: rulesArray,
        is_paid: form.is_paid,
        price: form.is_paid ? parseFloat(form.price) : 0,
        account_lifecycle: form.account_lifecycle,
        banner_url,
        status: 'open',
        prize_distribution: form.is_paid
          ? { organizer_pct: 15, first_pct: 50, second_pct: 30, third_pct: 15, fourth_pct: 5 }
          : null,
      };

      const { data, error: insertError } = await supabase
        .from('tournaments')
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;

      navigate('/panel');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al crear el torneo');
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto' }}>
      <a href="/panel" className="muted" style={{ fontSize: '13px', display: 'inline-block', marginBottom: '16px' }}>
        ← Volver al panel
      </a>

      <div className="panel">
        <h2 style={{ marginBottom: '6px' }}>Crear torneo</h2>
        <p className="muted" style={{ fontSize: '14px', marginBottom: '24px' }}>
          Vas a crear el torneo bajo tu cuenta: <b style={{ color: '#e7ecf5' }}>{organizer?.name}</b>
        </p>

        <form onSubmit={handleSubmit}>
          {/* BANNER */}
          <div className="form-group">
            <label>Banner del torneo (opcional)</label>
            <div
              onClick={() => document.getElementById('banner-input').click()}
              style={{
                position: 'relative', borderRadius: '12px', overflow: 'hidden',
                background: '#101625', border: '2px dashed #232c44',
                height: '180px', display: 'grid', placeItems: 'center',
                cursor: 'pointer', textAlign: 'center', padding: '20px',
              }}
            >
              <input
                id="banner-input"
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                style={{ display: 'none' }}
              />
              {bannerPreview ? (
                <img
                  src={bannerPreview}
                  alt="Banner"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ color: '#8a94a8' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼</div>
                  <b style={{ color: '#e7ecf5', display: 'block', marginBottom: '4px' }}>Subir banner</b>
                  <small>1200 x 400 px recomendado</small>
                </div>
              )}
            </div>
          </div>

          {/* NOMBRE */}
          <div className="form-group">
            <label>Nombre del torneo <span className="required">*</span></label>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              placeholder="Ej: Copa Apertura 2026"
            />
          </div>

          {/* JUEGO + PLATAFORMA */}
          <div className="form-row">
            <div className="form-group">
              <label>Juego <span className="required">*</span></label>
              <select value={form.game} onChange={(e) => update('game', e.target.value)} required>
                <option value="eFootball">eFootball</option>
                <option value="EA FC">EA FC</option>
              </select>
            </div>
            <div className="form-group">
              <label>Plataforma</label>
              <select value={form.platform} onChange={(e) => update('platform', e.target.value)}>
                <option value="PS5">PS5</option>
                <option value="Xbox">Xbox</option>
                <option value="PC">PC</option>
                <option value="PS5 / Xbox">PS5 / Xbox</option>
                <option value="Multiplataforma">Multiplataforma</option>
              </select>
            </div>
          </div>

          {/* TIPO */}
          <div className="form-group">
            <label>Tipo de torneo <span className="required">*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { id: '1v1', label: '1 vs 1', desc: 'Duelos individuales' },
                { id: 'liga', label: 'Liga', desc: 'Todos vs todos' },
                { id: 'coop', label: 'Coop 2v2', desc: 'Equipos de 2' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update('type', t.id)}
                  style={{
                    padding: '14px', borderRadius: '12px', textAlign: 'left',
                    background: form.type === t.id ? 'rgba(0,224,255,.08)' : '#101625',
                    border: form.type === t.id ? '2px solid #00e0ff' : '2px solid #232c44',
                    color: '#e7ecf5', cursor: 'pointer', transition: '0.18s',
                  }}
                >
                  <b style={{ fontSize: '14px', display: 'block' }}>{t.label}</b>
                  <small style={{ color: '#8a94a8', fontSize: '11px' }}>{t.desc}</small>
                </button>
              ))}
            </div>
          </div>

          {/* FORMATO + CUPOS */}
          <div className="form-row">
            <div className="form-group">
              <label>Formato</label>
              <select value={form.format} onChange={(e) => update('format', e.target.value)}>
                <option value="Eliminacion directa">Eliminación directa</option>
                <option value="Grupos + Playoffs">Grupos + Playoffs</option>
                <option value="Todos vs todos">Todos vs todos</option>
              </select>
            </div>
            <div className="form-group">
              <label>Cupos máximos <span className="required">*</span></label>
              <input
                type="number"
                min="4"
                max="128"
                value={form.max_participants}
                onChange={(e) => update('max_participants', e.target.value)}
                required
              />
            </div>
          </div>

          {/* FECHA + PREMIO */}
          <div className="form-row">
            <div className="form-group">
              <label>Fecha de inicio</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => update('start_date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Premio (texto libre)</label>
              <input
                value={form.prize}
                onChange={(e) => update('prize', e.target.value)}
                placeholder="Ej: USD 100 + Trofeo"
              />
            </div>
          </div>

          {/* DESCRIPCION */}
          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows="3"
              placeholder="Contá de qué se trata el torneo..."
            />
          </div>

          {/* REGLAS */}
          <div className="form-group">
            <label>Reglas (una por línea)</label>
            <textarea
              value={form.rules}
              onChange={(e) => update('rules', e.target.value)}
              rows="4"
              placeholder="Partidos de 6 min&#10;Sin equipos clásicos&#10;Reportar con captura"
            />
            <small>Cada línea se convierte en una regla individual.</small>
          </div>

          {/* PAGO */}
          <div className="form-group">
            <label>¿Es torneo pago?</label>
            <select
              value={form.is_paid ? 'true' : 'false'}
              onChange={(e) => update('is_paid', e.target.value === 'true')}
            >
              <option value="false">No, gratuito</option>
              <option value="true">Sí, requiere aporte</option>
            </select>
          </div>

          {form.is_paid && (
            <div style={{
              background: 'rgba(255,209,102,.06)',
              border: '1px solid rgba(255,209,102,.25)',
              borderRadius: '12px', padding: '16px', marginBottom: '16px',
            }}>
              <div className="form-row">
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Aporte (USD de referencia) <span className="required">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => update('price', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Ciclo de vida de la cuenta</label>
                  <select
                    value={form.account_lifecycle}
                    onChange={(e) => update('account_lifecycle', e.target.value)}
                  >
                    <option value="temporal">Temporal (se elimina al finalizar)</option>
                    <option value="seasonal">De temporada (persiste)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(255,61,113,.08)',
              border: '1px solid rgba(255,61,113,.35)',
              borderRadius: '10px', padding: '12px 14px',
              fontSize: '13px', color: '#ff3d71', marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Creando torneo...' : 'Crear torneo'}
            </button>
            <a href="/panel" className="btn btn-ghost">Cancelar</a>
          </div>
        </form>
      </div>
    </div>
  );
}
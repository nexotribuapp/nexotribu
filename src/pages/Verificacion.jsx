import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { uploadToImgBB } from '../lib/imgbb';

export default function Verificacion() {
  const { slug, participantId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [dniFile, setDniFile] = useState(null);
  const [dniPreview, setDniPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  const [form, setForm] = useState({
    full_name: '',
    dni: '',
    birth_date: '',
    consent: false,
  });

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/');
        return;
      }
      setUser(session.user);

      const [tRes, pRes] = await Promise.all([
        supabase.from('tournaments').select('*').eq('slug', slug).maybeSingle(),
        supabase.from('participants').select('*').eq('id', participantId).maybeSingle(),
      ]);

      if (!tRes.data || !pRes.data) {
        setError('Datos no encontrados');
        setLoading(false);
        return;
      }

      setTournament(tRes.data);
      setParticipant(pRes.data);
      setForm((prev) => ({ ...prev, full_name: pRes.data.name || '' }));
      setLoading(false);
    }
    load();
  }, [slug, participantId, navigate]);

  function handleFile(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo supera 5 MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Solo imágenes');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (type === 'dni') {
        setDniFile(file);
        setDniPreview(ev.target.result);
      } else {
        setSelfieFile(file);
        setSelfiePreview(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!dniFile || !selfieFile) {
      setError('Subí el DNI y la selfie');
      return;
    }

    // Validar edad
    const birth = new Date(form.birth_date);
    const age = Math.floor((Date.now() - birth) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      setError('Debés ser mayor de 18 años');
      return;
    }

    setSubmitting(true);

    try {
      // Subir imágenes a ImgBB
      const [dniUrl, selfieUrl] = await Promise.all([
        uploadToImgBB(dniFile),
        uploadToImgBB(selfieFile),
      ]);

      // Guardar en verified_players
      const { error: insertError } = await supabase
        .from('verified_players')
        .upsert({
          email: user.email,
          full_name: form.full_name,
          dni: form.dni,
          birth_date: form.birth_date,
          dni_front_url: dniUrl,
          selfie_url: selfieUrl,
          status: 'verified',
          verified_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      if (insertError) throw insertError;

      // Actualizar participante para que quede como verificado
      await supabase
        .from('participants')
        .update({ payment_status: 'pending' })
        .eq('id', participantId);

      // Redirigir a subir comprobante
      navigate(`/torneo/${slug}/pago/${participantId}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al verificar');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  if (error && !participant) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#e7ecf5' }}>{error}</h2>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '580px', margin: '40px auto' }}>
      <Link to={`/torneo/${slug}`} className="muted" style={{ fontSize: '13px', display: 'inline-block', marginBottom: '16px' }}>
        ← Volver al torneo
      </Link>

      <div className="panel">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00e0ff, #7b5cff)',
            display: 'grid', placeItems: 'center', color: '#04121f',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.5px' }}>
            Verificación de identidad
          </h2>
          <p className="muted" style={{ fontSize: '13px' }}>
            Requerida una sola vez para jugar torneos con aporte
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* PASO 1 */}
          <div style={{
            display: 'flex', gap: '14px', padding: '16px',
            background: '#101625', borderRadius: '12px',
            marginBottom: '14px', border: '1px solid #232c44',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e0ff, #7b5cff)',
              display: 'grid', placeItems: 'center',
              fontWeight: 800, color: '#04121f', flexShrink: 0,
            }}>1</div>
            <div>
              <b style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                Frente del DNI
              </b>
              <span className="muted" style={{ fontSize: '12px', lineHeight: 1.5 }}>
                Foto clara donde se lean todos los datos.
              </span>
            </div>
          </div>

          {/* PASO 2 */}
          <div style={{
            display: 'flex', gap: '14px', padding: '16px',
            background: '#101625', borderRadius: '12px',
            marginBottom: '20px', border: '1px solid #232c44',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e0ff, #7b5cff)',
              display: 'grid', placeItems: 'center',
              fontWeight: 800, color: '#04121f', flexShrink: 0,
            }}>2</div>
            <div>
              <b style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                Selfie con DNI
              </b>
              <span className="muted" style={{ fontSize: '12px', lineHeight: 1.5 }}>
                Tu rostro sosteniendo el DNI junto a tu cara.
              </span>
            </div>
          </div>

          {/* UPLOADS */}
          <div className="form-row">
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                DNI <span className="required">*</span>
              </label>
              <div
                onClick={() => document.getElementById('dni-input').click()}
                style={{
                  border: '2px dashed #232c44', borderRadius: '12px',
                  padding: '20px', textAlign: 'center', cursor: 'pointer',
                  background: '#101625', minHeight: '160px',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center',
                }}
              >
                <input
                  id="dni-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e, 'dni')}
                  style={{ display: 'none' }}
                />
                {dniPreview ? (
                  <img src={dniPreview} alt="DNI" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} />
                ) : (
                  <>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>🪪</div>
                    <b style={{ fontSize: '13px' }}>Subir DNI</b>
                    <span className="muted" style={{ fontSize: '11px', marginTop: '4px' }}>JPG o PNG · max 5 MB</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Selfie <span className="required">*</span>
              </label>
              <div
                onClick={() => document.getElementById('selfie-input').click()}
                style={{
                  border: '2px dashed #232c44', borderRadius: '12px',
                  padding: '20px', textAlign: 'center', cursor: 'pointer',
                  background: '#101625', minHeight: '160px',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center',
                }}
              >
                <input
                  id="selfie-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e, 'selfie')}
                  style={{ display: 'none' }}
                />
                {selfiePreview ? (
                  <img src={selfiePreview} alt="Selfie" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} />
                ) : (
                  <>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>📸</div>
                    <b style={{ fontSize: '13px' }}>Subir selfie</b>
                    <span className="muted" style={{ fontSize: '11px', marginTop: '4px' }}>Rostro + DNI visible</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* DATOS */}
          <div className="form-row" style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label>Nombre completo <span className="required">*</span></label>
              <input
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                required
                placeholder="Como figura en el DNI"
              />
            </div>
            <div className="form-group">
              <label>Número de DNI <span className="required">*</span></label>
              <input
                value={form.dni}
                onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value.replace(/\D/g, '') }))}
                required
                pattern="[0-9]{7,8}"
                placeholder="30123456"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Fecha de nacimiento <span className="required">*</span></label>
            <input
              type="date"
              value={form.birth_date}
              onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))}
              required
              max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            />
            <small>Debés ser mayor de 18 años.</small>
          </div>

          {/* CONSENTIMIENTO */}
          <div style={{
            padding: '14px',
            background: '#101625',
            border: '1px solid #232c44',
            borderRadius: '10px',
            marginTop: '16px',
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm((p) => ({ ...p, consent: e.target.checked }))}
                required
                style={{ width: 'auto', marginTop: '3px', accentColor: '#00e0ff' }}
              />
              <span className="muted" style={{ fontSize: '12px', lineHeight: 1.6 }}>
                Declaro que los datos son verídicos. Autorizo el uso de mi DNI y selfie exclusivamente para verificación de identidad y edad, según la Política de Privacidad y la Ley 25.326.
              </span>
            </label>
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

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !form.consent}
              style={{ flex: 1 }}
            >
              {submitting ? 'Verificando...' : 'Enviar verificación'}
            </button>
            <Link to={`/torneo/${slug}`} className="btn btn-ghost">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
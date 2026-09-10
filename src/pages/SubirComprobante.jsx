import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { uploadToImgBB } from '../lib/imgbb';

export default function SubirComprobante() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const [form, setForm] = useState({
    whatsapp: '',
    name: '',
    tx_id: '',
    notes: '',
    payment_method: '',
  });

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase
        .from('participants')
        .select('*')
        .eq('registration_token', token)
        .maybeSingle();

      if (!p) {
        setLoading(false);
        return;
      }

      setParticipant(p);
      setForm((prev) => ({
        ...prev,
        whatsapp: p.whatsapp || '',
        name: p.name || '',
      }));

      const { data: t } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', p.tournament_id)
        .maybeSingle();
      setTournament(t);

      if (t) {
        const { data: o } = await supabase
          .from('organizers')
          .select('*')
          .eq('id', t.organizer_id)
          .maybeSingle();
        setOrganizer(o);
      }

      setLoading(false);
    }
    load();
  }, [token]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen supera 5 MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!receiptFile) {
      setError('Subí el comprobante de pago');
      return;
    }
    if (!form.payment_method) {
      setError('Elegí el medio de pago');
      return;
    }

    setSubmitting(true);

    try {
      // Subir imagen a ImgBB
      const receiptUrl = await uploadToImgBB(receiptFile);

      // Actualizar participante
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          whatsapp: form.whatsapp,
          name: form.name,
          payment_method: form.payment_method,
          payment_receipt_url: receiptUrl,
          payment_tx_id: form.tx_id,
          payment_notes: form.notes,
          payment_status: 'pending_review',
        })
        .eq('id', participant.id);

      if (updateError) throw updateError;

      navigate(`/inscripcion-exitosa/${token}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al enviar el comprobante');
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

  if (!participant || !tournament) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#e7ecf5' }}>Enlace inválido</h2>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    );
  }

  // Métodos de pago habilitados por el organizador
  const availableMethods = organizer?.payment_methods || [];

  return (
    <div style={{ maxWidth: '560px', margin: '40px auto' }}>
      <Link to={`/torneo/${tournament.slug}`} className="muted" style={{ fontSize: '13px', display: 'inline-block', marginBottom: '16px' }}>
        ← Volver al torneo
      </Link>

      <div className="panel">
        <h2 style={{ marginBottom: '6px' }}>Subir comprobante de pago</h2>
        <p className="muted" style={{ fontSize: '14px', marginBottom: '20px' }}>
          {tournament.name}
        </p>

        {/* INFO DEL PAGO */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,224,255,.08), rgba(123,92,255,.06))',
          border: '1px solid rgba(0,224,255,.25)',
          borderRadius: '14px', padding: '16px', marginBottom: '20px',
        }}>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
            Aporte total
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#00e0ff' }}>
            USD {tournament.price}
          </div>
          <p className="muted" style={{ fontSize: '12px', marginTop: '6px' }}>
            El monto exacto depende del medio de pago que elijas.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* MEDIO DE PAGO */}
          <div className="form-group">
            <label>Medio de pago <span className="required">*</span></label>
            <div style={{ display: 'grid', gap: '10px' }}>
              {availableMethods.length === 0 ? (
                <p className="muted" style={{ fontSize: '13px' }}>
                  El organizador todavía no configuró medios de pago.
                </p>
              ) : (
                availableMethods.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => update('payment_method', pm.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: form.payment_method === pm.id ? 'rgba(0, 224, 255, 0.06)' : '#101625',
                      border: form.payment_method === pm.id ? '2px solid #00e0ff' : '2px solid #232c44',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#e7ecf5',
                      transition: '0.18s',
                    }}
                  >
                    <b style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>{pm.label}</b>
                    <span className="muted" style={{ fontSize: '12px' }}>{pm.detail}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* DATOS DEL PAGO */}
          <div className="form-row">
            <div className="form-group">
              <label>WhatsApp <span className="required">*</span></label>
              <input
                value={form.whatsapp}
                onChange={(e) => update('whatsapp', e.target.value)}
                required
                placeholder="+54 9 11 ..."
              />
            </div>
            <div className="form-group">
              <label>Nombre completo <span className="required">*</span></label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                placeholder="Como figura en el pago"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ID / Nro de operación</label>
              <input
                value={form.tx_id}
                onChange={(e) => update('tx_id', e.target.value)}
                placeholder="Ej: 1234567890"
              />
            </div>
            <div className="form-group">
              <label>Monto pagado</label>
              <input
                value={`USD ${tournament.price}`}
                readOnly
                style={{ background: '#0a0e1a', color: '#8a94a8' }}
              />
            </div>
          </div>

          {/* COMPROBANTE */}
          <div className="form-group">
            <label>Comprobante <span className="required">*</span></label>
            <div
              onClick={() => document.getElementById('receipt-input').click()}
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#101625',
                border: '2px dashed #232c44',
                height: receiptPreview ? 'auto' : '160px',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                textAlign: 'center',
                padding: receiptPreview ? '0' : '20px',
                transition: '0.18s',
              }}
            >
              <input
                id="receipt-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {receiptPreview ? (
                <img
                  src={receiptPreview}
                  alt="Comprobante"
                  style={{ maxWidth: '100%', maxHeight: '300px', display: 'block' }}
                />
              ) : (
                <div style={{ color: '#8a94a8' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                  <b style={{ color: '#e7ecf5', display: 'block', marginBottom: '4px' }}>Subir captura</b>
                  <small>JPG, PNG · máx 5 MB</small>
                </div>
              )}
            </div>
            {receiptPreview && (
              <button
                type="button"
                onClick={() => {
                  setReceiptFile(null);
                  setReceiptPreview(null);
                }}
                className="btn btn-ghost btn-sm"
                style={{ marginTop: '8px' }}
              >
                Cambiar imagen
              </button>
            )}
          </div>

          {/* NOTAS */}
          <div className="form-group">
            <label>Notas para el organizador (opcional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows="2"
              placeholder="Ej: Transferí desde otra cuenta"
            />
          </div>

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
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? 'Enviando comprobante...' : 'Enviar comprobante'}
            </button>
            <Link to={`/torneo/${tournament.slug}`} className="btn btn-ghost">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
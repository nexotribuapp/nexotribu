import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { uploadToImgBB } from '../lib/imgbb';
import { saveToken } from '../lib/playerTokens';

export default function SubirComprobante() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const [form, setForm] = useState({
    name: '',
    discord: '',
    telegram: '',
    tx_id: '',
    notes: '',
    payment_method: '',
  });

  useEffect(() => {
    async function load() {
      const { data, error: rpcError } = await supabase.rpc('get_participant_by_token', {
        p_token: token,
      });

      if (rpcError || data?.error) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setParticipant(data.participant);
      setTournament(data.tournament);

      // Guardar token en localStorage para acceso futuro
      saveToken({
        token,
        tournament_slug: data.tournament?.slug,
        tournament_name: data.tournament?.name,
        email: data.participant?.email,
      });

      setForm((prev) => ({
        ...prev,
        name: data.participant.name || '',
        discord: data.participant.discord || '',
        telegram: data.participant.telegram || '',
      }));

      // Cargar organizador
      if (data.tournament?.organizer_id) {
        const { data: o } = await supabase
          .from('organizers')
          .select('*')
          .eq('id', data.tournament.organizer_id)
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
      const receiptUrl = await uploadToImgBB(receiptFile);

      const { error: updateError } = await supabase
        .from('participants')
        .update({
          name: form.name.trim(),
          discord: form.discord.trim() || null,
          telegram: form.telegram.trim() || null,
          payment_method: form.payment_method,
          payment_receipt_url: receiptUrl,
          payment_tx_id: form.tx_id.trim() || null,
          payment_notes: form.notes.trim() || null,
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

  if (notFound || !participant || !tournament) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#e7ecf5' }}>
          Enlace inválido
        </h2>
        <p style={{ marginBottom: '20px' }}>Este token de acceso no existe o expiró.</p>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    );
  }

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

        {/* APORTE */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,224,255,.08), rgba(123,92,255,.06))',
          border: '1px solid rgba(0,224,255,.25)',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '20px',
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
            {availableMethods.length === 0 ? (
              <p className="muted" style={{ fontSize: '13px' }}>
                El organizador todavía no configuró medios de pago.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {availableMethods.map((pm) => (
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
                    <b style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                      {pm.label}
                    </b>
                    <span className="muted" style={{ fontSize: '12px' }}>
                      {pm.detail}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* NOMBRE */}
          <div className="form-group">
            <label>Nombre completo <span className="required">*</span></label>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              placeholder="Como figura en el pago"
            />
          </div>

          {/* DISCORD + TELEGRAM */}
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

          {/* ID + MONTO */}
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
                style={{ background: '#0a0e1a', color: '#8a94a8', cursor: 'not-allowed' }}
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
                  <b style={{ color: '#e7ecf5', display: 'block', marginBottom: '4px' }}>
                    Subir captura
                  </b>
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

          {/* INFO BOX */}
          <div style={{
            padding: '12px 14px',
            background: '#101625',
            border: '1px solid #232c44',
            borderRadius: '10px',
            fontSize: '12px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            marginBottom: '16px',
          }}>
            <span style={{ color: '#00e0ff' }}>🔒</span>
            <span className="muted">
              Tu comprobante será verificado por el organizador. Una vez aprobado, tu inscripción queda confirmada.
            </span>
          </div>

          {/* ERROR */}
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

          {/* BOTONES */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? 'Enviando comprobante...' : 'Enviar comprobante'}
            </button>
            <Link to={`/torneo/${tournament.slug}`} className="btn btn-ghost">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
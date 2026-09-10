import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function InscripcionExitosa() {
  const { token } = useParams();
  const [participant, setParticipant] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase
        .from('participants')
        .select('*')
        .eq('registration_token', token)
        .maybeSingle();

      if (p) {
        setParticipant(p);
        const { data: t } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', p.tournament_id)
          .maybeSingle();
        setTournament(t);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  if (!participant) {
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

  const isPending = participant.payment_status === 'pending';

  return (
    <div style={{ maxWidth: '560px', margin: '40px auto' }}>
      <div className="panel" style={{ textAlign: 'center', padding: '40px 32px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'rgba(34, 214, 127, 0.12)',
          border: '1px solid rgba(34, 214, 127, 0.35)',
          display: 'grid', placeItems: 'center',
          margin: '0 auto 20px', color: '#22d67f', fontSize: '32px',
        }}>
          ✓
        </div>

        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>
          {isPending ? 'Inscripción registrada' : `¡Estás dentro, ${participant.name?.split(' ')[0]}!`}
        </h2>
        <p className="muted" style={{ fontSize: '14px', marginBottom: '24px' }}>
          {isPending
            ? 'El organizador va a validar tu pago y confirmarte el cupo.'
            : `Tu inscripción a ${tournament?.name} fue confirmada.`}
        </p>

        <div style={{
          textAlign: 'left', background: '#101625',
          borderRadius: '10px', padding: '14px',
          marginBottom: '20px', fontSize: '13px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #232c44' }}>
            <span className="muted">Email</span>
            <b>{participant.email}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #232c44' }}>
            <span className="muted">Torneo</span>
            <b>{tournament?.name}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span className="muted">Estado</span>
            <b style={{ color: isPending ? '#ffb02e' : '#22d67f' }}>
              {isPending ? 'Pago pendiente' : 'Confirmado'}
            </b>
          </div>
        </div>

        <p className="muted" style={{ fontSize: '13px', marginBottom: '10px' }}>
          🔑 Guardá este enlace de acceso. Es tu credencial para ver el torneo.
        </p>
        <div style={{
          background: '#101625',
          border: '1px dashed #232c44',
          borderRadius: '10px', padding: '12px',
          fontFamily: 'monospace', fontSize: '11px',
          wordBreak: 'break-all', color: '#00e0ff',
          marginBottom: '20px', textAlign: 'left',
        }}>
          {window.location.href}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={copyLink} className="btn btn-primary">
            {copied ? '✓ Copiado' : '🔗 Copiar enlace'}
          </button>
          <Link to={`/torneo/${tournament?.slug}`} className="btn btn-ghost">
            Ir al torneo
          </Link>
        </div>
      </div>
    </div>
  );
}
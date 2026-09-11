import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function InscripcionExitosa() {
  const { participantId } = useParams();
  const [participant, setParticipant] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc('get_my_participant_data', {
        p_participant_id: participantId,
      });

      if (error || data?.error) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setParticipant(data.participant);
      setTournament(data.tournament);
      setLoading(false);
    }
    load();
  }, [participantId]);

  if (loading) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  if (notFound || !participant) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#e7ecf5' }}>
          Inscripción no encontrada
        </h2>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    );
  }

  const isPending =
    participant.payment_status === 'pending' ||
    participant.payment_status === 'pending_review';

  return (
    <div style={{ maxWidth: '560px', margin: '40px auto' }}>
      <div className="panel" style={{ textAlign: 'center', padding: '40px 32px' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(34, 214, 127, 0.12)',
          border: '1px solid rgba(34, 214, 127, 0.35)',
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto 20px',
          color: '#22d67f',
          fontSize: '32px',
        }}>
          ✓
        </div>

        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>
          {isPending
            ? 'Inscripción registrada'
            : `¡Estás dentro, ${participant.name?.split(' ')[0]}!`}
        </h2>
        <p className="muted" style={{ fontSize: '14px', marginBottom: '24px' }}>
          {isPending
            ? 'El organizador va a validar tu pago y confirmarte el cupo.'
            : `Tu inscripción a ${tournament?.name} fue confirmada.`}
        </p>

        <div style={{
          textAlign: 'left',
          background: '#101625',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '20px',
          fontSize: '13px',
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

        <div style={{
          padding: '12px 14px',
          background: 'rgba(34, 214, 127, 0.06)',
          border: '1px solid rgba(34, 214, 127, 0.25)',
          borderRadius: '10px',
          fontSize: '12px',
          marginBottom: '20px',
          textAlign: 'left',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
        }}>
          <span style={{ color: '#22d67f' }}>✓</span>
          <span className="muted">
            <b style={{ color: '#e7ecf5' }}>Tu cuenta está vinculada.</b>{' '}
            Cuando quieras entrar de nuevo, solo iniciá sesión con Google y vas a ver todos tus torneos.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={`/acceso/${participant.id}`} className="btn btn-primary">
            Ir a mi panel →
          </Link>
          <Link to={`/torneo/${tournament?.slug}`} className="btn btn-ghost">
            Ir al torneo
          </Link>
        </div>
      </div>
    </div>
  );
}
export default function Esperando({ organizer }) {
  const isRejected = organizer?.status === 'rejected';

  return (
    <div style={{ maxWidth: '560px', margin: '60px auto' }}>
      <div className="panel" style={{ textAlign: 'center', padding: '40px 32px' }}>
        {isRejected ? (
          <>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(255, 61, 113, 0.12)',
              border: '1px solid rgba(255, 61, 113, 0.35)',
              display: 'grid', placeItems: 'center',
              margin: '0 auto 20px', color: '#ff3d71', fontSize: '32px',
            }}>
              ✕
            </div>
            <h2 style={{ marginBottom: '12px' }}>Solicitud no aprobada</h2>
            <p className="muted" style={{ fontSize: '14px', marginBottom: '20px' }}>
              Tu solicitud fue revisada pero no pudimos aprobarla en este momento.
            </p>
            {organizer?.rejection_reason && (
              <div style={{
                background: 'rgba(255, 61, 113, 0.06)',
                border: '1px solid rgba(255, 61, 113, 0.25)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left',
                fontSize: '13px',
              }}>
                <b style={{ color: '#e7ecf5' }}>Motivo:</b>
                <p className="muted" style={{ marginTop: '6px' }}>{organizer.rejection_reason}</p>
              </div>
            )}
            <p className="muted" style={{ fontSize: '13px', marginBottom: '20px' }}>
              Si creés que hubo un error, escribinos y lo revisamos.
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(255, 176, 46, 0.12)',
              border: '1px solid rgba(255, 176, 46, 0.35)',
              display: 'grid', placeItems: 'center',
              margin: '0 auto 20px', color: '#ffb02e', fontSize: '32px',
            }}>
              ⏱
            </div>
            <h2 style={{ marginBottom: '12px' }}>¡Recibimos tu solicitud!</h2>
            <p className="muted" style={{ fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
              En breve el equipo de NexoTribu se va a comunicar con vos por
              WhatsApp o Instagram para explicarte cómo funciona todo y habilitar
              tu cuenta.
            </p>
            <p className="muted" style={{ fontSize: '13px' }}>
              Mientras tanto podés seguir explorando los torneos públicos.
            </p>
          </>
        )}

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #232c44' }}>
          <a href="/" className="btn btn-ghost">Ver torneos</a>
        </div>
      </div>
    </div>
  );
}
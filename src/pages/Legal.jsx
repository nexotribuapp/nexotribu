import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const CONTENT = {
  reglamento: {
    title: 'Reglamento general',
    body: `
      <div class="legal-highlight">
        <h3 style="margin-top:0;color:#00e0ff">Naturaleza del servicio</h3>
        <p style="margin-bottom:0"><strong>NexoTribu es una plataforma de organización de competiciones deportivas electrónicas basadas exclusivamente en la habilidad.</strong> No constituimos, promovemos ni facilitamos juegos de azar, apuestas, loterías, rifas ni cualquier actividad sujeta a resultados aleatorios.</p>
      </div>
      <h2>1. Qué hacemos y qué no</h2>
      <p>NexoTribu provee herramientas para que organizadores independientes creen y gestionen torneos de eFootball y EA FC. <strong>No organizamos, arbitramos ni participamos</strong> de los torneos.</p>
      <h2>2. Competiciones de habilidad</h2>
      <p>Todas las competiciones son de habilidad. El resultado depende exclusivamente del desempeño de los jugadores. Los organizadores no pueden usar la plataforma para apuestas, rifas ni actividades equivalentes.</p>
      <p>El término "aporte de participación" refiere al monto que cubre costos de organización y pozo de premios. <strong>No constituye una apuesta.</strong></p>
      <h2>3. Edad mínima</h2>
      <p>Para participar en torneos con aporte, el jugador debe ser <strong>mayor de 18 años</strong>. La edad se verifica con DNI y selfie una sola vez.</p>
      <h2>4. Comisión de la plataforma</h2>
      <p>Por cada torneo con aporte, la plataforma retiene el <strong>5% del pozo total</strong> como canon del servicio.</p>
      <h2>5. Responsabilidad del organizador</h2>
      <ul>
        <li>Cumplir con los premios prometidos con captura.</li>
        <li>Verificar comprobantes de aporte.</li>
        <li>Resolver disputas deportivas.</li>
        <li>Mantener historial con capturas verificables.</li>
        <li>Cumplir obligaciones fiscales.</li>
        <li>No promocionar actividades de azar.</li>
      </ul>
      <h2>6. Ciclo de vida de cuentas</h2>
      <ul>
        <li><strong>Torneos relámpago:</strong> los datos de contacto se eliminan 30 días después de finalizar. El historial deportivo permanece público.</li>
        <li><strong>Ligas de temporada:</strong> la cuenta persiste hasta fin de temporada.</li>
        <li><strong>Verificación de identidad:</strong> los datos de DNI y selfie se conservan salvo solicitud de eliminación (derechos ARCO).</li>
      </ul>
      <h2>7. Sistema de NexoCoins</h2>
      <p>Los <strong>NexoCoins (NC)</strong> son una unidad de exhibición sin valor monetario real. <strong>1 NC = 1 peso argentino</strong>. Los montos en USD son informativos según la cotización MEP vigente.</p>
      <h2>8. Sanciones</h2>
      <table>
        <thead><tr><th>Falta</th><th>Sanción</th></tr></thead>
        <tbody>
          <tr><td>Manipulación de resultados</td><td>Expulsión + bloqueo</td></tr>
          <tr><td>Suplantación de identidad</td><td>Expulsión + denuncia legal</td></tr>
          <tr><td>No entrega de premios</td><td>Suspensión + reembolso</td></tr>
          <tr><td>Conducta antideportiva leve</td><td>Advertencia</td></tr>
        </tbody>
      </table>
      <h2>9. Modificaciones</h2>
      <p>NexoTribu puede actualizar este reglamento con <strong>aviso previo de 15 días</strong>. El uso continuado implica aceptación.</p>
    `
  },
  terminos: {
    title: 'Términos y condiciones',
    body: `
      <div class="legal-highlight">
        <p style="margin-bottom:0"><strong>NexoTribu provee herramientas tecnológicas para competiciones de habilidad. No somos juego de azar ni apuestas.</strong></p>
      </div>
      <h2>1. Aceptación</h2>
      <p>El uso de NexoTribu implica la aceptación plena de estos términos.</p>
      <h2>2. Servicio</h2>
      <p>Ofrecemos un servicio tecnológico para gestión de competiciones deportivas electrónicas. No garantizamos disponibilidad ininterrumpida.</p>
      <h2>3. Cuentas de organizador</h2>
      <p>Los organizadores acceden mediante autenticación segura con Google. Cada organizador es responsable de sus credenciales.</p>
      <h2>4. Cuentas de jugador</h2>
      <p>Los jugadores se identifican con su cuenta de Google. Reciben un enlace único por torneo.</p>
      <h2>5. Verificación de identidad</h2>
      <p>Los torneos con aporte requieren verificación de identidad (DNI + selfie) por única vez. Los datos se utilizan exclusivamente para verificar edad (18+) e identidad.</p>
      <h2>6. Aportes</h2>
      <p>Los aportes se realizan directamente entre jugadores y organizadores. NexoTribu no procesa ni retiene dinero.</p>
      <h2>7. Propiedad intelectual</h2>
      <p>Las marcas eFootball y EA FC son propiedad de Konami y Electronic Arts respectivamente. NexoTribu no está afiliada ni patrocinada por dichas empresas.</p>
      <h2>8. Modificaciones</h2>
      <p>La plataforma puede modificar estos términos con aviso previo de 15 días.</p>
      <h2>9. Ley aplicable</h2>
      <p>Se rigen por las leyes de la República Argentina.</p>
    `
  },
  privacidad: {
    title: 'Política de privacidad',
    body: `
      <div class="legal-highlight">
        <p style="margin-bottom:0">Elaborada conforme a la <strong>Ley 25.326 de Protección de Datos Personales</strong> de la República Argentina.</p>
      </div>
      <h2>1. Datos que recopilamos</h2>
      <ul>
        <li><strong>Organizadores:</strong> nombre, email y método de autenticación.</li>
        <li><strong>Jugadores:</strong> email y opcionalmente nombre, ID de juego, WhatsApp, Discord y comprobantes.</li>
        <li><strong>Verificación:</strong> DNI (frente), selfie con DNI, nombre completo, número de DNI y fecha de nacimiento.</li>
      </ul>
      <h2>2. Finalidad</h2>
      <ul>
        <li>Gestionar inscripciones.</li>
        <li>Permitir al organizador contactar al jugador.</li>
        <li>Validar aportes y comprobantes.</li>
        <li>Verificar edad (18+) e identidad.</li>
        <li>Mantener ranking público.</li>
        <li>Prevenir fraudes.</li>
      </ul>
      <h2>3. Conservación</h2>
      <ul>
        <li>Datos de contacto en torneos relámpago: eliminados 30 días después de finalizar.</li>
        <li>Historial deportivo anonimizado: permanece como registro público auditable.</li>
        <li>Datos de verificación (DNI y selfie): conservados salvo solicitud de eliminación.</li>
        <li>Las imágenes de DNI y selfie se guardan cifradas y nunca se muestran públicamente.</li>
      </ul>
      <h2>4. Compartir datos</h2>
      <p>Los datos son visibles para el organizador del torneo en el que se inscribe. No vendemos datos a terceros.</p>
      <h2>5. Derechos ARCO</h2>
      <p>El titular puede ejercer derechos de acceso, rectificación, actualización y supresión escribiendo a contacto@nexotribu.app. Responderemos en un plazo máximo de 30 días.</p>
      <h2>6. Seguridad</h2>
      <p>Utilizamos cifrado en tránsito y en reposo, autenticación robusta y políticas de acceso a nivel de fila (RLS).</p>
      <h2>7. Autoridad de control</h2>
      <p>La autoridad de control es la Agencia de Acceso a la Información Pública (AAIP) de la República Argentina.</p>
    `
  },
  cookies: {
    title: 'Política de cookies',
    body: `
      <h2>1. Qué son</h2>
      <p>Archivos que el navegador almacena para recordar información entre visitas.</p>
      <h2>2. Cookies que usamos</h2>
      <ul>
        <li><strong>Esenciales:</strong> mantienen la sesión del organizador.</li>
        <li><strong>Preferencias:</strong> recuerdan el último torneo visitado y la cotización del dólar.</li>
      </ul>
      <p>No usamos cookies publicitarias ni de seguimiento de terceros.</p>
      <h2>3. Cómo desactivarlas</h2>
      <p>Podés bloquear o eliminar cookies desde la configuración de tu navegador.</p>
    `
  },
  reembolsos: {
    title: 'Política de reembolsos',
    body: `
      <div class="legal-highlight">
        <p style="margin-bottom:0">Los aportes de participación <strong>no constituyen apuestas</strong>. Cubren costos de organización y pozo de premios.</p>
      </div>
      <h2>1. Regla general</h2>
      <p>Los aportes no son reembolsables una vez que el torneo comienza, salvo decisión del organizador.</p>
      <h2>2. Cancelación del torneo</h2>
      <p>Si el organizador cancela antes de comenzar, deberá reembolsar el 100% en un plazo máximo de 15 días hábiles.</p>
      <h2>3. Cancelación por el jugador</h2>
      <p>El jugador puede solicitar la cancelación antes del cierre de inscripciones. El reembolso lo decide el organizador según sus políticas publicadas.</p>
      <h2>4. Disputas</h2>
      <p>NexoTribu no participa porque no procesa los pagos. En caso de fraude comprobado, puede suspender la cuenta del organizador.</p>
    `
  },
  arco: {
    title: 'Derechos ARCO',
    body: `
      <div class="legal-highlight">
        <p style="margin-bottom:0">Conforme a la <strong>Ley 25.326 de Protección de Datos Personales</strong>, todo titular de datos puede ejercer sus derechos ARCO.</p>
      </div>
      <h2>Qué son</h2>
      <ul>
        <li><strong>Acceso:</strong> conocer qué datos tenemos sobre vos.</li>
        <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
        <li><strong>Cancelación:</strong> solicitar la eliminación cuando ya no sean necesarios.</li>
        <li><strong>Oposición:</strong> oponerte al tratamiento para finalidades específicas.</li>
      </ul>
      <h2>Cómo ejercerlos</h2>
      <p>Escribí a <strong>contacto@nexotribu.app</strong> con:</p>
      <ul>
        <li>Asunto: "Ejercicio de derechos ARCO".</li>
        <li>Tu nombre completo y DNI.</li>
        <li>Detalle del derecho que querés ejercer.</li>
        <li>Documentación que acredite tu identidad.</li>
      </ul>
      <h2>Plazo de respuesta</h2>
      <p>Responderemos en un plazo máximo de 30 días hábiles.</p>
      <h2>Autoridad de control</h2>
      <p>Si considerás que no hemos atendido correctamente tu solicitud, podés presentar un reclamo ante la Agencia de Acceso a la Información Pública (AAIP).</p>
    `
  },
  nosotros: {
    title: 'Sobre nosotros',
    body: `
      <h2>Qué es NexoTribu</h2>
      <p>Plataforma para organizar competiciones de habilidad en eFootball y EA FC con transparencia total. Cada partido y premio registrado con captura.</p>
      <h2>Qué no hacemos</h2>
      <p><strong>No organizamos torneos. No arbitramos. No somos juego de azar.</strong></p>
      <h2>Contacto</h2>
      <p>Email: contacto@nexotribu.app</p>
    `
  },
  contacto: {
    title: 'Contacto',
    body: `
      <p>Email general: <strong>contacto@nexotribu.app</strong></p>
      <p>Instagram: @nexotribu</p>
      <p>Para ejercer derechos ARCO: ver <a href="#/arco" style="color:#00e0ff">Derechos ARCO</a>.</p>
    `
  },
  faq: {
    title: 'Preguntas frecuentes',
    body: `
      <h3>¿Necesito crear cuenta?</h3>
      <p>Sí, con tu cuenta de Google en 1 click.</p>
      <h3>¿Qué son los NexoCoins?</h3>
      <p>Unidad de exhibición. 1 NC = 1 ARS. Los montos en USD se calculan según el dólar MEP del día.</p>
      <h3>¿Es juego de azar?</h3>
      <p><strong>No.</strong> Son competiciones de habilidad.</p>
      <h3>¿Por qué me piden DNI y selfie?</h3>
      <p>Solo en torneos con aporte. Es para verificar identidad y edad (18+). Se pide una sola vez por email.</p>
      <h3>¿Qué pasa con mis datos de DNI?</h3>
      <p>Se guardan cifrados, nunca se muestran públicamente, y podés pedir su eliminación por derechos ARCO.</p>
    `
  }
};

export default function Legal() {
  const { page } = useParams();
  const content = CONTENT[page];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  if (!content) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#e7ecf5' }}>
          Página no encontrada
        </h2>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="legal-content" style={{ padding: '40px 0' }}>
      <Link to="/" className="muted" style={{ fontSize: '13px', display: 'inline-block', marginBottom: '20px' }}>
        ← Volver al inicio
      </Link>

      <h1>{content.title}</h1>
      <div className="legal-updated">
        Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      <div dangerouslySetInnerHTML={{ __html: content.body }} />
    </div>
  );
}
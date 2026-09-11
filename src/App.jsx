import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { BRAND } from './lib/config';
import Home from './pages/Home';
import Login from './pages/Login';
import Solicitud from './pages/Solicitud';
import Esperando from './pages/Esperando';
import Panel from './pages/Panel';
import CrearTorneo from './pages/CrearTorneo';
import Torneo from './pages/Torneo';
import GestionTorneo from './pages/GestionTorneo';
import Inscripcion from './pages/Inscripcion';
import InscripcionExitosa from './pages/InscripcionExitosa';
import SubirComprobante from './pages/SubirComprobante';
import ValidarPagos from './pages/ValidarPagos';
import PlayerPanel from './pages/PlayerPanel';
import Ranking from './pages/Ranking';
import PerfilJugador from './pages/PerfilJugador';
import Verificacion from './pages/Verificacion';
import Legal from './pages/Legal';
import Admin from './pages/Admin';
import './App.css';

function LoadingScreen() {
  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setOrganizer(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    async function loadOrganizer() {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizers')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) setOrganizer(data);
      setLoading(false);
    }

    loadOrganizer();
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  function getRedirectPath() {
    if (!organizer) return '/solicitud';
    if (!organizer.profile_completed) return '/solicitud';
    if (organizer.status !== 'approved') return '/esperando';
    return '/panel';
  }

  return (
    <BrowserRouter>
      <div className="app">
        <header className="nav">
          <div className="container nav-inner">
            <Link to="/" className="logo">
              <span className="logo-text">{BRAND.name}</span>
            </Link>
            <nav className="nav-links">
              <Link to="/">Torneos</Link>
              <Link to="/ranking">Ranking</Link>
              <a href={BRAND.discord_url} target="_blank" rel="noreferrer">Discord</a>
              {!loading && !user && <Link to="/login">Acceso organizadores</Link>}
              {!loading && user && organizer && (
                <>
                  {organizer.status === 'approved' && <Link to="/panel">Mi panel</Link>}
                  {organizer.status === 'approved' && <Link to="/panel/validar">Validar pagos</Link>}
                  <span style={{ color: '#8a94a8', fontSize: '13px' }}>{user.email}</span>
                  <button onClick={handleLogout} style={{ fontSize: '14px', color: '#8a94a8', padding: '8px 14px', borderRadius: '9px' }}>
                    Cerrar sesión
                  </button>
                </>
              )}
              {!loading && user && !organizer && (
                <>
                  <span style={{ color: '#8a94a8', fontSize: '13px' }}>{user.email}</span>
                  <button onClick={handleLogout} style={{ fontSize: '14px', color: '#8a94a8', padding: '8px 14px', borderRadius: '9px' }}>
                    Cerrar sesión
                  </button>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* BANNER DISCORD */}
        <div className="container" style={{ paddingTop: '16px' }}>
          <div style={{
            padding: '12px 18px',
            background: 'linear-gradient(135deg, rgba(88,101,242,.12), rgba(88,101,242,.04))',
            border: '1px solid rgba(88,101,242,.3)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            fontSize: '13px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>💬</span>
              <span>
                <b style={{ color: '#e7ecf5' }}>Sumate a nuestro Discord oficial</b>
                <span className="muted" style={{ marginLeft: '8px' }}>Soporte, torneos y comunidad</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a href={BRAND.discord_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ background: '#5865F2', color: '#fff' }}>
                Unirse a Discord
              </a>
              <a href={BRAND.telegram_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                Telegram
              </a>
            </div>
          </div>
        </div>

        <main className="container">
          {loading ? (
            <LoadingScreen />
          ) : (
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/jugador/:id" element={<PerfilJugador />} />
              <Route path="/torneo/:slug" element={<Torneo />} />
              <Route path="/torneo/:slug/inscribirse" element={<Inscripcion />} />
              <Route path="/torneo/:slug/success/:participantId" element={<InscripcionExitosa />} />
              <Route path="/torneo/:slug/pago/:participantId" element={<SubirComprobante />} />
              <Route path="/torneo/:slug/verificar/:participantId" element={<Verificacion />} />
              <Route path="/acceso/:token" element={<PlayerPanel />} />
              <Route path="/legal/:page" element={<Legal />} />
              <Route path="/login" element={
                user ? <Navigate to={getRedirectPath()} replace /> : <Login />
              } />
              <Route path="/solicitud" element={
                !user ? <Navigate to="/login" replace /> :
                organizer?.profile_completed ? <Navigate to={getRedirectPath()} replace /> :
                <Solicitud user={user} organizer={organizer} onComplete={setOrganizer} />
              } />
              <Route path="/esperando" element={
                !user ? <Navigate to="/login" replace /> :
                organizer?.status === 'approved' ? <Navigate to="/panel" replace /> :
                <Esperando organizer={organizer} />
              } />
              <Route path="/panel" element={
                !user ? <Navigate to="/login" replace /> :
                !organizer || !organizer.profile_completed ? <Navigate to="/solicitud" replace /> :
                organizer.status !== 'approved' ? <Navigate to="/esperando" replace /> :
                <Panel user={user} organizer={organizer} />
              } />
              <Route path="/panel/crear" element={
                !user ? <Navigate to="/login" replace /> :
                !organizer || !organizer.profile_completed ? <Navigate to="/solicitud" replace /> :
                organizer.status !== 'approved' ? <Navigate to="/esperando" replace /> :
                <CrearTorneo user={user} organizer={organizer} />
              } />
              <Route path="/panel/torneo/:id" element={
                !user ? <Navigate to="/login" replace /> :
                !organizer || !organizer.profile_completed ? <Navigate to="/solicitud" replace /> :
                organizer.status !== 'approved' ? <Navigate to="/esperando" replace /> :
                <GestionTorneo user={user} />
              } />
              <Route path="/panel/validar" element={
                !user ? <Navigate to="/login" replace /> :
                !organizer || !organizer.profile_completed ? <Navigate to="/solicitud" replace /> :
                organizer.status !== 'approved' ? <Navigate to="/esperando" replace /> :
                <ValidarPagos user={user} />
              } />
              <Route path="/admin" element={
                !user ? <Navigate to="/login" replace /> : <Admin user={user} />
              } />
            </Routes>
          )}
        </main>

        {/* FOOTER COMPLETO */}
        <footer className="footer">
          <div className="container">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '32px',
              paddingBottom: '30px',
              textAlign: 'left',
              maxWidth: '1000px',
              margin: '0 auto',
            }}>
              {/* Marca */}
              <div>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #00e0ff, #7b5cff)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px',
                  marginBottom: '10px',
                }}>
                  {BRAND.name}
                </div>
                <p className="muted" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                  Plataforma de organización de competiciones deportivas electrónicas basadas en habilidad.
                  Torneos de eFootball y EA FC con historial verificable y premios al mejor desempeño.
                </p>
              </div>

              {/* Plataforma */}
              <div>
                <h4 style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: '#8a94a8',
                  marginBottom: '12px',
                }}>Plataforma</h4>
                <Link to="/" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Torneos abiertos</Link>
                <Link to="/ranking" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Ranking general</Link>
                <Link to="/login" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Acceso organizadores</Link>
              </div>

              {/* Legal */}
              <div>
                <h4 style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: '#8a94a8',
                  marginBottom: '12px',
                }}>Legal</h4>
                <Link to="/legal/reglamento" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Reglamento general</Link>
                <Link to="/legal/terminos" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Términos y condiciones</Link>
                <Link to="/legal/privacidad" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Política de privacidad</Link>
                <Link to="/legal/cookies" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Política de cookies</Link>
                <Link to="/legal/reembolsos" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Política de reembolsos</Link>
                <Link to="/legal/arco" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Derechos ARCO</Link>
              </div>

              {/* Comunidad */}
              <div>
                <h4 style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: '#8a94a8',
                  marginBottom: '12px',
                }}>Comunidad</h4>
                <Link to="/legal/nosotros" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Sobre nosotros</Link>
                <Link to="/legal/contacto" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Contacto</Link>
                <Link to="/legal/faq" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Preguntas frecuentes</Link>
                <a href={BRAND.discord_url} target="_blank" rel="noreferrer" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Discord</a>
                <a href={BRAND.telegram_url} target="_blank" rel="noreferrer" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Telegram</a>
                <a href="https://instagram.com/nexotribu" target="_blank" rel="noreferrer" className="muted" style={{ display: 'block', fontSize: '13px', padding: '5px 0' }}>Instagram</a>
              </div>
            </div>

            {/* AVISO LEGAL */}
            <div style={{
              padding: '14px 16px',
              background: 'rgba(0, 224, 255, 0.03)',
              border: '1px solid rgba(0, 224, 255, 0.15)',
              borderRadius: '10px',
              fontSize: '11px',
              color: '#8a94a8',
              lineHeight: 1.6,
              marginBottom: '20px',
            }}>
              <b style={{ color: '#e7ecf5' }}>Aviso legal:</b> NexoTribu es una plataforma de organización de competiciones de habilidad. No constituye, promueve ni facilita juegos de azar, apuestas, loterías, rifas ni cualquier actividad sujeta a resultados aleatorios. Los premios se otorgan al mejor rendimiento deportivo verificado con capturas.
            </div>

            {/* FOOTER BOTTOM */}
            <div style={{
              borderTop: '1px solid #232c44',
              paddingTop: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '12px',
              color: '#8a94a8',
            }}>
              <div>&copy; {new Date().getFullYear()} {BRAND.name} &middot; Todos los derechos reservados</div>
              <div>Competiciones de habilidad &middot; No es juego de azar</div>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
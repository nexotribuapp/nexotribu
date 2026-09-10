import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Home from './pages/Home';
import Login from './pages/Login';
import Solicitud from './pages/Solicitud';
import Esperando from './pages/Esperando';
import Panel from './pages/Panel';
import Admin from './pages/Admin';
import './App.css';

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'grid',
      placeItems: 'center',
    }}>
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
              <span className="dot">N</span>
              NexoTribu
            </Link>
            <nav className="nav-links">
              <Link to="/">Torneos</Link>
              {!loading && !user && <Link to="/login">Acceso organizadores</Link>}
              {!loading && user && organizer && (
                <>
                  {organizer.status === 'approved' && <Link to="/panel">Mi panel</Link>}
                  <span style={{ color: '#8a94a8', fontSize: '13px' }}>{user.email}</span>
                  <button onClick={handleLogout} style={{ fontSize: '14px', color: '#8a94a8', padding: '8px 14px', borderRadius: '9px' }}>
                    Cerrar sesión
                  </button>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="container">
          {loading ? (
            <LoadingScreen />
          ) : (
            <Routes>
              <Route path="/" element={<Home />} />
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
              <Route path="/admin" element={
                !user ? <Navigate to="/login" replace /> : <Admin user={user} />
              } />
            </Routes>
          )}
        </main>

        <footer className="footer">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} NexoTribu &middot; Competiciones de habilidad &middot; No es juego de azar</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Home from './pages/Home';
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
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
              {!loading && user && (
                <>
                  <span style={{ color: '#8a94a8', fontSize: '13px' }}>
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    style={{
                      fontSize: '14px',
                      color: '#8a94a8',
                      padding: '8px 14px',
                      borderRadius: '9px',
                      cursor: 'pointer',
                    }}
                  >
                    Cerrar sesión
                  </button>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
          </Routes>
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
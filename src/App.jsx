import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';

function App() {
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
              <Link to="/login">Acceso organizadores</Link>
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
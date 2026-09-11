import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Ranking() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });

      const sorted = (data || []).sort((a, b) => {
        const eloA = a.stats?.elo || 1000;
        const eloB = b.stats?.elo || 1000;
        return eloB - eloA;
      });

      setPlayers(sorted);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = search.trim()
    ? players.filter((p) =>
        (p.alias || '').toLowerCase().includes(search.toLowerCase())
      )
    : players;

  if (loading) {
    return (
      <div className="empty" style={{ marginTop: '80px' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 800,
          letterSpacing: '-1px',
          marginBottom: '8px',
        }}>
          🏆 Ranking general
        </h1>
        <p className="muted" style={{ fontSize: '14px' }}>
          Ranking basado en ELO y NexoCoins ganados. Los jugadores aparecen al finalizar torneos.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '14px',
        marginBottom: '32px',
      }}>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#00e0ff' }}>{players.length}</div>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Jugadores</div>
        </div>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffd166' }}>
            {players.reduce((acc, p) => acc + (p.stats?.cups_won || 0), 0)}
          </div>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Copas totales</div>
        </div>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#22d67f' }}>
            {players.reduce((acc, p) => acc + (p.stats?.tournaments_played || 0), 0)}
          </div>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Torneos jugados</div>
        </div>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#00e0ff' }}>
            {players.reduce((acc, p) => acc + (p.stats?.nexo_won || 0), 0).toLocaleString('es-AR')}
          </div>
          <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>NexoCoins</div>
        </div>
      </div>

      {players.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar jugador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#101625',
              border: '1px solid #232c44',
              color: '#e7ecf5',
              fontSize: '14px',
            }}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
          <p style={{ marginBottom: '8px' }}>
            {players.length === 0
              ? 'El ranking está vacío todavía.'
              : 'No se encontraron jugadores.'}
          </p>
          {players.length === 0 && (
            <p className="muted" style={{ fontSize: '13px' }}>
              Los jugadores aparecen acá cuando finaliza el primer torneo.
            </p>
          )}
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}>
              <thead>
                <tr style={{
                  textAlign: 'left',
                  color: '#8a94a8',
                  borderBottom: '1px solid #232c44',
                }}>
                  <th style={{ padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', width: '50px' }}>#</th>
                  <th style={{ padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jugador</th>
                  <th style={{ padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>ELO</th>
                  <th style={{ padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Torneos</th>
                  <th style={{ padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>PJ</th>
                  <th style={{ padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>PG</th>
                  <th style={{ padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>PE</th>
                  <th style={{ padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>PP</th>
                  <th style={{ padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Copas</th>
                  <th style={{ padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>NexoCoins</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const s = p.stats || {};
                  const isTop1 = i === 0;
                  const isTop2 = i === 1;
                  const isTop3 = i === 2;
                  const medalColor = isTop1 ? 'linear-gradient(135deg, #ffd166, #ffb02e)'
                    : isTop2 ? 'linear-gradient(135deg, #e0e0e0, #a8a8a8)'
                    : isTop3 ? 'linear-gradient(135deg, #cd7f32, #8b4513)'
                    : '#1c2438';
                  const medalText = isTop1 || isTop2 || isTop3 ? '#04121f' : '#8a94a8';

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #232c44',
                        background: isTop1 ? 'linear-gradient(90deg, rgba(255,209,102,.06), transparent)'
                          : isTop2 ? 'linear-gradient(90deg, rgba(192,192,192,.04), transparent)'
                          : isTop3 ? 'linear-gradient(90deg, rgba(205,127,50,.04), transparent)'
                          : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: medalColor,
                          color: medalText,
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '12px',
                          fontWeight: 800,
                        }}>
                          {i + 1}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Link
                          to={`/jugador/${p.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            textDecoration: 'none',
                            color: 'inherit',
                          }}
                        >
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00e0ff, #7b5cff)',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '14px',
                            fontWeight: 800,
                            color: '#04121f',
                          }}>
                            {(p.alias || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <b style={{ fontSize: '14px', display: 'block' }}>
                              {p.alias}
                            </b>
                            <span className="muted" style={{ fontSize: '11px' }}>
                              {p.game_handle || '—'}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <b style={{ color: '#00e0ff', fontSize: '14px' }}>
                          {Math.round(s.elo || 1000)}
                        </b>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#8a94a8' }}>
                        {s.tournaments_played || 0}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#8a94a8' }}>
                        {s.matches_played || 0}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#22d67f', fontWeight: 600 }}>
                        {s.matches_won || 0}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#ffb02e' }}>
                        {s.matches_drawn || 0}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#ff3d71' }}>
                        {s.matches_lost || 0}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <b style={{ color: '#ffd166' }}>{s.cups_won || 0}</b>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <b style={{ color: '#00e0ff' }}>
                          {(s.nexo_won || 0).toLocaleString('es-AR')}
                        </b>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { UPLOADS_URL } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import Bandeirinhas from '../components/Bandeirinhas';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_STYLE = {
  locked: { label: '🔒 Em breve',     bg: 'rgba(58,31,20,0.08)',       color: '#3A1F14' },
  active: { label: '🌽 Disponível',   bg: 'rgba(0,124,145,0.12)',       color: '#007C91' },
  ended:  { label: '⭐ Encerrado',    bg: 'rgba(111,45,168,0.12)',      color: '#6F2DA8' },
};

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/albums').then(r => setData(r.data)).catch(() => toast.error('Erro ao carregar álbuns')).finally(() => setLoading(false));
    refreshUser();
  }, []);

  const available = data?.albums.filter(a => a.status === 'active') || [];
  const locked    = data?.albums.filter(a => a.status === 'locked') || [];
  const ended     = data?.albums.filter(a => a.status === 'ended') || [];

  const AlbumCard = ({ album }) => {
    const canOpen = album.status !== 'locked';
    const st = STATUS_STYLE[album.status];
    const rewardReady = album.completedMissions.length >= (album.reward_min_missions || 9);
    const missionsLeft = (album.reward_min_missions || 9) - album.completedMissions.length;

    return (
      <div onClick={() => canOpen && navigate(`/album/${album.id}`)}
        className="card-junina p-4 transition-all"
        style={{ cursor: canOpen ? 'pointer' : 'not-allowed', opacity: canOpen ? 1 : 0.65 }}>

        {/* Capa */}
        <div className="relative rounded-xl overflow-hidden mb-3" style={{ aspectRatio: '16/9' }}>
          {album.cover_path
            ? <img src={`${UPLOADS_URL}/${album.cover_path}`} alt={album.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-5xl"
                style={{ background: 'linear-gradient(135deg, #C21874 0%, #6F2DA8 100%)' }}>🌽</div>
          }
          <span className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full"
            style={{ background: st.bg, color: st.color }}>
            {st.label}
          </span>
          {album.isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(111,45,168,0.3)' }}>
              <span className="text-5xl drop-shadow-lg animate-pop">⭐</span>
            </div>
          )}
        </div>

        <h3 className="font-display font-bold text-base leading-tight mb-2" style={{ color: '#4B1E6D' }}>
          {album.name}
        </h3>

        {canOpen && (
          <>
            <div className="flex justify-between text-xs mb-1" style={{ color: '#6F2DA8' }}>
              <span>{album.completedMissions.length}/{album.missionCount} missões</span>
              <span className="font-bold">{album.progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(199,154,59,0.2)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${album.progress}%`, background: 'linear-gradient(90deg, #C21874, #6F2DA8)' }} />
            </div>

            {album.reward_name && album.reward_available === 1 && (
              <div className="rounded-xl p-2.5 text-xs"
                style={{ background: rewardReady ? 'rgba(199,154,59,0.15)' : 'rgba(58,31,20,0.05)', border: `1px solid ${rewardReady ? '#C79A3B' : 'rgba(58,31,20,0.1)'}` }}>
                <div className="flex items-center gap-2">
                  <span>{rewardReady ? '🎁' : '🔐'}</span>
                  <div>
                    <p className="font-semibold" style={{ color: rewardReady ? '#C79A3B' : '#3A1F14' }}>{album.reward_name}</p>
                    {!rewardReady
                      ? <p style={{ color: '#6F2DA8' }}>Faltam {missionsLeft} missão(ões)</p>
                      : <p style={{ color: '#C79A3B' }}>Recompensa desbloqueada! 🎉</p>
                    }
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {!canOpen && <p className="text-xs text-center" style={{ color: '#3A1F14', opacity: 0.5 }}>Em breve</p>}
      </div>
    );
  };

  const Section = ({ title, albums }) => albums.length === 0 ? null : (
    <section>
      <h2 className="font-display font-bold text-lg mb-3" style={{ color: '#4B1E6D' }}>{title}</h2>
      <div className="grid gap-4">{albums.map(a => <AlbumCard key={a.id} album={a} />)}</div>
    </section>
  );

  return (
    <div className="min-h-screen bg-junina flex flex-col">
      <Bandeirinhas />

      <header className="px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold" style={{ color: '#4B1E6D' }}>Momentos Juninas</h1>
            <p className="text-xs" style={{ color: '#C79A3B' }}>@{user?.instagram}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge level={user?.statusLevel || 0} />
            <button onClick={logout} className="text-xs font-medium px-2 py-1 rounded-lg transition-colors"
              style={{ color: '#6F2DA8' }}>Sair</button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-8">
        <div className="max-w-lg mx-auto">
          {loading
            ? <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Carregando álbuns..." /></div>
            : (
              <div className="space-y-6">
                <Section title="🌽 Álbuns Disponíveis" albums={available} />
                <Section title="✅ Álbuns Encerrados" albums={ended} />
                <Section title="🔒 Em Breve" albums={locked} />
                {data?.albums.length === 0 && (
                  <div className="card-junina p-12 text-center">
                    <span className="text-5xl block mb-3">🌽</span>
                    <p className="font-medium" style={{ color: '#4B1E6D' }}>Nenhum álbum disponível ainda</p>
                    <p className="text-sm mt-1" style={{ color: '#C79A3B' }}>Volte em breve!</p>
                  </div>
                )}
              </div>
            )
          }
        </div>
      </main>

      <Bandeirinhas />
    </div>
  );
}

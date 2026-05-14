import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { UPLOADS_URL } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import Bandeirinhas from '../components/Bandeirinhas';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_COLORS = { locked: 'bg-gray-100 text-gray-500', active: 'bg-green-100 text-green-700', ended: 'bg-purple-100 text-purple-700' };
const STATUS_LABELS = { locked: '🔒 Em breve', active: '🌽 Disponível', ended: '⭐ Encerrado' };

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/albums').then(res => setData(res.data)).catch(() => toast.error('Erro ao carregar álbuns')).finally(() => setLoading(false));
    refreshUser();
  }, []);

  const available = data?.albums.filter(a => a.status === 'active') || [];
  const locked    = data?.albums.filter(a => a.status === 'locked') || [];
  const ended     = data?.albums.filter(a => a.status === 'ended') || [];

  const AlbumCard = ({ album }) => {
    const isLocked = album.status === 'locked';
    const canOpen = !isLocked;
    const rewardReady = album.completedMissions.length >= (album.reward_min_missions || 9);

    return (
      <div
        onClick={() => canOpen && navigate(`/album/${album.id}`)}
        className={`card-junina p-4 transition-all ${canOpen ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-98' : 'opacity-60 cursor-not-allowed'}`}
      >
        {/* Capa */}
        <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-gradient-to-br from-amber-200 to-rose-200">
          {album.cover_path
            ? <img src={`${UPLOADS_URL}/${album.cover_path}`} alt={album.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-5xl">🌽</div>
          }
          <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[album.status]}`}>
            {STATUS_LABELS[album.status]}
          </span>
          {album.isCompleted && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="text-5xl drop-shadow-lg animate-pop">⭐</span>
            </div>
          )}
        </div>

        {/* Info */}
        <h3 className="font-display font-bold text-amber-900 text-base leading-tight mb-2">{album.name}</h3>

        {/* Progress */}
        {!isLocked && (
          <>
            <div className="flex items-center justify-between text-xs text-amber-600 mb-1">
              <span>{album.completedMissions.length}/{album.missionCount} missões</span>
              <span className="font-semibold">{album.progress}%</span>
            </div>
            <div className="h-2 bg-amber-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all duration-500"
                style={{ width: `${album.progress}%` }}
              />
            </div>

            {/* Recompensa */}
            {album.reward_name && album.reward_available && (
              <div className={`rounded-xl p-2.5 text-xs ${rewardReady ? 'bg-amber-50 border border-amber-300' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center gap-1.5">
                  <span>{rewardReady ? '🎁' : '🔐'}</span>
                  <div>
                    <p className={`font-semibold ${rewardReady ? 'text-amber-800' : 'text-gray-500'}`}>{album.reward_name}</p>
                    {!rewardReady && (
                      <p className="text-gray-400">
                        Faltam {(album.reward_min_missions || 9) - album.completedMissions.length} missão(ões)
                      </p>
                    )}
                    {rewardReady && <p className="text-amber-600">Recompensa desbloqueada! 🎉</p>}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {isLocked && (
          <p className="text-xs text-gray-400 text-center py-1">Este álbum ainda não foi liberado</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-junina flex flex-col">
      <Bandeirinhas />

      {/* Header */}
      <header className="px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-amber-900">Momentos Juninas</h1>
            <p className="text-xs text-amber-600">@{user?.instagram}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge level={user?.statusLevel || 0} />
            <button onClick={logout} className="text-xs text-amber-500 hover:text-amber-700 font-medium px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-8">
        <div className="max-w-lg mx-auto">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Carregando álbuns..." /></div>
          ) : (
            <div className="space-y-6">
              {available.length > 0 && (
                <section>
                  <h2 className="font-display font-bold text-amber-900 text-lg mb-3">🌽 Álbuns Disponíveis</h2>
                  <div className="grid gap-4">{available.map(a => <AlbumCard key={a.id} album={a} />)}</div>
                </section>
              )}

              {ended.length > 0 && (
                <section>
                  <h2 className="font-display font-bold text-amber-900 text-lg mb-3">✅ Álbuns Encerrados</h2>
                  <div className="grid gap-4">{ended.map(a => <AlbumCard key={a.id} album={a} />)}</div>
                </section>
              )}

              {locked.length > 0 && (
                <section>
                  <h2 className="font-display font-bold text-amber-900 text-lg mb-3">🔒 Em Breve</h2>
                  <div className="grid gap-4">{locked.map(a => <AlbumCard key={a.id} album={a} />)}</div>
                </section>
              )}

              {data?.albums.length === 0 && (
                <div className="card-junina p-12 text-center">
                  <span className="text-5xl block mb-3">🌽</span>
                  <p className="text-amber-700 font-medium">Nenhum álbum disponível ainda</p>
                  <p className="text-amber-500 text-sm mt-1">Volte em breve!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Bandeirinhas />
    </div>
  );
}

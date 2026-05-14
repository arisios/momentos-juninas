import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { UPLOADS_URL } from '../utils/api';
import { compressImage, validateVideo, isVideo } from '../utils/compress';
import LoadingSpinner from '../components/LoadingSpinner';
import Bandeirinhas from '../components/Bandeirinhas';

// Decorações do mapa
const MAP_DECO = [
  { emoji: '🌳', x: 5,  y: 15, size: 'text-2xl' },
  { emoji: '🌳', x: 90, y: 20, size: 'text-xl'  },
  { emoji: '🌻', x: 8,  y: 75, size: 'text-lg'  },
  { emoji: '🌻', x: 88, y: 80, size: 'text-lg'  },
  { emoji: '⭐', x: 85, y: 10, size: 'text-sm'  },
  { emoji: '⭐', x: 10, y: 92, size: 'text-sm'  },
  { emoji: '🎪', x: 45, y: 93, size: 'text-sm opacity-30' },
];

export default function AlbumMap() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [auths, setAuths] = useState({ auth_repost: false, auth_mention: false, auth_collab: false, auth_image_use: false });
  const [savingCompletion, setSavingCompletion] = useState(false);

  const fileInputRef = useRef();

  const fetchAlbum = useCallback(async () => {
    try {
      const { data } = await api.get(`/albums/${id}`);
      setData(data);
    } catch { toast.error('Erro ao carregar álbum'); navigate('/'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAlbum(); }, [fetchAlbum]);

  const openMission = (mission) => {
    setSelected(mission);
    setPreview(null);
    setFile(null);
    setUploadProgress(0);
  };

  const closeMission = () => { setSelected(null); setPreview(null); setFile(null); };

  const handleFileSelect = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    try {
      if (isVideo(f)) {
        await validateVideo(f);
        setFile(f);
        setPreview({ url: URL.createObjectURL(f), type: 'video' });
      } else {
        setCompressing(true);
        const compressed = await compressImage(f, (p) => setUploadProgress(p));
        setFile(compressed);
        setPreview({ url: URL.createObjectURL(compressed), type: 'image' });
        setCompressing(false);
        setUploadProgress(0);
      }
    } catch (err) {
      toast.error(err.message);
      setCompressing(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !selected) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('album_id', id);
      formData.append('mission_id', selected.id);

      const { data: result } = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded / e.total) * 100)),
      });

      toast.success('Figurinha preenchida! 🌽');
      closeMission();
      await fetchAlbum();

      if (result.justCompleted && !data?.isCompleted) {
        setTimeout(() => setShowCompletion(true), 600);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro no upload');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleComplete = async () => {
    setSavingCompletion(true);
    try {
      await api.post(`/albums/${id}/complete`, auths);
      toast.success('Álbum concluído! Parabéns! 🏆');
      setShowCompletion(false);
      await fetchAlbum();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSavingCompletion(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-junina flex items-center justify-center">
      <LoadingSpinner size="lg" text="Carregando mapa..." />
    </div>
  );

  const { album, missions, uploadsByMission, isCompleted } = data;
  const completedCount = Object.keys(uploadsByMission).length;
  const progress = Math.round((completedCount / missions.length) * 100);
  const rewardReady = album.reward_name && completedCount >= (album.reward_min_missions || 9);
  const missionsLeft = (album.reward_min_missions || 9) - completedCount;

  const selectedUpload = selected ? uploadsByMission[selected.id] : null;

  return (
    <div className="min-h-screen bg-junina flex flex-col">
      <Bandeirinhas />

      {/* Header */}
      <header className="px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-amber-100 transition-colors text-amber-700">
            ←
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-amber-900 text-base truncate">{album.name}</h1>
            <p className="text-xs text-amber-600">{completedCount}/{missions.length} missões · {progress}%</p>
          </div>
          {isCompleted && <span className="text-xl">⭐</span>}
        </div>
      </header>

      {/* Barra de progresso */}
      <div className="px-4 mb-3">
        <div className="max-w-lg mx-auto">
          <div className="h-2.5 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }} />
          </div>
          {album.reward_name && album.reward_available && (
            <p className={`text-xs mt-1.5 font-medium ${rewardReady ? 'text-amber-700' : 'text-amber-400'}`}>
              {rewardReady
                ? `🎁 ${album.reward_name} desbloqueado!`
                : `🔐 Faltam ${missionsLeft} missão(ões) para: ${album.reward_name}`
              }
            </p>
          )}
        </div>
      </div>

      {/* MAPA */}
      <div className="flex-1 px-3 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="festival-map">

            {/* Decorações */}
            {MAP_DECO.map((d, i) => (
              <span key={i} className={`absolute pointer-events-none select-none ${d.size}`}
                style={{ left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%,-50%)' }}>
                {d.emoji}
              </span>
            ))}

            {/* Título do mapa */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
              <span className="text-[10px] font-bold text-amber-700 bg-white/70 px-2 py-0.5 rounded-full tracking-widest uppercase">
                Juninas do Rio
              </span>
            </div>

            {/* Spots das missões */}
            {missions.map((mission) => {
              const upload = uploadsByMission[mission.id];
              const filled = !!upload;

              return (
                <div
                  key={mission.id}
                  className="mission-spot"
                  style={{ left: `${mission.map_x}%`, top: `${mission.map_y}%` }}
                  onClick={() => openMission(mission)}
                >
                  <div className={`mission-spot-inner ${filled ? 'filled' : 'empty'}`}>
                    {filled ? (
                      upload.file_type === 'video'
                        ? <video src={`${UPLOADS_URL}/${upload.file_path}`} className="w-full h-full object-cover rounded-full" muted playsInline />
                        : <img src={`${UPLOADS_URL}/${upload.file_path}`} alt={mission.title} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span>{mission.emoji}</span>
                    )}
                  </div>
                  <span className="mission-spot-label">{mission.title}</span>
                  {filled && (
                    <span className="absolute -top-1 -right-1 text-xs bg-amber-400 rounded-full w-4 h-4 flex items-center justify-center text-white font-bold shadow-sm" style={{ fontSize: 9 }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de missão */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && closeMission()}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-5 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1 bg-amber-200 rounded-full mx-auto mb-4" />

            <div className="flex items-start gap-3 mb-5">
              <div className="text-4xl">{selected.emoji}</div>
              <div>
                <h3 className="font-display font-bold text-amber-900 text-lg leading-tight">{selected.title}</h3>
                <p className="text-amber-600 text-sm mt-0.5">{selected.description}</p>
                {selectedUpload && <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-1">✓ Figurinha preenchida</span>}
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div className="rounded-2xl overflow-hidden mb-4 aspect-video bg-black">
                {preview.type === 'video'
                  ? <video src={preview.url} controls className="w-full h-full object-contain" />
                  : <img src={preview.url} alt="preview" className="w-full h-full object-contain" />
                }
              </div>
            )}

            {/* Existing upload preview */}
            {!preview && selectedUpload && (
              <div className="rounded-2xl overflow-hidden mb-4 aspect-video bg-black">
                {selectedUpload.file_type === 'video'
                  ? <video src={`${UPLOADS_URL}/${selectedUpload.file_path}`} controls className="w-full h-full object-contain" />
                  : <img src={`${UPLOADS_URL}/${selectedUpload.file_path}`} alt="minha foto" className="w-full h-full object-contain" />
                }
              </div>
            )}

            {/* Compressing indicator */}
            {compressing && (
              <div className="flex items-center gap-2 text-sm text-amber-600 mb-3">
                <LoadingSpinner size="sm" />
                <span>Comprimindo imagem... {uploadProgress}%</span>
              </div>
            )}

            {/* Upload progress */}
            {uploading && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-amber-600 mb-1">
                  <span>Enviando...</span><span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />

            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading || compressing}
                className="flex-1 py-3 rounded-xl border-2 border-amber-300 text-amber-700 text-sm font-semibold hover:bg-amber-50 active:scale-95 transition-all disabled:opacity-50">
                {selectedUpload ? '📷 Trocar mídia' : '📷 Escolher foto/vídeo'}
              </button>
              {file && (
                <button onClick={handleUpload} disabled={uploading || compressing}
                  className="flex-1 btn-primary py-3">
                  {uploading ? `${uploadProgress}%` : 'Preencher figurinha ✨'}
                </button>
              )}
            </div>

            <button onClick={closeMission} className="w-full mt-3 py-2 text-sm text-amber-400 hover:text-amber-600 transition-colors">
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de conclusão */}
      {showCompletion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center animate-pop">
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="font-display text-2xl font-bold text-amber-900 mb-1">Álbum Completo!</h2>
            <p className="text-amber-600 text-sm mb-5">Você completou todas as missões de <strong>{album.name}</strong>! 🌽</p>

            {album.reward_name && album.reward_available && (
              <div className="bg-amber-50 rounded-2xl p-4 mb-5 border border-amber-200">
                <p className="text-xs text-amber-500 uppercase font-semibold tracking-wide mb-1">Recompensa desbloqueada</p>
                <p className="font-bold text-amber-900">🎁 {album.reward_name}</p>
                {album.reward_description && <p className="text-xs text-amber-600 mt-1">{album.reward_description}</p>}
              </div>
            )}

            <p className="text-xs text-amber-700 font-semibold mb-3 text-left">Autorize o uso das suas fotos:</p>
            <div className="space-y-2.5 mb-5 text-left">
              {[
                { key: 'auth_repost',    label: 'Autorizo repost nas redes sociais' },
                { key: 'auth_mention',   label: 'Autorizo marcação no Instagram' },
                { key: 'auth_collab',    label: 'Autorizo collab' },
                { key: 'auth_image_use', label: 'Autorizo uso de imagem pelas Juninas do Rio' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={auths[key]} onChange={e => setAuths(a => ({ ...a, [key]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-amber-500" />
                  <span className="text-xs text-amber-700 group-hover:text-amber-900 transition-colors">{label}</span>
                </label>
              ))}
            </div>

            <button onClick={handleComplete} disabled={savingCompletion} className="btn-primary">
              {savingCompletion ? <LoadingSpinner size="sm" /> : 'Confirmar e receber selo ⭐'}
            </button>
            <button onClick={() => setShowCompletion(false)} className="mt-3 text-xs text-amber-400 hover:text-amber-600">
              Fechar por agora
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

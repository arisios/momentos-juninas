import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api, { UPLOADS_URL } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import Bandeirinhas from '../components/Bandeirinhas';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_MAP = {
  locked: { label: '🔒 Bloqueado', bg: 'rgba(58,31,20,0.08)',    color: '#3A1F14'  },
  active: { label: '🌽 Ativo',     bg: 'rgba(0,124,145,0.12)',   color: '#007C91'  },
  ended:  { label: '⭐ Encerrado', bg: 'rgba(111,45,168,0.12)',  color: '#6F2DA8'  },
};
const TABS = ['Álbuns', 'Usuários', 'Mídias', 'Estatísticas'];
const emptyForm = { name: '', status: 'locked', reward_name: '', reward_description: '', reward_min_missions: '9', reward_available: true };

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Álbuns');
  const [albums, setAlbums] = useState([]);
  const [users, setUsers] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterAlbum, setFilterAlbum] = useState('');
  const coverRef = useRef();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [a, u, up, s] = await Promise.all([
        api.get('/admin/albums'), api.get('/admin/users'),
        api.get('/admin/uploads'), api.get('/admin/stats'),
      ]);
      setAlbums(a.data.albums); setUsers(u.data.users);
      setUploads(up.data.uploads); setStats(s.data.stats);
    } catch { toast.error('Erro ao carregar dados'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setModal('create'); setForm(emptyForm); setCoverFile(null); setCoverPreview(null); };
  const openEdit = (album) => {
    setModal(album);
    setForm({ name: album.name, status: album.status, reward_name: album.reward_name || '', reward_description: album.reward_description || '', reward_min_missions: String(album.reward_min_missions || 9), reward_available: album.reward_available === 1 });
    setCoverFile(null);
    setCoverPreview(album.cover_path ? `${UPLOADS_URL}/${album.cover_path}` : null);
  };
  const closeModal = () => { setModal(null); setCoverFile(null); setCoverPreview(null); };

  const handleCoverChange = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setCoverFile(f); setCoverPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Nome é obrigatório');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim()); fd.append('status', form.status);
      if (form.reward_name) fd.append('reward_name', form.reward_name);
      if (form.reward_description) fd.append('reward_description', form.reward_description);
      fd.append('reward_min_missions', form.reward_min_missions);
      fd.append('reward_available', form.reward_available ? '1' : '0');
      if (coverFile) fd.append('cover', coverFile);
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (modal === 'create') { await api.post('/admin/albums', fd, { headers }); toast.success('Álbum criado!'); }
      else { await api.patch(`/admin/albums/${modal.id}`, fd, { headers }); toast.success('Álbum atualizado!'); }
      closeModal(); fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (album) => {
    if (!confirm(`Excluir "${album.name}"?`)) return;
    try { await api.delete(`/admin/albums/${album.id}`); toast.success('Excluído'); fetchAll(); }
    catch { toast.error('Erro ao excluir'); }
  };

  const quickStatus = async (album, status) => {
    try {
      const fd = new FormData(); fd.append('name', album.name); fd.append('status', status);
      await api.patch(`/admin/albums/${album.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Status atualizado!'); fetchAll();
    } catch { toast.error('Erro'); }
  };

  const filteredUploads = filterAlbum ? uploads.filter(u => String(u.album_id) === filterAlbum) : uploads;

  const inputStyle = { background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(199,154,59,0.35)', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#3A1F14', width: '100%', outline: 'none' };

  return (
    <div className="min-h-screen bg-junina flex flex-col">
      <Bandeirinhas />

      <header className="px-4 py-3" style={{ background: 'rgba(75,30,109,0.05)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold" style={{ color: '#4B1E6D' }}>Admin · Momentos Juninas</h1>
            <p className="text-xs" style={{ color: '#C79A3B' }}>@{user?.instagram}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/admin/mapa')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(194,24,116,0.1)', color: '#C21874' }}>
              🗺 Editar Mapa
            </button>
            <button onClick={logout}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#6F2DA8' }}>
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="max-w-2xl mx-auto flex gap-1 rounded-xl p-1" style={{ background: 'rgba(199,154,59,0.15)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={tab === t ? { background: '#fff', color: '#4B1E6D', boxShadow: '0 2px 8px rgba(75,30,109,0.1)' } : { color: '#6F2DA8' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {loading
            ? <div className="flex justify-center py-12"><LoadingSpinner text="Carregando..." /></div>
            : (
              <>
                {/* ÁLBUNS */}
                {tab === 'Álbuns' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-display font-bold" style={{ color: '#4B1E6D' }}>{albums.length} álbum(ns)</h2>
                      <button onClick={openCreate}
                        className="px-4 py-2 text-sm font-semibold rounded-xl text-white shadow hover:shadow-md active:scale-95 transition-all"
                        style={{ background: 'linear-gradient(135deg, #C21874, #6F2DA8)' }}>
                        + Criar Álbum
                      </button>
                    </div>

                    {albums.map(album => {
                      const st = STATUS_MAP[album.status];
                      return (
                        <div key={album.id} className="card-junina p-4">
                          <div className="flex gap-3">
                            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl"
                              style={{ background: 'linear-gradient(135deg, #C21874, #6F2DA8)' }}>
                              {album.cover_path
                                ? <img src={`${UPLOADS_URL}/${album.cover_path}`} className="w-full h-full object-cover" alt="" />
                                : '🌽'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-sm leading-tight" style={{ color: '#4B1E6D' }}>{album.name}</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                                  style={{ background: st.bg, color: st.color }}>{st.label}</span>
                              </div>
                              <div className="flex gap-3 text-xs mt-1" style={{ color: '#C79A3B' }}>
                                <span>👥 {album.userCount}</span>
                                <span>📸 {album.uploadCount}</span>
                                <span>⭐ {album.completionCount}</span>
                              </div>
                              {album.reward_name && <p className="text-xs mt-1" style={{ color: '#D96C2F' }}>🎁 {album.reward_name}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1.5 mt-3 flex-wrap">
                            {album.status !== 'active'  && <button onClick={() => quickStatus(album, 'active')}  className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors" style={{ background: 'rgba(0,124,145,0.1)', color: '#007C91' }}>▶ Ativar</button>}
                            {album.status !== 'locked'  && <button onClick={() => quickStatus(album, 'locked')}  className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors" style={{ background: 'rgba(58,31,20,0.08)', color: '#3A1F14' }}>🔒 Bloquear</button>}
                            {album.status !== 'ended'   && <button onClick={() => quickStatus(album, 'ended')}   className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors" style={{ background: 'rgba(111,45,168,0.1)', color: '#6F2DA8' }}>⭐ Encerrar</button>}
                            <button onClick={() => openEdit(album)} className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors" style={{ background: 'rgba(199,154,59,0.15)', color: '#C79A3B' }}>✏️ Editar</button>
                            <button onClick={() => handleDelete(album)} className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors" style={{ background: 'rgba(194,24,116,0.1)', color: '#C21874' }}>🗑 Excluir</button>
                          </div>
                        </div>
                      );
                    })}
                    {albums.length === 0 && <div className="card-junina p-10 text-center"><span className="text-4xl">🌽</span><p className="mt-2" style={{ color: '#4B1E6D' }}>Nenhum álbum ainda</p></div>}
                  </div>
                )}

                {/* USUÁRIOS */}
                {tab === 'Usuários' && (
                  <div className="space-y-2">
                    <p className="text-xs mb-3" style={{ color: '#C79A3B' }}>{users.filter(u => u.role === 'user').length} usuário(s)</p>
                    {users.filter(u => u.role === 'user').map(u => (
                      <div key={u.id} className="card-junina p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #C21874, #6F2DA8)' }}>
                          {u.instagram[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: '#4B1E6D' }}>@{u.instagram}</p>
                          <div className="flex gap-2 text-xs mt-0.5" style={{ color: '#C79A3B' }}>
                            <span>📸 {u.uploadCount} fotos</span>
                            <span>⭐ {u.completionCount} completos</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {users.filter(u => u.role === 'user').length === 0 && <div className="card-junina p-10 text-center"><span className="text-4xl">👥</span><p className="mt-2" style={{ color: '#4B1E6D' }}>Nenhum usuário ainda</p></div>}
                  </div>
                )}

                {/* MÍDIAS */}
                {tab === 'Mídias' && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <select value={filterAlbum} onChange={e => setFilterAlbum(e.target.value)}
                        className="flex-1 text-xs py-2" style={{ ...inputStyle }}>
                        <option value="">Todos os álbuns</option>
                        {albums.map(a => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
                      </select>
                      <span className="text-xs whitespace-nowrap" style={{ color: '#C79A3B' }}>{filteredUploads.length} mídias</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {filteredUploads.map(u => (
                        <a key={u.id} href={`${UPLOADS_URL}/${u.file_path}`} target="_blank" rel="noreferrer"
                          className="relative aspect-square rounded-xl overflow-hidden block group"
                          style={{ background: 'rgba(199,154,59,0.1)' }}>
                          {u.file_type === 'video'
                            ? <video src={`${UPLOADS_URL}/${u.file_path}`} className="w-full h-full object-cover" muted />
                            : <img src={`${UPLOADS_URL}/${u.file_path}`} alt="" className="w-full h-full object-cover" />
                          }
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5"
                            style={{ background: 'rgba(75,30,109,0.4)' }}>
                            <p className="text-white text-[10px] font-medium truncate">@{u.instagram}</p>
                          </div>
                          {u.file_type === 'video' && <div className="absolute top-1 right-1 text-white text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }}>▶</div>}
                          <div className="absolute bottom-1 left-1 text-sm">{u.emoji}</div>
                        </a>
                      ))}
                    </div>
                    {filteredUploads.length === 0 && <div className="card-junina p-10 text-center"><span className="text-4xl">📸</span><p className="mt-2" style={{ color: '#4B1E6D' }}>Nenhuma mídia ainda</p></div>}
                  </div>
                )}

                {/* ESTATÍSTICAS */}
                {tab === 'Estatísticas' && stats && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { emoji: '👥', label: 'Usuários',   value: stats.totalUsers,      bg: 'rgba(0,124,145,0.08)',      color: '#007C91'  },
                      { emoji: '📁', label: 'Álbuns',     value: stats.totalAlbums,     bg: 'rgba(111,45,168,0.08)',     color: '#6F2DA8'  },
                      { emoji: '📸', label: 'Uploads',    value: stats.totalUploads,    bg: 'rgba(194,24,116,0.08)',     color: '#C21874'  },
                      { emoji: '⭐', label: 'Concluídos', value: stats.totalCompletions,bg: 'rgba(199,154,59,0.12)',     color: '#C79A3B'  },
                    ].map(s => (
                      <div key={s.label} className="card-junina p-5 text-center" style={{ background: s.bg }}>
                        <span className="text-3xl block mb-1">{s.emoji}</span>
                        <p className="text-3xl font-bold" style={{ color: '#4B1E6D' }}>{s.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: s.color }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          }
        </div>
      </main>

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 flex items-end justify-center z-50 animate-fade-in"
          style={{ background: 'rgba(75,30,109,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-5 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: '#C79A3B' }} />
            <h3 className="font-display text-lg font-bold mb-4" style={{ color: '#4B1E6D' }}>
              {modal === 'create' ? 'Criar Álbum' : `Editar: ${modal.name}`}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4B1E6D' }}>Capa do álbum</label>
                <div className="flex gap-3 items-center">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl"
                    style={{ background: 'linear-gradient(135deg, #C21874, #6F2DA8)' }}>
                    {coverPreview ? <img src={coverPreview} alt="" className="w-full h-full object-cover" /> : '🌽'}
                  </div>
                  <button type="button" onClick={() => coverRef.current?.click()} className="btn-secondary text-xs">
                    {coverPreview ? 'Trocar imagem' : 'Escolher imagem'}
                  </button>
                  <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4B1E6D' }}>Nome do álbum *</label>
                <input style={inputStyle} placeholder="Ex: Junina da Urca" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4B1E6D' }}>Status</label>
                <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="locked">🔒 Bloqueado</option>
                  <option value="active">🌽 Ativo</option>
                  <option value="ended">⭐ Encerrado</option>
                </select>
              </div>

              <div className="pt-3" style={{ borderTop: '1px solid rgba(199,154,59,0.2)' }}>
                <p className="text-xs font-bold mb-3" style={{ color: '#C79A3B' }}>🎁 Recompensa</p>
                <div className="space-y-3">
                  <input style={inputStyle} placeholder="Nome da recompensa (ex: Copo oficial)" value={form.reward_name} onChange={e => setForm(f => ({ ...f, reward_name: e.target.value }))} />
                  <input style={inputStyle} placeholder="Descrição da recompensa" value={form.reward_description} onChange={e => setForm(f => ({ ...f, reward_description: e.target.value }))} />
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <label className="block text-xs mb-1" style={{ color: '#6F2DA8' }}>Mínimo de missões</label>
                      <input type="number" min="1" max="9" style={inputStyle} value={form.reward_min_missions} onChange={e => setForm(f => ({ ...f, reward_min_missions: e.target.value }))} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-4">
                      <input type="checkbox" checked={form.reward_available} onChange={e => setForm(f => ({ ...f, reward_available: e.target.checked }))}
                        className="w-4 h-4" style={{ accentColor: '#C21874' }} />
                      <span className="text-xs" style={{ color: '#4B1E6D' }}>Disponível</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={closeModal} className="btn-secondary flex-1 py-3">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? <LoadingSpinner size="sm" /> : modal === 'create' ? 'Criar álbum' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Bandeirinhas />
    </div>
  );
}

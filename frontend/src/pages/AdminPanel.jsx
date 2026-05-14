import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api, { UPLOADS_URL } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import Bandeirinhas from '../components/Bandeirinhas';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_MAP = { locked: { label: '🔒 Bloqueado', cls: 'bg-gray-100 text-gray-600' }, active: { label: '🌽 Ativo', cls: 'bg-green-100 text-green-700' }, ended: { label: '⭐ Encerrado', cls: 'bg-purple-100 text-purple-700' } };
const TABS = ['Álbuns', 'Usuários', 'Mídias', 'Estatísticas'];

const emptyForm = { name: '', status: 'locked', reward_name: '', reward_description: '', reward_min_missions: '9', reward_available: true };

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('Álbuns');
  const [albums, setAlbums] = useState([]);
  const [users, setUsers] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | album object
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
        api.get('/admin/albums'),
        api.get('/admin/users'),
        api.get('/admin/uploads'),
        api.get('/admin/stats'),
      ]);
      setAlbums(a.data.albums);
      setUsers(u.data.users);
      setUploads(up.data.uploads);
      setStats(s.data.stats);
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
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Nome é obrigatório');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('status', form.status);
      if (form.reward_name) fd.append('reward_name', form.reward_name);
      if (form.reward_description) fd.append('reward_description', form.reward_description);
      fd.append('reward_min_missions', form.reward_min_missions);
      fd.append('reward_available', form.reward_available ? '1' : '0');
      if (coverFile) fd.append('cover', coverFile);

      if (modal === 'create') {
        await api.post('/admin/albums', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Álbum criado!');
      } else {
        await api.patch(`/admin/albums/${modal.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Álbum atualizado!');
      }
      closeModal();
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (album) => {
    if (!confirm(`Excluir "${album.name}"? Todos os uploads serão removidos.`)) return;
    try {
      await api.delete(`/admin/albums/${album.id}`);
      toast.success('Álbum excluído');
      fetchAll();
    } catch { toast.error('Erro ao excluir'); }
  };

  const quickStatus = async (album, status) => {
    try {
      const fd = new FormData();
      fd.append('name', album.name);
      fd.append('status', status);
      await api.patch(`/admin/albums/${album.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Status atualizado!');
      fetchAll();
    } catch { toast.error('Erro'); }
  };

  const filteredUploads = filterAlbum ? uploads.filter(u => String(u.album_id) === filterAlbum) : uploads;

  return (
    <div className="min-h-screen bg-junina flex flex-col">
      <Bandeirinhas />

      <header className="px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold text-amber-900">Admin · Momentos Juninas</h1>
            <p className="text-xs text-amber-500">@{user?.instagram}</p>
          </div>
          <button onClick={logout} className="text-xs text-amber-600 hover:text-amber-900 font-medium px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">Sair</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="max-w-2xl mx-auto flex gap-1 bg-amber-100 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-white shadow-sm text-amber-900' : 'text-amber-600'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {loading ? <div className="flex justify-center py-12"><LoadingSpinner text="Carregando..." /></div> : (

            <>
              {/* ── ÁLBUNS ── */}
              {tab === 'Álbuns' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-display font-bold text-amber-900">{albums.length} álbum(ns)</h2>
                    <button onClick={openCreate} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-sm font-semibold rounded-xl shadow hover:shadow-md active:scale-95 transition-all">
                      + Criar Álbum
                    </button>
                  </div>

                  {albums.map(album => (
                    <div key={album.id} className="card-junina p-4">
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-amber-100">
                          {album.cover_path
                            ? <img src={`${UPLOADS_URL}/${album.cover_path}`} className="w-full h-full object-cover" alt="" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl">🌽</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-amber-900 text-sm leading-tight">{album.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_MAP[album.status].cls}`}>
                              {STATUS_MAP[album.status].label}
                            </span>
                          </div>
                          <div className="flex gap-3 text-xs text-amber-500 mt-1">
                            <span>👥 {album.userCount} usuários</span>
                            <span>📸 {album.uploadCount} mídias</span>
                            <span>⭐ {album.completionCount} completos</span>
                          </div>
                          {album.reward_name && (
                            <p className="text-xs text-amber-600 mt-1">🎁 {album.reward_name}</p>
                          )}
                        </div>
                      </div>

                      {/* Ações de status */}
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {album.status !== 'active'  && <button onClick={() => quickStatus(album, 'active')}  className="text-xs px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors">▶ Ativar</button>}
                        {album.status !== 'locked'  && <button onClick={() => quickStatus(album, 'locked')}  className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors">🔒 Bloquear</button>}
                        {album.status !== 'ended'   && <button onClick={() => quickStatus(album, 'ended')}   className="text-xs px-2.5 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors">⭐ Encerrar</button>}
                        <button onClick={() => openEdit(album)} className="text-xs px-2.5 py-1.5 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 transition-colors">✏️ Editar</button>
                        <button onClick={() => handleDelete(album)} className="text-xs px-2.5 py-1.5 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition-colors">🗑 Excluir</button>
                      </div>
                    </div>
                  ))}

                  {albums.length === 0 && <div className="card-junina p-10 text-center"><span className="text-4xl">🌽</span><p className="text-amber-600 mt-2">Nenhum álbum ainda</p></div>}
                </div>
              )}

              {/* ── USUÁRIOS ── */}
              {tab === 'Usuários' && (
                <div className="space-y-2">
                  <p className="text-xs text-amber-500 mb-3">{users.filter(u => u.role === 'user').length} usuário(s) cadastrado(s)</p>
                  {users.filter(u => u.role === 'user').map(u => (
                    <div key={u.id} className="card-junina p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-rose-300 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                        {u.instagram[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-amber-900 text-sm">@{u.instagram}</p>
                        <div className="flex gap-2 text-xs text-amber-500 mt-0.5">
                          <span>📸 {u.uploadCount} fotos</span>
                          <span>⭐ {u.completionCount} completos</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {users.filter(u => u.role === 'user').length === 0 && <div className="card-junina p-10 text-center"><span className="text-4xl">👥</span><p className="text-amber-600 mt-2">Nenhum usuário ainda</p></div>}
                </div>
              )}

              {/* ── MÍDIAS ── */}
              {tab === 'Mídias' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <select value={filterAlbum} onChange={e => setFilterAlbum(e.target.value)} className="input-junina flex-1 text-xs py-2">
                      <option value="">Todos os álbuns</option>
                      {albums.map(a => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
                    </select>
                    <span className="text-xs text-amber-500 whitespace-nowrap">{filteredUploads.length} mídias</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {filteredUploads.map(u => (
                      <a key={u.id} href={`${UPLOADS_URL}/${u.file_path}`} target="_blank" rel="noreferrer"
                        className="relative aspect-square rounded-xl overflow-hidden bg-amber-100 block group">
                        {u.file_type === 'video'
                          ? <video src={`${UPLOADS_URL}/${u.file_path}`} className="w-full h-full object-cover" muted />
                          : <img src={`${UPLOADS_URL}/${u.file_path}`} alt="" className="w-full h-full object-cover" />
                        }
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-1.5 opacity-0 group-hover:opacity-100">
                          <p className="text-white text-[10px] font-medium leading-tight truncate">@{u.instagram}</p>
                        </div>
                        {u.file_type === 'video' && (
                          <div className="absolute top-1 right-1 bg-black/50 rounded-full px-1.5 py-0.5 text-white text-[10px]">▶</div>
                        )}
                        <div className="absolute bottom-1 left-1 text-sm">{u.emoji}</div>
                      </a>
                    ))}
                  </div>
                  {filteredUploads.length === 0 && <div className="card-junina p-10 text-center"><span className="text-4xl">📸</span><p className="text-amber-600 mt-2">Nenhuma mídia ainda</p></div>}
                </div>
              )}

              {/* ── ESTATÍSTICAS ── */}
              {tab === 'Estatísticas' && stats && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { emoji: '👥', label: 'Usuários',   value: stats.totalUsers },
                    { emoji: '📁', label: 'Álbuns',     value: stats.totalAlbums },
                    { emoji: '📸', label: 'Uploads',    value: stats.totalUploads },
                    { emoji: '⭐', label: 'Concluídos', value: stats.totalCompletions },
                  ].map(s => (
                    <div key={s.label} className="card-junina p-5 text-center">
                      <span className="text-3xl block mb-1">{s.emoji}</span>
                      <p className="text-3xl font-bold text-amber-900">{s.value}</p>
                      <p className="text-xs text-amber-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal criar/editar álbum */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 animate-fade-in"
          onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-5 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1 bg-amber-200 rounded-full mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold text-amber-900 mb-4">
              {modal === 'create' ? 'Criar Álbum' : `Editar: ${modal.name}`}
            </h3>

            <div className="space-y-4">
              {/* Capa */}
              <div>
                <label className="block text-xs font-semibold text-amber-700 mb-1.5">Capa do álbum</label>
                <div className="flex gap-3 items-center">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-amber-100 flex-shrink-0 flex items-center justify-center text-3xl">
                    {coverPreview ? <img src={coverPreview} alt="" className="w-full h-full object-cover" /> : '🌽'}
                  </div>
                  <button type="button" onClick={() => coverRef.current?.click()}
                    className="btn-secondary text-xs">
                    {coverPreview ? 'Trocar imagem' : 'Escolher imagem'}
                  </button>
                  <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-700 mb-1.5">Nome do álbum *</label>
                <input className="input-junina" placeholder="Ex: Junina da Urca" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-700 mb-1.5">Status</label>
                <select className="input-junina" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="locked">🔒 Bloqueado</option>
                  <option value="active">🌽 Ativo</option>
                  <option value="ended">⭐ Encerrado</option>
                </select>
              </div>

              <div className="border-t border-amber-100 pt-4">
                <p className="text-xs font-bold text-amber-700 mb-3">🎁 Recompensa</p>
                <div className="space-y-3">
                  <input className="input-junina" placeholder="Nome da recompensa (ex: Copo oficial)" value={form.reward_name} onChange={e => setForm(f => ({ ...f, reward_name: e.target.value }))} />
                  <input className="input-junina" placeholder="Descrição da recompensa" value={form.reward_description} onChange={e => setForm(f => ({ ...f, reward_description: e.target.value }))} />
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <label className="block text-xs text-amber-600 mb-1">Mínimo de missões</label>
                      <input type="number" min="1" max="9" className="input-junina" value={form.reward_min_missions} onChange={e => setForm(f => ({ ...f, reward_min_missions: e.target.value }))} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-4">
                      <input type="checkbox" checked={form.reward_available} onChange={e => setForm(f => ({ ...f, reward_available: e.target.checked }))} className="w-4 h-4 accent-amber-500" />
                      <span className="text-xs text-amber-700">Disponível</span>
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

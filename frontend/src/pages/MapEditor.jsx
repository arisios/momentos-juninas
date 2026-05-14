import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function MapEditor() {
  const navigate = useNavigate();
  const mapRef = useRef();
  const [missions, setMissions] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [positions, setPositions] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/admin/missions').then(res => {
      const ms = res.data.missions;
      setMissions(ms);
      const pos = {};
      ms.forEach(m => { pos[m.id] = { x: m.map_x, y: m.map_y }; });
      setPositions(pos);
    }).catch(() => toast.error('Erro ao carregar missões'));
  }, []);

  const getRelativePos = (e, touch = false) => {
    const rect = mapRef.current.getBoundingClientRect();
    const clientX = touch ? e.touches[0].clientX : e.clientX;
    const clientY = touch ? e.touches[0].clientY : e.clientY;
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  const onMouseDown = (e, missionId) => {
    e.preventDefault();
    setDragging(missionId);
  };

  const onMouseMove = (e) => {
    if (!dragging || !mapRef.current) return;
    const pos = getRelativePos(e);
    setPositions(prev => ({ ...prev, [dragging]: pos }));
  };

  const onTouchMove = (e) => {
    if (!dragging || !mapRef.current) return;
    e.preventDefault();
    const pos = getRelativePos(e, true);
    setPositions(prev => ({ ...prev, [dragging]: pos }));
  };

  const stopDrag = () => setDragging(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/missions/positions', { positions });
      setSaved(true);
      toast.success('Posições salvas! ✅');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const copyJSON = () => {
    const output = missions.map(m => ({
      id: m.id,
      title: m.title,
      x: positions[m.id]?.x,
      y: positions[m.id]?.y,
    }));
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    toast.success('JSON copiado!');
  };

  return (
    <div className="min-h-screen bg-junina flex flex-col">
      <header className="px-4 py-3 flex items-center gap-3 bg-amber-900 text-white">
        <button onClick={() => navigate('/admin')} className="text-amber-300 hover:text-white">← Admin</button>
        <h1 className="font-display font-bold flex-1">Editor de Posições do Mapa</h1>
        <button
          onClick={copyJSON}
          className="text-xs px-3 py-1.5 bg-amber-700 rounded-lg hover:bg-amber-600 transition-colors"
        >
          Copiar JSON
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-4 py-1.5 bg-green-500 rounded-lg font-bold hover:bg-green-400 transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : saved ? '✅ Salvo!' : 'Salvar posições'}
        </button>
      </header>

      <div className="px-3 py-2 bg-amber-800 text-amber-200 text-xs text-center">
        Arraste cada figurinha para a posição correta no mapa
      </div>

      <div className="flex-1 p-3 overflow-auto">
        <div
          ref={mapRef}
          className="relative w-full mx-auto select-none"
          style={{
            maxWidth: 600,
            aspectRatio: '1275 / 1234',
            backgroundImage: "url('/mapaalbum.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            borderRadius: '1rem',
            border: '2px solid #f59e0b',
            cursor: dragging ? 'grabbing' : 'default',
            touchAction: 'none',
          }}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onTouchMove={onTouchMove}
          onTouchEnd={stopDrag}
        >
          {missions.map(m => {
            const pos = positions[m.id] || { x: 50, y: 50 };
            const isDragging = dragging === m.id;
            return (
              <div
                key={m.id}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'grab',
                  zIndex: isDragging ? 50 : 10,
                  userSelect: 'none',
                }}
                onMouseDown={e => onMouseDown(e, m.id)}
                onTouchStart={e => { e.preventDefault(); setDragging(m.id); }}
              >
                <div style={{
                  width: 52, height: 52,
                  borderRadius: '50%',
                  background: isDragging ? '#f59e0b' : 'rgba(255,255,255,0.95)',
                  border: isDragging ? '3px solid #d97706' : '2px solid #f59e0b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem',
                  boxShadow: isDragging
                    ? '0 8px 24px rgba(0,0,0,0.4)'
                    : '0 3px 10px rgba(0,0,0,0.2)',
                  transition: isDragging ? 'none' : 'box-shadow 0.2s',
                }}>
                  {m.emoji}
                </div>
                <div style={{
                  textAlign: 'center', fontSize: 9, fontWeight: 700,
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: 6, padding: '2px 4px', marginTop: 2,
                  color: '#92400e', maxWidth: 70,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {m.title}
                </div>
                <div style={{
                  textAlign: 'center', fontSize: 8, color: 'rgba(0,0,0,0.5)',
                  background: 'rgba(255,255,255,0.7)', borderRadius: 4,
                  padding: '1px 3px', marginTop: 1,
                }}>
                  {pos.x}%, {pos.y}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

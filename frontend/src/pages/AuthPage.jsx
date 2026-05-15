import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Bandeirinhas from '../components/Bandeirinhas';
import LoadingSpinner from '../components/LoadingSpinner';

const formatPhone = (v) => {
  const d = v.replace(/\D/g,'').slice(0,11);
  if (d.length<=2) return d;
  if (d.length<=6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length<=10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState('instagram'); // 'instagram' | 'telefone'
  const [form, setForm] = useState({ identifier: '', password: '' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePhone = (e) => setForm({ ...form, identifier: formatPhone(e.target.value) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(form.identifier, form.password);
        toast.success(`Bem-vindo(a) de volta! ${user.emoji || '🌽'}`);
        navigate(user.role === 'admin' ? '/admin' : '/');
      } else {
        const payload = tipo === 'instagram'
          ? { instagram: form.identifier, password: form.password }
          : { phone: form.identifier, password: form.password };
        await register(payload);
        toast.success('Conta criada! Bem-vindo(a) às Juninas! 🌽');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Algo deu errado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-junina flex flex-col">
      <div className="pt-6"><Bandeirinhas /></div>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-xl mb-4 animate-float"
              style={{ background: 'linear-gradient(135deg, #C21874 0%, #6F2DA8 100%)' }}>
              <span className="text-4xl">🌽</span>
            </div>
            <h1 className="font-display text-3xl font-bold" style={{ color: '#4B1E6D' }}>Momentos Juninas</h1>
            <p className="mt-1 text-sm font-medium tracking-wide uppercase" style={{ color: '#C79A3B' }}>Juninas do Rio · 2026</p>
          </div>

          <div className="card-junina p-6">
            <div className="flex rounded-xl p-1 mb-5" style={{ background: 'rgba(199,154,59,0.12)' }}>
              {['login','register'].map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={mode===m ? { background:'#fff', color:'#4B1E6D', boxShadow:'0 2px 8px rgba(75,30,109,0.12)' } : { color:'#6F2DA8' }}>
                  {m === 'login' ? 'Entrar' : 'Cadastrar'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Seletor instagram/telefone no cadastro */}
              {mode === 'register' && (
                <div className="flex rounded-xl p-1" style={{ background: 'rgba(199,154,59,0.08)' }}>
                  {['instagram','telefone'].map(t => (
                    <button key={t} type="button" onClick={() => { setTipo(t); setForm(f=>({...f,identifier:''})); }}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={tipo===t ? { background:'#fff', color:'#4B1E6D', boxShadow:'0 1px 4px rgba(75,30,109,0.1)' } : { color:'#6F2DA8' }}>
                      {t === 'instagram' ? '@ Instagram' : '📱 Telefone'}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#4B1E6D' }}>
                  {mode === 'login' ? '@ Instagram ou Telefone' : tipo === 'instagram' ? '@ Instagram' : 'Telefone'}
                </label>
                {(mode === 'register' && tipo === 'instagram') || mode === 'login' ? (
                  <div className="relative">
                    {(mode === 'login' || tipo === 'instagram') && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#C79A3B' }}>@</span>
                    )}
                    <input name="identifier" type="text"
                      className={`input-junina ${(mode==='login'||tipo==='instagram') ? 'pl-8' : ''}`}
                      placeholder={mode==='login' ? 'instagram ou (21) 99999-9999' : 'seuinstagram'}
                      value={form.identifier} onChange={handleChange}
                      autoFocus autoCapitalize="none" autoCorrect="off" required />
                  </div>
                ) : (
                  <input name="identifier" type="tel" className="input-junina"
                    placeholder="(21) 99999-9999"
                    value={form.identifier} onChange={handlePhone} required />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#4B1E6D' }}>Senha</label>
                <input name="password" type="password" className="input-junina"
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={form.password} onChange={handleChange} required />
              </div>

              <button type="submit" className="btn-primary mt-2" disabled={loading}>
                {loading
                  ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm"/>{mode==='login'?'Entrando...':'Criando conta...'}</span>
                  : mode === 'login' ? 'Entrar na festa 🎉' : 'Criar minha conta 🌽'
                }
              </button>
            </form>
          </div>
          <p className="text-center text-xs mt-6" style={{ color: '#C79A3B' }}>Registre seus momentos juninos 💛</p>
        </div>
      </div>
      <div className="pb-4"><Bandeirinhas /></div>
    </div>
  );
}

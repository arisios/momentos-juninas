import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Bandeirinhas from '../components/Bandeirinhas';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ instagram: '', password: '' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(form.instagram, form.password);
        toast.success(`Bem-vindo(a) de volta! ${user.emoji}`);
        navigate(user.role === 'admin' ? '/admin' : '/');
      } else {
        await register(form.instagram, form.password);
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

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-xl mb-4 animate-float"
              style={{ background: 'linear-gradient(135deg, #C21874 0%, #6F2DA8 100%)' }}>
              <span className="text-4xl">🌽</span>
            </div>
            <h1 className="font-display text-3xl font-bold" style={{ color: '#4B1E6D' }}>
              Momentos Juninas
            </h1>
            <p className="mt-1 text-sm font-medium tracking-wide uppercase" style={{ color: '#C79A3B' }}>
              Juninas do Rio · 2026
            </p>
          </div>

          {/* Card */}
          <div className="card-junina p-6">
            {/* Tabs */}
            <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(199,154,59,0.12)' }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={mode === m
                    ? { background: '#fff', color: '#4B1E6D', boxShadow: '0 2px 8px rgba(75,30,109,0.12)' }
                    : { color: '#6F2DA8' }}>
                  {m === 'login' ? 'Entrar' : 'Cadastrar'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#4B1E6D' }}>@ Instagram</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#C79A3B' }}>@</span>
                  <input name="instagram" type="text" className="input-junina pl-8"
                    placeholder="seuinstagram" value={form.instagram}
                    onChange={handleChange} required autoFocus autoCapitalize="none" autoCorrect="off" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#4B1E6D' }}>Senha</label>
                <input name="password" type="password" className="input-junina"
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={form.password} onChange={handleChange} required />
              </div>

              <button type="submit" className="btn-primary mt-2" disabled={loading}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      {mode === 'login' ? 'Entrando...' : 'Criando conta...'}
                    </span>
                  : mode === 'login' ? 'Entrar na festa 🎉' : 'Criar minha conta 🌽'
                }
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: '#C79A3B' }}>
            Registre seus momentos juninos 💛
          </p>
        </div>
      </div>

      <div className="pb-4"><Bandeirinhas /></div>
    </div>
  );
}

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
        const user = await register(form.instagram, form.password);
        toast.success(`Conta criada! Bem-vindo(a) às Juninas! 🌽`);
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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-rose-400 shadow-xl mb-4 animate-float">
              <span className="text-4xl">🌽</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-amber-900">Momentos Juninas</h1>
            <p className="text-amber-600 mt-1 text-sm font-medium tracking-wide uppercase">Juninas do Rio · 2026</p>
          </div>

          <div className="card-junina p-6">
            <div className="flex rounded-xl bg-amber-50 p-1 mb-6">
              {['login','register'].map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-white shadow-sm text-amber-900' : 'text-amber-600 hover:text-amber-900'}`}>
                  {m === 'login' ? 'Entrar' : 'Cadastrar'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1.5">@ Instagram</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-semibold text-sm">@</span>
                  <input
                    name="instagram" type="text" className="input-junina pl-8" placeholder="seuinstagram"
                    value={form.instagram} onChange={handleChange} required autoFocus autoCapitalize="none" autoCorrect="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1.5">Senha</label>
                <input
                  name="password" type="password" className="input-junina"
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={form.password} onChange={handleChange} required
                />
              </div>

              <button type="submit" className="btn-primary mt-2" disabled={loading}>
                {loading
                  ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />{mode === 'login' ? 'Entrando...' : 'Criando conta...'}</span>
                  : mode === 'login' ? 'Entrar na festa 🎉' : 'Criar minha conta 🌽'
                }
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-amber-500 mt-6">Registre seus momentos juninos 💛</p>
        </div>
      </div>

      <div className="pb-4"><Bandeirinhas /></div>
    </div>
  );
}

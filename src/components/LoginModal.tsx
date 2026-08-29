import React, { useState, useEffect } from 'react';
import { UserSession } from '../types';
import { requestAuthToken, getDiscordOAuthUrl } from '../services/api';
import { User, Shield, CheckCircle2, X, Lock, Disc as DiscordIcon, ExternalLink } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (session: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [inputUsername, setInputUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStaffAccess, setShowStaffAccess] = useState(false);
  const [staffPass, setStaffPass] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<'bakai_shuziro978' | 'Helena' | 'cyan'>('bakai_shuziro978');

  // Listen for postMessage from the Discord OAuth Popup Window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.session) {
        onLogin(event.data.session);
        onClose();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin, onClose]);

  if (!isOpen) return null;

  const handleDiscordOAuth = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { url } = await getDiscordOAuthUrl();
      const popup = window.open(url, 'discord_oauth_popup', 'width=600,height=750');

      if (!popup) {
        const nickPrompt = prompt('Sua janela popup foi bloqueada. Digite seu Usuário do Discord:');
        if (nickPrompt && nickPrompt.trim()) {
          const session = await requestAuthToken(nickPrompt.trim());
          onLogin(session);
          onClose();
        }
        return;
      }

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setIsLoading(false);
        }
      }, 1000);
    } catch {
      setError('Não foi possível iniciar a autenticação com Discord.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputUsername.trim();
    if (!cleaned) {
      setError('Por favor, informe seu Nick do Discord.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await requestAuthToken(cleaned);
      onLogin(session);
      onClose();
    } catch {
      setError('Erro ao gerar token de autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = staffPass.trim() || selectedAdmin;

    setIsLoading(true);
    try {
      const session = await requestAuthToken(val);
      onLogin({
        ...session,
        isAdmin: true,
        adminRole: val.toLowerCase() === 'helena' ? 'Helena' : val.toLowerCase() === 'cyan' ? 'cyan' : 'bakai_shuziro978',
      });
      onClose();
    } catch {
      setError('Erro ao autenticar painel da Staff.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-indigo-400">
            <DiscordIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Autenticação do Discord</h3>
            <p className="text-xs text-zinc-400">Entre com sua conta real do Discord para responder</p>
          </div>
        </div>

        {!showStaffAccess ? (
          /* Candidate Standard & OAuth Login */
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleDiscordOAuth}
              disabled={isLoading}
              className="w-full rounded-xl bg-[#5865F2] py-3 text-xs font-bold text-white hover:bg-[#4752C4] transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-900/30"
            >
              <DiscordIcon className="h-4 w-4" />
              <span>Entrar com Discord (Autorização Real)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                ou informe seu usuário
              </span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Seu Nick / Tag no Discord
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-zinc-500 font-mono font-bold">@</span>
                  <input
                    type="text"
                    value={inputUsername}
                    onChange={(e) => {
                      setInputUsername(e.target.value);
                      setError('');
                    }}
                    placeholder="seu_usuario_discord"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-8 pr-4 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none font-mono"
                  />
                </div>
                {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-zinc-800 border border-zinc-700 py-2.5 text-xs font-bold text-white hover:bg-zinc-700 transition flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Confirmar Usuário</span>
              </button>
            </form>

            <div className="pt-3 text-center border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setShowStaffAccess(true)}
                className="inline-flex items-center space-x-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition"
              >
                <Lock className="h-3 w-3" />
                <span>Acesso Painel de Administradores (Staff)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Secure Restricted Staff Access */
          <form onSubmit={handleStaffLoginSubmit} className="space-y-4">
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3.5 text-xs text-red-300 flex items-start space-x-2.5">
              <Shield className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-bold mb-0.5">Área Restrita da Administração</strong>
                <span>Esta seção é exclusiva para membros autorizados da equipe de Staff. Digite sua credencial de administrador para acessar o Painel.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Credencial de Administrador / Nick Autorizado
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  value={staffPass}
                  onChange={(e) => {
                    setStaffPass(e.target.value);
                    setError('');
                  }}
                  placeholder="Insira sua credencial de acesso..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none font-mono"
                />
              </div>
              {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition flex items-center justify-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span>Acessar Painel da Staff</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowStaffAccess(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300 underline"
              >
                Voltar para área de candidato
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

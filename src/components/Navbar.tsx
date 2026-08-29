import React from 'react';
import { UserSession } from '../types';
import { Sparkles, ShieldCheck, User, LogOut, FileText, Lock } from 'lucide-react';

interface NavbarProps {
  user: UserSession | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  onOpenDashboard: () => void;
  onOpenUserApps: () => void;
  onNewForm: () => void;
  activeView: 'form' | 'dashboard' | 'success';
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenLogin,
  onOpenDashboard,
  onOpenUserApps,
  onNewForm,
  activeView,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onNewForm}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700 text-red-500 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-white text-base">
                Formulário <span className="text-red-500">Astral</span>
              </span>
              <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-800">
                Staff Discord
              </span>
            </div>
          </div>
        </div>

        {/* User actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {user ? (
            <>
              {/* User badge */}
              <div className="hidden sm:flex items-center space-x-2 rounded-xl bg-zinc-900 px-3 py-1.5 border border-zinc-800">
                <div className={`h-2 w-2 rounded-full ${user.isAdmin ? 'bg-red-500' : 'bg-emerald-400'}`} />
                <span className="font-mono text-xs font-medium text-zinc-200">
                  @{user.discordUsername}
                </span>
                {user.isAdmin && (
                  <span className="rounded bg-red-950 px-1.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-900/60">
                    STAFF
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <button
                onClick={onOpenUserApps}
                className="flex items-center space-x-1.5 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition"
              >
                <FileText className="h-3.5 w-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Meus Envios</span>
              </button>

              {user.isAdmin ? (
                <button
                  onClick={onOpenDashboard}
                  className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeView === 'dashboard'
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 text-red-400" />
                  <span>Painel de Avaliação</span>
                </button>
              ) : (
                <button
                  onClick={onOpenDashboard}
                  className="flex items-center space-x-1.5 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 border border-zinc-800 hover:text-zinc-200 transition"
                  title="Área restrita da Staff"
                >
                  <Lock className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="hidden sm:inline">Painel Staff</span>
                </button>
              )}

              <button
                onClick={onLogout}
                className="rounded-xl bg-zinc-900 p-2 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-500 transition"
              >
                <User className="h-4 w-4" />
                <span>Identificar Nick</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

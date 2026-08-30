import React, { useState, useEffect } from 'react';
import { StaffApplication, UserSession } from './types';
import {
  getStoredApplications,
  saveApplications,
  getStoredUser,
  saveUser,
} from './utils/helpers';
import {
  fetchAllApplications,
  updateApplicationOnServer,
  deleteApplicationOnServer,
} from './services/api';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { QuestionnaireForm } from './components/QuestionnaireForm';
import { SuccessView } from './components/SuccessView';
import { Dashboard } from './components/Dashboard';
import { UserApplicationsModal } from './components/UserApplicationsModal';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserSession | null>(getStoredUser());
  const [applications, setApplications] = useState<StaffApplication[]>(getStoredApplications());
  const [activeView, setActiveView] = useState<'form' | 'dashboard' | 'success'>('form');
  const [latestSubmittedApp, setLatestSubmittedApp] = useState<StaffApplication | null>(null);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUserAppsOpen, setIsUserAppsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch latest applications from /complete route on mount & when view changes to dashboard
  const loadServerApplications = async () => {
    try {
      const serverApps = await fetchAllApplications();
      if (Array.isArray(serverApps)) {
        // Merge with local applications to make sure newly submitted apps are never dropped
        setApplications((prev) => {
          const map = new Map<string, StaffApplication>();
          // Put local apps in first
          prev.forEach((a) => map.set(a.id, a));
          // Overwrite with server apps (authoritative)
          serverApps.forEach((a) => map.set(a.id, a));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          );
          saveApplications(merged);
          return merged;
        });
      }
    } catch (err) {
      console.warn('Usando dados em cache local:', err);
    }
  };

  useEffect(() => {
    loadServerApplications();

    // Live real-time polling every 5 seconds across all devices
    const interval = setInterval(() => {
      loadServerApplications();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeView === 'dashboard') {
      loadServerApplications();
    }
  }, [activeView]);

  // Sync state changes to LocalStorage
  useEffect(() => {
    saveApplications(applications);
  }, [applications]);

  useEffect(() => {
    saveUser(user);
  }, [user]);

  const handleLogin = (session: UserSession) => {
    setUser(session);
    showToast(`Bem-vindo, @${session.discordUsername}!`);
    if (session.isAdmin) {
      setActiveView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveView('form');
    showToast('Você saiu da sua conta.');
  };

  const handleFormSubmitSuccess = (newApp: StaffApplication) => {
    setApplications((prev) => {
      const updated = [newApp, ...prev.filter((a) => a.id !== newApp.id)];
      saveApplications(updated);
      return updated;
    });
    setLatestSubmittedApp(newApp);
    setActiveView('success');
    showToast(`Formulário enviado com sucesso para o Dashboard!`);
  };

  const handleUpdateApplication = async (updatedApp: StaffApplication) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app))
    );
    showToast(`Candidatura de @${updatedApp.discordUsername} atualizada!`);
    await updateApplicationOnServer(
      updatedApp.id,
      updatedApp.status,
      updatedApp.adminNotes,
      updatedApp.reviewedBy
    );
  };

  const handleDeleteApplication = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta candidatura?')) {
      setApplications((prev) => prev.filter((app) => app.id !== id));
      showToast('Candidatura removida.');
      await deleteApplicationOnServer(id);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-red-600 selection:text-white flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <Navbar
          user={user}
          onLogout={handleLogout}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenDashboard={() => {
            if (!user) {
              setIsLoginOpen(true);
            } else if (!user.isAdmin) {
              if (confirm('Deseja acessar o painel de avaliação da Staff?')) {
                setIsLoginOpen(true);
              }
            } else {
              setActiveView('dashboard');
            }
          }}
          onOpenUserApps={() => {
            if (!user) {
              setIsLoginOpen(true);
            } else {
              setIsUserAppsOpen(true);
            }
          }}
          onNewForm={() => setActiveView('form')}
          activeView={activeView}
        />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200">
            <Sparkles className="h-4 w-4 text-red-500 animate-spin" />
            <span className="text-xs font-semibold text-white">{toastMessage}</span>
          </div>
        )}

        {/* Main Content Areas */}
        <main className="pb-12">
          {activeView === 'form' && (
            <QuestionnaireForm
              currentUser={user}
              onSubmitSuccess={handleFormSubmitSuccess}
              onOpenLogin={() => setIsLoginOpen(true)}
            />
          )}

          {activeView === 'success' && latestSubmittedApp && (
            <SuccessView
              application={latestSubmittedApp}
              onViewMyApps={() => setIsUserAppsOpen(true)}
              onNewForm={() => setActiveView('form')}
            />
          )}

          {activeView === 'dashboard' && (
            <Dashboard
              applications={applications}
              onUpdateApplication={handleUpdateApplication}
              onDeleteApplication={handleDeleteApplication}
              onOpenNewForm={() => setActiveView('form')}
              onRefresh={loadServerApplications}
              currentUsername={user?.discordUsername || 'Administração'}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-6 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">Formulário Astral</span>
            <span className="text-zinc-600">•</span>
            <span>Sistema de Recrutamento Staff Discord</span>
          </div>
          <div className="flex items-center space-x-1 text-zinc-500">
            <span>© {new Date().getFullYear()} Formulário Astral. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />

      <UserApplicationsModal
        isOpen={isUserAppsOpen}
        onClose={() => setIsUserAppsOpen(false)}
        applications={applications}
        currentDiscordNick={user?.discordUsername || ''}
      />
    </div>
  );
};

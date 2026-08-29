import React, { useState } from 'react';
import { StaffApplication, ApplicationStatus } from '../types';
import { STAFF_QUESTIONS } from '../data/questions';
import { formatDate, generateDiscordMarkdown } from '../utils/helpers';
import { submitFormToComplete } from '../services/api';
import {
  ShieldCheck,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  Trash2,
  Edit3,
  X,
  Save,
  FileText,
  Calendar,
  Send,
  UserCheck,
  RefreshCw,
  Hash,
  SendHorizontal,
} from 'lucide-react';

interface DashboardProps {
  applications: StaffApplication[];
  onUpdateApplication: (updatedApp: StaffApplication) => void;
  onDeleteApplication: (id: string) => void;
  onOpenNewForm: () => void;
  onRefresh?: () => Promise<void> | void;
  currentUsername?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  applications,
  onUpdateApplication,
  onDeleteApplication,
  onOpenNewForm,
  onRefresh,
  currentUsername = 'bakai_shuziro978',
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'bakai_shuziro978' | 'Helena' | 'cyan'>(
    (currentUsername.toLowerCase() === 'helena'
      ? 'Helena'
      : currentUsername.toLowerCase() === 'cyan'
      ? 'cyan'
      : 'bakai_shuziro978') as any
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [selectedApp, setSelectedApp] = useState<StaffApplication | null>(null);
  const [adminNotesText, setAdminNotesText] = useState('');
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [requestLogMsg, setRequestLogMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        setRequestLogMsg('Lista de formulários sincronizada com o servidor!');
      } catch (err) {
        setRequestLogMsg('Erro ao sincronizar com o servidor.');
      } finally {
        setTimeout(() => setIsRefreshing(false), 600);
      }
    }
  };

  const handleOpenDetail = (app: StaffApplication) => {
    setSelectedApp(app);
    setAdminNotesText(app.adminNotes || '');
  };

  const handleStatusChange = (app: StaffApplication, newStatus: ApplicationStatus) => {
    const updated: StaffApplication = {
      ...app,
      status: newStatus,
      reviewedBy: activeAdminTab,
      reviewedAt: new Date().toISOString(),
    };
    onUpdateApplication(updated);
    if (selectedApp && selectedApp.id === app.id) {
      setSelectedApp(updated);
    }
  };

  const handleSaveNotes = () => {
    if (!selectedApp) return;
    const updated: StaffApplication = {
      ...selectedApp,
      adminNotes: adminNotesText,
      reviewedBy: activeAdminTab,
      reviewedAt: new Date().toISOString(),
    };
    onUpdateApplication(updated);
    setSelectedApp(updated);
  };

  const handleCopyDiscord = (app: StaffApplication) => {
    const md = generateDiscordMarkdown(app);
    navigator.clipboard.writeText(md);
    setCopiedAppId(app.id);
    setTimeout(() => setCopiedAppId(null), 2500);
  };

  const handleResendToAdmins = async (app: StaffApplication) => {
    setResendingId(app.id);
    setRequestLogMsg(null);

    const detailed = STAFF_QUESTIONS.map((q) => ({
      questionId: q.id,
      questionTitle: q.title,
      answerText: app.answers[q.id] || '(Sem resposta)',
    }));

    try {
      const result = await submitFormToComplete({
        discordUsername: app.discordUsername,
        age: app.age,
        answers: app.answers,
        detailedAnswers: detailed,
        submissionId: app.submissionId || `ENV-ASTRAL-${Math.floor(10000 + Math.random() * 90000)}`,
        targetAdmins: ['bakai_shuziro978', 'Helena', 'cyan'],
      });

      setRequestLogMsg(`Requisição enviada com sucesso! ID de Envio: ${result.application.submissionId} (Direcionado para a Equipe de Administração)`);
      onUpdateApplication(result.application);
    } catch (err) {
      setRequestLogMsg('Erro ao disparar requisição para os Administradores.');
    } finally {
      setResendingId(null);
    }
  };

  // Filter logic: match search, status, and targeted admin
  const filteredApps = applications.filter((app) => {
    const matchesSearch = app.discordUsername
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim());
    const matchesStatus =
      statusFilter === 'Todos' || app.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalApps = applications.length;
  const pendentesCount = applications.filter((a) => a.status === 'Pendente').length;
  const analiseCount = applications.filter((a) => a.status === 'Em Análise').length;
  const aprovadosCount = applications.filter((a) => a.status === 'Aprovado').length;
  const rejeitadosCount = applications.filter((a) => a.status === 'Rejeitado').length;

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Aprovado':
        return (
          <span className="inline-flex items-center space-x-1 rounded-md bg-emerald-950 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-800/80">
            <CheckCircle className="h-3 w-3" />
            <span>Aprovado</span>
          </span>
        );
      case 'Rejeitado':
        return (
          <span className="inline-flex items-center space-x-1 rounded-md bg-red-950 px-2.5 py-1 text-xs font-bold text-red-400 border border-red-800/80">
            <XCircle className="h-3 w-3" />
            <span>Rejeitado</span>
          </span>
        );
      case 'Em Análise':
        return (
          <span className="inline-flex items-center space-x-1 rounded-md bg-blue-950 px-2.5 py-1 text-xs font-bold text-blue-400 border border-blue-800/80">
            <Clock className="h-3 w-3" />
            <span>Em Análise</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 rounded-md bg-amber-950 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-800/80">
            <AlertCircle className="h-3 w-3" />
            <span>Pendente</span>
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Admin Dashboard Switcher Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-lg mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-300 border border-zinc-800 mb-2">
              <ShieldCheck className="h-3.5 w-3.5 text-red-500" />
              <span>Painel Privado da Administração</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Dashboard de Avaliação de Staff
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Painel de gestão, análise e deliberação das candidaturas recebidas.
            </p>
          </div>

          {/* Admin Role Tabs */}
          <div className="flex items-center space-x-1.5 bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800">
            {[
              { id: 'bakai_shuziro978', label: 'Supervisão Staff' },
              { id: 'Helena', label: 'Moderação Sênior' },
              { id: 'cyan', label: 'Administração Geral' },
            ].map((adm) => (
              <button
                key={adm.id}
                onClick={() => setActiveAdminTab(adm.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center space-x-1 ${
                  activeAdminTab === adm.id
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <UserCheck className="h-3 w-3" />
                <span>{adm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {requestLogMsg && (
          <div className="mt-4 rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-3 text-xs text-emerald-300 font-mono flex items-center justify-between">
            <span>{requestLogMsg}</span>
            <button onClick={() => setRequestLogMsg(null)} className="text-emerald-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* KPI Counter Cards */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Geral</span>
            <p className="text-xl font-mono font-bold text-white mt-0.5">{totalApps}</p>
          </div>
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pendentes</span>
            <p className="text-xl font-mono font-bold text-amber-400 mt-0.5">{pendentesCount}</p>
          </div>
          <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-3">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Em Análise</span>
            <p className="text-xl font-mono font-bold text-blue-400 mt-0.5">{analiseCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Aprovados</span>
            <p className="text-xl font-mono font-bold text-emerald-400 mt-0.5">{aprovadosCount}</p>
          </div>
          <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Rejeitados</span>
            <p className="text-xl font-mono font-bold text-red-400 mt-0.5">{rejeitadosCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nick do Discord..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-xs font-mono text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs & Sync Button */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['Todos', 'Pendente', 'Em Análise', 'Aprovado', 'Rejeitado'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {st}
            </button>
          ))}

          {onRefresh && (
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition disabled:opacity-50"
              title="Sincronizar formulários em tempo real com o servidor"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-red-500' : 'text-zinc-400'}`} />
              <span>{isRefreshing ? 'Sincronizando...' : 'Atualizar'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Applications Grid */}
      {filteredApps.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
          <h3 className="text-base font-bold text-white">Nenhum formulário cadastrado no momento</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1.5">
            {applications.length === 0
              ? 'Nenhuma candidatura foi enviada ainda. Os novos envios das 10 perguntas chegarão diretamente a este painel em tempo real.'
              : 'Não há formulários correspondentes aos filtros de pesquisa atuais.'}
          </p>
          {applications.length === 0 && (
            <button
              onClick={onOpenNewForm}
              className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition shadow-lg"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Abrir Formulário de Envio</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm hover:border-zinc-700 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-white flex items-center space-x-1">
                      <span>@{app.discordUsername}</span>
                    </h3>
                    <span className="text-[11px] text-zinc-500">Idade: {app.age} anos</span>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                {/* ID de Envio Tag */}
                <div className="mb-2.5 inline-flex items-center space-x-1 rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-800">
                  <Hash className="h-3 w-3 text-red-500" />
                  <span>ID de Envio: <strong className="text-white">{app.submissionId || app.id}</strong></span>
                </div>

                <div className="my-2 rounded-xl bg-zinc-900 p-3 text-xs text-zinc-300 border border-zinc-800/80 line-clamp-3">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                    Motivação (Pergunta #5):
                  </span>
                  {app.answers[5] || 'Sem resposta'}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-900 pt-2.5 mt-2">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-zinc-600" />
                    <span>{formatDate(app.submittedAt)}</span>
                  </span>
                  <span className="font-mono text-zinc-500 text-[10px]">Avaliação Staff</span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDetail(app)}
                    className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-500 transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Ver Respostas</span>
                  </button>

                  <button
                    onClick={() => handleResendToAdmins(app)}
                    disabled={resendingId === app.id}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition disabled:opacity-50"
                    title="Disparar Requisição para Admins"
                  >
                    <SendHorizontal className="h-3.5 w-3.5 text-indigo-400" />
                  </button>

                  <button
                    onClick={() => handleCopyDiscord(app)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition"
                    title="Copiar Texto Discord"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteApplication(app.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 transition"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM DETAIL MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative my-6 w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 right-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-5 mb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-mono text-lg font-bold text-white">
                    @{selectedApp.discordUsername}
                  </h2>
                  {getStatusBadge(selectedApp.status)}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
                  <span>Idade: <strong className="text-white">{selectedApp.age} anos</strong></span>
                  <span>•</span>
                  <span className="font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    ID de Envio: <strong className="text-red-400">{selectedApp.submissionId || selectedApp.id}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleResendToAdmins(selectedApp)}
                  className="flex items-center space-x-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition"
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                  <span>Enviar Requisição Admin</span>
                </button>

                <button
                  onClick={() => handleCopyDiscord(selectedApp)}
                  className="flex items-center space-x-1.5 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition"
                >
                  <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{copiedAppId === selectedApp.id ? 'Copiado!' : 'Copiar Discord'}</span>
                </button>
              </div>
            </div>

            {/* Target Admins Tag */}
            <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Direcionamento da Requisição:</span>
              <div className="flex space-x-1.5 font-mono font-bold text-xs text-white">
                <span className="bg-zinc-800 px-2.5 py-0.5 rounded text-red-400">Equipe de Administração Staff</span>
              </div>
            </div>

            {/* Status Controls */}
            <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">
                Alterar Status da Candidatura
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange(selectedApp, 'Aprovado')}
                  className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    selectedApp.status === 'Aprovado'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-900 text-emerald-400 border border-emerald-900/60 hover:bg-emerald-950'
                  }`}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Aprovar Candidato</span>
                </button>

                <button
                  onClick={() => handleStatusChange(selectedApp, 'Em Análise')}
                  className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    selectedApp.status === 'Em Análise'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-900 text-blue-400 border border-blue-900/60 hover:bg-blue-950'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Em Análise</span>
                </button>

                <button
                  onClick={() => handleStatusChange(selectedApp, 'Rejeitado')}
                  className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    selectedApp.status === 'Rejeitado'
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-900 text-red-400 border border-red-900/60 hover:bg-red-950'
                  }`}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Rejeitar Candidato</span>
                </button>

                <button
                  onClick={() => handleStatusChange(selectedApp, 'Pendente')}
                  className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    selectedApp.status === 'Pendente'
                      ? 'bg-amber-600 text-white'
                      : 'bg-zinc-900 text-amber-400 border border-amber-900/60 hover:bg-amber-950'
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Pendente</span>
                </button>
              </div>
            </div>

            {/* ADMIN NOTES */}
            <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  <Edit3 className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Anotações do Administrador (@{activeAdminTab})</span>
                </div>
                <button
                  onClick={handleSaveNotes}
                  className="flex items-center space-x-1 rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-500 transition"
                >
                  <Save className="h-3 w-3" />
                  <span>Salvar Anotação</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={adminNotesText}
                onChange={(e) => setAdminNotesText(e.target.value)}
                placeholder="Adicione observações adicionais sobre o candidato..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Questions & Answers vinculados por ID */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">
                Respostas das Perguntas (Com ID da Pergunta)
              </h3>

              {STAFF_QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3.5"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="flex h-5 px-2 items-center justify-center rounded bg-zinc-800 font-mono text-[10px] font-bold text-red-400 border border-zinc-700">
                      ID #{q.id}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-200">{q.title}</h4>
                  </div>
                  <div className="mt-1.5 rounded-lg bg-zinc-950 p-2.5 text-xs text-zinc-300 leading-relaxed border border-zinc-900">
                    {selectedApp.answers[q.id] || (
                      <span className="text-zinc-600 italic">Sem resposta</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

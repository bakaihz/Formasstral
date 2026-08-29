import React from 'react';
import { StaffApplication, ApplicationStatus } from '../types';
import { formatDate } from '../utils/helpers';
import { X, FileText, CheckCircle, Clock, XCircle, AlertCircle, MessageSquare, Shield } from 'lucide-react';

interface UserApplicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: StaffApplication[];
  currentDiscordNick: string;
}

export const UserApplicationsModal: React.FC<UserApplicationsModalProps> = ({
  isOpen,
  onClose,
  applications,
  currentDiscordNick,
}) => {
  if (!isOpen) return null;

  const userApps = applications.filter(
    (a) => a.discordUsername.toLowerCase() === currentDiscordNick.toLowerCase()
  );

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Aprovado':
        return (
          <span className="inline-flex items-center space-x-1 rounded-md bg-emerald-950 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-800">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>APROVADO</span>
          </span>
        );
      case 'Rejeitado':
        return (
          <span className="inline-flex items-center space-x-1 rounded-md bg-red-950 px-2.5 py-1 text-xs font-bold text-red-400 border border-red-800">
            <XCircle className="h-3.5 w-3.5" />
            <span>REJEITADO</span>
          </span>
        );
      case 'Em Análise':
        return (
          <span className="inline-flex items-center space-x-1 rounded-md bg-blue-950 px-2.5 py-1 text-xs font-bold text-blue-400 border border-blue-800">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span>EM ANÁLISE</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 rounded-md bg-amber-950 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-800">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>PENDENTE</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-red-500">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Meus Formulários Enviados</h2>
            <p className="text-xs text-zinc-400">
              Histórico de envios para <span className="text-white font-mono font-bold">@{currentDiscordNick}</span>
            </p>
          </div>
        </div>

        {userApps.length === 0 ? (
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-8 text-center">
            <Shield className="mx-auto h-9 w-9 text-zinc-600 mb-2" />
            <p className="text-sm font-semibold text-zinc-300">Nenhum formulário encontrado para este nick.</p>
            <p className="text-xs text-zinc-500 mt-1">
              Preencha as 10 perguntas na tela principal para enviar sua candidatura à equipe de Staff.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userApps.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                  <div>
                    <span className="font-mono text-xs font-bold text-zinc-300">ID: {app.id}</span>
                    <span className="text-[11px] text-zinc-500 block">Enviado em {formatDate(app.submittedAt)}</span>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                {app.adminNotes && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
                    <span className="font-bold text-zinc-300 flex items-center space-x-1 mb-1">
                      <MessageSquare className="h-3.5 w-3.5 text-red-400" />
                      <span>Observação da Staff:</span>
                    </span>
                    <p className="text-zinc-300">{app.adminNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { StaffApplication } from '../types';
import confetti from 'canvas-confetti';
import { CheckCircle2, Copy, FileText, Sparkles } from 'lucide-react';
import { formatDate, generateDiscordMarkdown } from '../utils/helpers';

interface SuccessViewProps {
  application: StaffApplication;
  onViewMyApps: () => void;
  onNewForm: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  application,
  onViewMyApps,
  onNewForm,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#dc2626', '#ffffff', '#52525b'],
      });
    } catch {
      // Ignore
    }
  }, []);

  const handleCopyDiscord = () => {
    const text = generateDiscordMarkdown(application);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-lg">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-700 text-red-500 shadow-sm">
          <CheckCircle2 className="h-8 w-8 text-red-500" />
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Formulário Enviado com Sucesso!
        </h2>
        <p className="mt-2 text-xs text-zinc-400 max-w-sm mx-auto">
          Suas respostas foram entregues e estão disponíveis para avaliação da equipe de Staff.
        </p>

        {/* Ticket receipt */}
        <div className="my-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-left text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500">ID de Protocolo</span>
              <p className="font-mono text-sm font-bold text-white">{application.id}</p>
            </div>
            <div>
              <span className="inline-block rounded-md bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-amber-400 border border-zinc-700">
                PENDENTE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block">Discord:</span>
              <span className="font-mono text-zinc-200 font-bold">@{application.discordUsername}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Idade:</span>
              <span className="text-zinc-200 font-bold">{application.age} anos</span>
            </div>
            <div className="col-span-2">
              <span className="text-zinc-500 block">Data de Envio:</span>
              <span className="text-zinc-200">{formatDate(application.submittedAt)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            onClick={handleCopyDiscord}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition"
          >
            <Copy className="h-3.5 w-3.5 text-zinc-400" />
            <span>{copied ? 'Copiado para o Discord!' : 'Copiar Resumo em Texto'}</span>
          </button>

          <button
            onClick={onViewMyApps}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition shadow-sm"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Ver Meus Envios</span>
          </button>
        </div>

        <div className="mt-5">
          <button
            onClick={onNewForm}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline"
          >
            Enviar outro formulário
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { StaffApplication, UserSession } from '../types';
import { STAFF_QUESTIONS } from '../data/questions';
import { submitFormToComplete } from '../services/api';
import {
  Send,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  User,
  ShieldCheck,
  List,
  Layers,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface QuestionnaireFormProps {
  currentUser: UserSession | null;
  onSubmitSuccess: (app: StaffApplication) => void;
  onOpenLogin: () => void;
}

export const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({
  currentUser,
  onSubmitSuccess,
  onOpenLogin,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'step' | 'all'>('step');
  const [discordNickInput, setDiscordNickInput] = useState<string>(
    currentUser?.discordUsername || ''
  );
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveUsername = currentUser?.discordUsername || discordNickInput.trim();

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      delete copy['username'];
      return copy;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!effectiveUsername) {
      newErrors['username'] = 'Informe seu nick do Discord antes de enviar.';
    }

    STAFF_QUESTIONS.forEach((q) => {
      const val = answers[q.id]?.trim();
      if (q.required && !val) {
        newErrors[q.id] = 'Esta pergunta é obrigatória.';
      }
      if (q.id === 1 && val) {
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 10 || num > 99) {
          newErrors[1] = 'Informe uma idade válida (ex: 17).';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrKey = Object.keys(errors)[0];
      if (firstErrKey && !isNaN(Number(firstErrKey))) {
        setCurrentStep(Number(firstErrKey) - 1);
      }
      return;
    }

    const ageNum = parseInt(answers[1] || '16', 10);
    setIsSubmitting(true);

    // Build structured question answer array with IDs
    const detailedAnswers = STAFF_QUESTIONS.map((q) => ({
      questionId: q.id,
      questionTitle: q.title,
      answerText: answers[q.id] || '(Sem resposta)',
    }));

    // Generate Submission ID
    const generatedSubmissionId = `ENV-ASTRAL-${Math.floor(10000 + Math.random() * 90000)}`;
    const targetAdminsList = ['bakai_shuziro978', 'Helena', 'cyan'];

    try {
      const result = await submitFormToComplete({
        discordUsername: effectiveUsername,
        age: isNaN(ageNum) ? 16 : ageNum,
        answers,
        detailedAnswers,
        submissionId: generatedSubmissionId,
        targetAdmins: targetAdminsList,
        authToken: currentUser?.token,
      });

      onSubmitSuccess(result.application);
    } catch (err) {
      console.error('Erro no envio do formulário:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = STAFF_QUESTIONS[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / STAFF_QUESTIONS.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-300 border border-zinc-800 mb-2">
              <ShieldCheck className="h-3.5 w-3.5 text-red-500" />
              <span>Recrutamento Staff Discord</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Formulário <span className="text-red-500">Astral</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Responda às 10 perguntas com atenção. Suas respostas serão enviadas para avaliação da Staff.
            </p>
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'step' ? 'all' : 'step')}
            className="self-start sm:self-auto flex items-center space-x-2 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition"
          >
            {viewMode === 'step' ? (
              <>
                <List className="h-3.5 w-3.5 text-zinc-400" />
                <span>Ver todas em 1 página</span>
              </>
            ) : (
              <>
                <Layers className="h-3.5 w-3.5 text-zinc-400" />
                <span>Modo Passo a Passo</span>
              </>
            )}
          </button>
        </div>

        {/* Discord User Input Bar */}
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Seu Usuário do Discord
                </span>
                {currentUser ? (
                  <span className="font-mono text-xs font-bold text-white">
                    @{currentUser.discordUsername}
                  </span>
                ) : (
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-zinc-500 font-mono text-xs">@</span>
                    <input
                      type="text"
                      value={discordNickInput}
                      onChange={(e) => {
                        setDiscordNickInput(e.target.value);
                        setErrors((prev) => ({ ...prev, username: '' }));
                      }}
                      placeholder="digite_seu_nick"
                      className="rounded-lg border border-zinc-700 bg-zinc-950 py-1 px-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
                    />
                    <button
                      onClick={onOpenLogin}
                      className="text-xs text-zinc-400 hover:text-white underline font-medium"
                    >
                      Ou entrar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {errors['username'] && (
            <p className="mt-2 text-xs text-red-400 font-medium flex items-center space-x-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{errors['username']}</span>
            </p>
          )}
        </div>
      </div>

      {/* Step Mode Navigation Bar */}
      {viewMode === 'step' && currentStep < STAFF_QUESTIONS.length && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">
              Pergunta {currentStep + 1} de {STAFF_QUESTIONS.length}
            </span>
            <span className="font-mono text-xs text-zinc-400 font-semibold">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Direct Question Selector Pills */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {STAFF_QUESTIONS.map((q, idx) => {
              const isAnswered = !!answers[q.id]?.trim();
              const isCurrent = currentStep === idx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-mono font-semibold transition ${
                    isCurrent
                      ? 'bg-red-600 text-white font-bold shadow-sm'
                      : isAnswered
                      ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
                  }`}
                  title={`Pergunta ${q.id}: ${q.title}`}
                >
                  {q.id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP MODE VIEW */}
      {viewMode === 'step' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-lg">
          {currentStep < STAFF_QUESTIONS.length && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 font-mono text-xs font-bold text-zinc-300 border border-zinc-800">
                    #{currentQ.id}
                  </span>
                  <span className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider">
                    {currentQ.required ? 'Obrigatória' : 'Opcional'}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">{currentQ.title}</h2>
                {currentQ.subtitle && (
                  <p className="mt-1 text-xs text-zinc-400">{currentQ.subtitle}</p>
                )}
              </div>

              {/* Input Render */}
              <div>
                {currentQ.type === 'number' && (
                  <div className="max-w-xs">
                    <input
                      type="number"
                      min="10"
                      max="99"
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      placeholder={currentQ.placeholder}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 px-3.5 text-white font-mono text-sm focus:border-red-500 focus:outline-none"
                    />
                  </div>
                )}

                {currentQ.type === 'select' && (
                  <div className="space-y-2">
                    {currentQ.options?.map((opt) => {
                      const selected = answers[currentQ.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleAnswerChange(currentQ.id, opt)}
                          className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left text-xs sm:text-sm font-medium transition ${
                            selected
                              ? 'border-red-600 bg-red-950/30 text-white'
                              : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-900'
                          }`}
                        >
                          <span>{opt}</span>
                          {selected && <CheckCircle className="h-4 w-4 text-red-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQ.type === 'textarea' && (
                  <div>
                    <textarea
                      rows={5}
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      placeholder={currentQ.placeholder}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                )}

                {errors[currentQ.id] && (
                  <p className="mt-2 text-xs text-red-400 font-medium flex items-center space-x-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{errors[currentQ.id]}</span>
                  </p>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-1 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-400 border border-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </button>

                {currentStep < STAFF_QUESTIONS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentQ.required && !answers[currentQ.id]?.trim()) {
                        setErrors({ [currentQ.id]: 'Responda a pergunta para avançar.' });
                        return;
                      }
                      setCurrentStep((prev) => prev + 1);
                    }}
                    className="flex items-center space-x-1 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-500 transition"
                  >
                    <span>Próxima</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>{isSubmitting ? 'Enviando...' : 'Enviar Formulário'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALL QUESTIONS SINGLE PAGE VIEW */}
      {viewMode === 'all' && (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          {STAFF_QUESTIONS.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm"
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-900 font-mono text-[11px] font-bold text-zinc-300 border border-zinc-800">
                  #{q.id}
                </span>
                <h3 className="text-sm font-bold text-white">{q.title}</h3>
              </div>
              {q.subtitle && <p className="text-xs text-zinc-400 mb-3">{q.subtitle}</p>}

              {q.type === 'number' && (
                <input
                  type="number"
                  min="10"
                  max="99"
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full max-w-xs rounded-xl border border-zinc-800 bg-zinc-900 py-2 px-3 text-white font-mono text-xs focus:border-red-500 focus:outline-none"
                />
              )}

              {q.type === 'select' && (
                <select
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 px-3 text-white text-xs focus:border-red-500 focus:outline-none"
                >
                  <option value="">Selecione uma opção...</option>
                  {q.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {q.type === 'textarea' && (
                <textarea
                  rows={3}
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none leading-relaxed"
                />
              )}

              {errors[q.id] && (
                <p className="mt-1 text-xs text-red-400 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors[q.id]}</span>
                </p>
              )}
            </div>
          ))}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 rounded-xl bg-red-600 px-6 py-3 text-xs font-bold text-white hover:bg-red-500 transition shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{isSubmitting ? 'Enviando ao servidor...' : 'Enviar Formulário Astral'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

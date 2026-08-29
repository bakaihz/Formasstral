import { StaffApplication, UserSession } from '../types';
import { STAFF_QUESTIONS } from '../data/questions';

const STORAGE_KEY_APPS = 'formulario_astral_applications_v4';
const STORAGE_KEY_USER = 'formulario_astral_user_v4';

export function getStoredApplications(): StaffApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading applications from localStorage:', err);
    return [];
  }
}

export function saveApplications(apps: StaffApplication[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(apps || []));
  } catch (err) {
    console.error('Error saving applications to localStorage:', err);
  }
}

export function getStoredUser(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function saveUser(user: UserSession | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY_USER);
    } else {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Error saving user to localStorage:', err);
  }
}

export function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

export function generateDiscordMarkdown(app: StaffApplication): string {
  let md = `**✦ FORMULÁRIO ASTRAL - CANDIDATURA STAFF ✦**\n`;
  md += `**Candidato:** @${app.discordUsername} (ID: ${app.id})\n`;
  md += `**Idade:** ${app.age} anos\n`;
  md += `**Data de Envio:** ${formatDate(app.submittedAt)}\n`;
  md += `**Status Atual:** \`${app.status.toUpperCase()}\`\n\n`;
  md += `**=== RESPOSTAS DAS 10 PERGUNTAS ===**\n`;

  STAFF_QUESTIONS.forEach((q) => {
    const ans = app.answers[q.id] || 'Sem resposta';
    md += `\n**[Q${q.id}] ${q.title}**\n> ${ans}\n`;
  });

  if (app.adminNotes) {
    md += `\n**📝 ANOTAÇÕES DE STAFF:**\n> ${app.adminNotes}\n`;
  }

  return md;
}

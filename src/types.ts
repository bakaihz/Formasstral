export type ApplicationStatus = 'Pendente' | 'Em Análise' | 'Aprovado' | 'Rejeitado';

export const ADMIN_USERS = ['bakai_shuziro978', 'Helena', 'cyan'] as const;
export type AdminUser = (typeof ADMIN_USERS)[number];

export interface Question {
  id: number;
  title: string;
  subtitle?: string;
  type: 'text' | 'number' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
  required: boolean;
}

export interface QuestionAnswerItem {
  questionId: number;
  questionTitle: string;
  answerText: string;
}

export interface StaffApplication {
  id: string;
  submissionId: string; // ID de Envio único
  discordUsername: string;
  discordId?: string;
  discordAvatar?: string;
  discordGlobalName?: string;
  age: number;
  submittedAt: string;
  status: ApplicationStatus;
  answers: Record<number, string>; // { [questionId]: answer }
  detailedAnswers?: QuestionAnswerItem[]; // Array estruturado com questionId e título
  targetAdmins?: string[]; // Admins destinados (bakai_shuziro978, Helena, cyan)
  adminNotes: string;
  reviewedBy?: string;
  reviewedAt?: string;
  authToken?: string;
}

export interface UserSession {
  discordUsername: string;
  discordId?: string;
  discordAvatar?: string;
  discordGlobalName?: string;
  isAdmin: boolean;
  adminRole?: AdminUser | string;
  token: string;
}

import { StaffApplication, ApplicationStatus, UserSession, QuestionAnswerItem } from '../types';

const ADMIN_LIST = ['bakai_shuziro978', 'helena', 'cyan'];

export async function requestAuthToken(discordUsername: string): Promise<UserSession> {
  const clean = discordUsername.trim();
  const lower = clean.toLowerCase();
  const isAdmin = ADMIN_LIST.includes(lower);
  let adminRole: string | undefined = undefined;
  if (lower === 'helena') adminRole = 'Helena';
  else if (lower === 'cyan') adminRole = 'cyan';
  else if (lower === 'bakai_shuziro978') adminRole = 'bakai_shuziro978';

  try {
    const res = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordUsername: clean }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        discordUsername: data.discordUsername || clean,
        isAdmin: data.isAdmin ?? isAdmin,
        adminRole: data.adminRole || adminRole,
        token: data.token,
      };
    }
  } catch (err) {
    console.warn('Servidor indisponível para /api/auth/token, usando gerador local:', err);
  }

  return {
    discordUsername: clean,
    isAdmin,
    adminRole,
    token: `astral_tok_${Math.random().toString(36).substring(2)}_${Date.now()}`,
  };
}

export async function getDiscordOAuthUrl(customClientId?: string): Promise<{ url: string; isRealOAuth: boolean }> {
  try {
    const fetchUrl = customClientId
      ? `/api/auth/discord/url?client_id=${encodeURIComponent(customClientId)}`
      : '/api/auth/discord/url';
    const res = await fetch(fetchUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return { url: data.url, isRealOAuth: !!data.isRealOAuth };
      }
    }
  } catch (err) {
    console.warn('Erro ao obter URL do Discord OAuth:', err);
  }
  const appOrigin = window.location.origin;
  return {
    url: customClientId
      ? `https://discord.com/oauth2/authorize?client_id=${customClientId}&redirect_uri=${encodeURIComponent(appOrigin + '/api/auth/discord/callback')}&response_type=code&scope=identify`
      : `${appOrigin}/api/auth/discord/demo-login`,
    isRealOAuth: !!customClientId,
  };
}

export async function submitFormToComplete(payload: {
  discordUsername: string;
  discordId?: string;
  discordAvatar?: string;
  discordGlobalName?: string;
  age: number;
  answers: Record<number, string>;
  detailedAnswers?: QuestionAnswerItem[];
  submissionId?: string;
  targetAdmins?: string[];
  authToken?: string;
}): Promise<{ application: StaffApplication; token: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (payload.authToken) {
    headers['Authorization'] = `Bearer ${payload.authToken}`;
  }

  const generatedSubId = payload.submissionId || `ENV-ASTRAL-${Math.floor(10000 + Math.random() * 90000)}`;
  const defaultTargetAdmins = payload.targetAdmins || ['bakai_shuziro978', 'Helena', 'cyan'];

  const fullPayload = {
    ...payload,
    submissionId: generatedSubId,
    targetAdmins: defaultTargetAdmins,
  };

  // Try /complete first, then /api/complete as fallback endpoint
  const endpoints = ['/complete', '/api/complete'];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(fullPayload),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          application: data.application,
          token: data.token || payload.authToken || 'tok_success',
        };
      }
    } catch (e) {
      console.warn(`Tentativa em ${url} falhou, tentando próximo endpoint...`);
    }
  }

  // Fallback if both remote endpoints returned error / 404
  const localApp: StaffApplication = {
    id: `astral-${Math.floor(1000 + Math.random() * 9000)}`,
    submissionId: generatedSubId,
    discordUsername: payload.discordUsername,
    discordId: payload.discordId || '',
    discordAvatar: payload.discordAvatar || '',
    discordGlobalName: payload.discordGlobalName || payload.discordUsername,
    age: payload.age,
    submittedAt: new Date().toISOString(),
    status: 'Pendente',
    answers: payload.answers,
    detailedAnswers: payload.detailedAnswers || [],
    targetAdmins: defaultTargetAdmins,
    adminNotes: '',
    authToken: payload.authToken || `astral_local_${Date.now()}`,
  };

  return { application: localApp, token: localApp.authToken || 'local_fallback' };
}

export async function fetchAllApplications(): Promise<StaffApplication[]> {
  const endpoints = ['/complete', '/api/complete'];
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.applications && Array.isArray(data.applications)) {
          return data.applications;
        }
      }
    } catch (err) {
      // Continue to next endpoint
    }
  }
  return [];
}

export async function updateApplicationOnServer(
  id: string,
  status: ApplicationStatus,
  adminNotes?: string,
  reviewedBy?: string
): Promise<StaffApplication | null> {
  const endpoints = [`/complete/${id}`, `/api/complete/${id}`];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes, reviewedBy }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.application;
      }
    } catch (err) {
      // Continue to next
    }
  }
  return null;
}

export async function deleteApplicationOnServer(id: string): Promise<boolean> {
  const endpoints = [`/complete/${id}`, `/api/complete/${id}`];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) return true;
    } catch (err) {
      // Continue
    }
  }
  return false;
}

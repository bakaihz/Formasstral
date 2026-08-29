import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for cross-origin and Vercel deployments
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Admin Username List
const ADMIN_LIST = ['bakai_shuziro978', 'helena', 'cyan'];

// Helper to check if nick is admin
function isNickAdmin(nick: string): { isAdmin: boolean; adminRole: string | null } {
  const clean = (nick || '').trim().toLowerCase();
  if (ADMIN_LIST.includes(clean)) {
    let roleName = 'bakai_shuziro978';
    if (clean === 'helena') roleName = 'Helena';
    if (clean === 'cyan') roleName = 'cyan';
    if (clean === 'bakai_shuziro978') roleName = 'bakai_shuziro978';
    return { isAdmin: true, adminRole: roleName };
  }
  return { isAdmin: false, adminRole: null };
}

// In-Memory Applications Store (100% Real Submissions)
let applications: any[] = [];

// Active Auth Tokens Map
const activeTokens = new Map<string, { discordUsername: string; isAdmin: boolean; adminRole?: string | null; createdAt: string }>();

// Seed default admin tokens
activeTokens.set('astral_tok_admin_bakai', {
  discordUsername: 'bakai_shuziro978',
  isAdmin: true,
  adminRole: 'bakai_shuziro978',
  createdAt: new Date().toISOString(),
});
activeTokens.set('astral_tok_admin_helena', {
  discordUsername: 'Helena',
  isAdmin: true,
  adminRole: 'Helena',
  createdAt: new Date().toISOString(),
});
activeTokens.set('astral_tok_admin_cyan', {
  discordUsername: 'cyan',
  isAdmin: true,
  adminRole: 'cyan',
  createdAt: new Date().toISOString(),
});

// Helper to generate auth token
function generateAuthToken(discordUsername: string, isAdmin: boolean = false, adminRole: string | null = null): string {
  const random = crypto.randomBytes(16).toString('hex');
  const token = `astral_tok_${random}`;
  activeTokens.set(token, {
    discordUsername,
    isAdmin,
    adminRole,
    createdAt: new Date().toISOString(),
  });
  return token;
}

// AUTH API: Generate User Auth Token
app.post('/api/auth/token', (req, res) => {
  const { discordUsername } = req.body;
  if (!discordUsername || typeof discordUsername !== 'string' || !discordUsername.trim()) {
    return res.status(400).json({ error: 'Nick do Discord é obrigatório.' });
  }

  const cleanNick = discordUsername.trim();
  const { isAdmin, adminRole } = isNickAdmin(cleanNick);
  const token = generateAuthToken(cleanNick, isAdmin, adminRole);

  return res.json({
    success: true,
    token,
    discordUsername: cleanNick,
    isAdmin,
    adminRole,
  });
});

// DISCORD OAUTH URL API
app.get('/api/auth/discord/url', (req, res) => {
  const customClientId = req.query.client_id as string;
  const clientId = customClientId || process.env.DISCORD_CLIENT_ID || '';
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${appUrl}/api/auth/discord/callback`;

  if (clientId) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify email',
      prompt: 'consent',
    });
    return res.json({
      success: true,
      url: `https://discord.com/oauth2/authorize?${params.toString()}`,
      redirectUri,
      isRealOAuth: true,
    });
  }

  // Fallback interactive OAuth screen if Client ID is not configured
  return res.json({
    success: true,
    url: `${appUrl}/api/auth/discord/demo-login`,
    redirectUri,
    isRealOAuth: false,
  });
});

// DISCORD OAUTH SIMULATED CONSENT SCREEN (If no Client ID configured in env)
app.get('/api/auth/discord/demo-login', (req, res) => {
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const callbackUrl = `${appUrl}/api/auth/discord/callback`;

  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Autorizar Acesso - Discord</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          background-color: #313338;
          color: #f2f3f5;
          font-family: 'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          background-color: #2b2d31;
          width: 100%;
          max-width: 440px;
          border-radius: 8px;
          padding: 32px 24px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.24);
          box-sizing: border-box;
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
        }
        .discord-logo {
          width: 48px;
          height: 48px;
          background-color: #5865f2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .discord-logo svg {
          fill: #ffffff;
          width: 28px;
          height: 28px;
        }
        h1 {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 8px;
          color: #ffffff;
        }
        p.subtitle {
          font-size: 14px;
          color: #b5bac1;
          margin: 0;
        }
        .app-card {
          background-color: #1e1f22;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .app-icon {
          width: 40px;
          height: 40px;
          background-color: #dc2626;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
          color: #fff;
        }
        .permissions {
          margin: 20px 0;
        }
        .permissions h3 {
          font-size: 12px;
          text-transform: uppercase;
          color: #b5bac1;
          letter-spacing: 0.5px;
          margin: 0 0 12px;
        }
        .perm-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 12px;
          font-size: 14px;
          color: #dbdee1;
        }
        .perm-icon {
          color: #23a55a;
          font-weight: bold;
        }
        .input-group {
          margin-bottom: 20px;
        }
        .input-group label {
          display: block;
          font-size: 12px;
          text-transform: uppercase;
          color: #b5bac1;
          margin-bottom: 8px;
          font-weight: 700;
        }
        .input-group input {
          width: 100%;
          background-color: #1e1f22;
          border: 1px solid #383a40;
          border-radius: 4px;
          padding: 10px;
          color: #fff;
          font-size: 14px;
          box-sizing: border-box;
          outline: none;
        }
        .input-group input:focus {
          border-color: #5865f2;
        }
        .actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        .btn {
          flex: 1;
          padding: 12px;
          border-radius: 3px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background-color 0.17s ease;
        }
        .btn-cancel {
          background-color: transparent;
          color: #ffffff;
        }
        .btn-cancel:hover {
          text-decoration: underline;
        }
        .btn-authorize {
          background-color: #5865f2;
          color: #ffffff;
        }
        .btn-authorize:hover {
          background-color: #4752c4;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="discord-logo">
            <svg viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a73.57,73.57,0,0,0,64.32,0c.87.68,1.76,1.36,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.91-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.87,53,48.73,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.1,53,91,65.69,84.69,65.69Z"/>
            </svg>
          </div>
          <h1>Autorização do Discord</h1>
          <p class="subtitle">Conecte sua conta para continuar no Formulário Astral</p>
        </div>

        <div class="app-card">
          <div class="app-icon">FA</div>
          <div>
            <strong style="color: #fff; font-size: 15px;">Formulário Astral</strong>
            <div style="font-size: 12px; color: #b5bac1;">solicita acesso à sua conta</div>
          </div>
        </div>

        <div class="permissions">
          <h3>Isso permitirá que o aplicativo:</h3>
          <div class="perm-item">
            <span class="perm-icon">✓</span>
            <span>Acesse seu nome de usuário, avatar e ID do Discord</span>
          </div>
          <div class="perm-item">
            <span class="perm-icon">✓</span>
            <span>Verifique sua identidade para o processo seletivo de Staff</span>
          </div>
          <div class="perm-item">
            <span class="perm-icon">✓</span>
            <span>Anexe suas respostas do formulário diretamente à sua conta</span>
          </div>
        </div>

        <form action="${callbackUrl}" method="GET">
          <div class="input-group">
            <label for="username">Sua Conta / Nick do Discord</label>
            <input type="text" id="username" name="discordUsername" value="kaito_astral" placeholder="seu_usuario" required />
          </div>

          <div class="actions">
            <button type="button" class="btn btn-cancel" onclick="window.close()">Cancelar</button>
            <button type="submit" class="btn btn-authorize">Autorizar Acesso</button>
          </div>
        </form>
      </div>
    </body>
    </html>
  `);
});

// DISCORD OAUTH CALLBACK API ROUTE
app.get('/api/auth/discord/callback', async (req, res) => {
  const code = req.query.code as string;
  let discordUsername = (req.query.discordUsername as string) || '';
  let discordId = (req.query.discordId as string) || '';
  let discordAvatar = '';
  let discordGlobalName = '';

  const clientId = process.env.DISCORD_CLIENT_ID || '';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${appUrl}/api/auth/discord/callback`;

  // If real authorization code received and credentials exist, exchange with Discord API
  if (code && clientId && clientSecret) {
    try {
      const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        const access_token = tokenData.access_token;

        // Get Real User Profile from Discord
        const userRes = await fetch('https://discord.com/api/v10/users/@me', {
          headers: { Authorization: `Bearer ${access_token}` },
        });

        if (userRes.ok) {
          const profile = await userRes.json();
          discordUsername = profile.username || profile.id;
          if (profile.discriminator && profile.discriminator !== '0') {
            discordUsername = `${profile.username}#${profile.discriminator}`;
          }
          discordId = profile.id || '';
          discordGlobalName = profile.global_name || profile.username || '';
          if (profile.avatar) {
            discordAvatar = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
          }
        }
      }
    } catch (err) {
      console.error('Erro na troca de código OAuth com o Discord:', err);
    }
  }

  const cleanNick = (discordUsername || 'membro_discord').trim();
  const { isAdmin, adminRole } = isNickAdmin(cleanNick);
  const authToken = generateAuthToken(cleanNick, isAdmin, adminRole);

  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Autenticado no Discord</title>
      <style>
        body {
          background-color: #09090b;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .box {
          text-align: center;
          padding: 24px;
          border-radius: 16px;
          background-color: #18181b;
          border: 1px solid #27272a;
          max-width: 360px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .icon {
          width: 48px;
          height: 48px;
          background: #5865F2;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        h2 { font-size: 18px; margin: 0 0 8px; color: #5865F2; }
        p { font-size: 14px; color: #a1a1aa; margin: 0; }
        .username { color: #22c55e; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
        </div>
        <h2>Autorizado com Sucesso!</h2>
        <p>Logado como <span class="username">@${cleanNick}</span></p>
      </div>

      <script>
        const sessionPayload = {
          discordUsername: ${JSON.stringify(cleanNick)},
          discordId: ${JSON.stringify(discordId)},
          discordAvatar: ${JSON.stringify(discordAvatar)},
          discordGlobalName: ${JSON.stringify(discordGlobalName || cleanNick)},
          isAdmin: ${isAdmin},
          adminRole: ${adminRole ? JSON.stringify(adminRole) : 'null'},
          token: ${JSON.stringify(authToken)}
        };

        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_AUTH_SUCCESS',
            session: sessionPayload
          }, '*');
          setTimeout(() => { window.close(); }, 800);
        } else {
          window.location.href = '/';
        }
      </script>
    </body>
    </html>
  `);
});

// SUBMIT FORM API ROUTE: /complete and /api/complete
const handleCompleteSubmit = (req: express.Request, res: express.Response) => {
  const authHeader = req.headers.authorization;
  let token = req.body.authToken || req.body.token;

  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  const {
    discordUsername,
    discordId,
    discordAvatar,
    discordGlobalName,
    age,
    answers,
    detailedAnswers,
    submissionId,
    targetAdmins,
  } = req.body;

  if (!discordUsername || typeof discordUsername !== 'string' || !discordUsername.trim()) {
    return res.status(400).json({ error: 'Campo discordUsername é obrigatório.' });
  }

  // Generate unique submission ID (ID de Envio) if not supplied
  const finalSubmissionId =
    submissionId || `ENV-ASTRAL-${Math.floor(10000 + Math.random() * 90000)}`;

  const cleanNick = discordUsername.trim();
  const { isAdmin, adminRole } = isNickAdmin(cleanNick);

  let activeSession = token ? activeTokens.get(token) : null;
  if (!activeSession) {
    token = generateAuthToken(cleanNick, isAdmin, adminRole);
  }

  const assignedAdmins = targetAdmins && Array.isArray(targetAdmins) && targetAdmins.length > 0
    ? targetAdmins
    : ['bakai_shuziro978', 'Helena', 'cyan'];

  const newApp = {
    id: `astral-${Math.floor(1000 + Math.random() * 9000)}`,
    submissionId: finalSubmissionId,
    discordUsername: cleanNick,
    discordId: discordId || '',
    discordAvatar: discordAvatar || '',
    discordGlobalName: discordGlobalName || cleanNick,
    age: Number(age) || 16,
    submittedAt: new Date().toISOString(),
    status: 'Pendente',
    answers: answers || {},
    detailedAnswers: detailedAnswers || [],
    targetAdmins: assignedAdmins,
    adminNotes: '',
    authToken: token,
  };

  // Unshift so new applications appear at top
  applications.unshift(newApp);

  console.log(
    `[Formulário Astral] Formulário (Envio ID: ${finalSubmissionId}) recebido de @${cleanNick}! Direcionado para: ${assignedAdmins.join(', ')}`
  );

  return res.status(201).json({
    success: true,
    message: `Formulário enviado com sucesso (ID de Envio: ${finalSubmissionId}) e direcionado aos Administradores!`,
    submissionId: finalSubmissionId,
    targetAdmins: assignedAdmins,
    token,
    application: newApp,
    totalApplications: applications.length,
  });
};

app.post('/complete', handleCompleteSubmit);
app.post('/api/complete', handleCompleteSubmit);
app.post('/api/applications', handleCompleteSubmit);
app.post('/applications', handleCompleteSubmit);

// FETCH APPLICATIONS API ROUTE: GET /complete & GET /api/complete
const handleGetApplications = (_req: express.Request, res: express.Response) => {
  return res.json({
    success: true,
    count: applications.length,
    applications,
  });
};

app.get('/complete', handleGetApplications);
app.get('/api/complete', handleGetApplications);
app.get('/api/applications', handleGetApplications);
app.get('/applications', handleGetApplications);

// UPDATE APPLICATION STATUS/NOTES ROUTE
const handleUpdateApplication = (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { status, adminNotes, reviewedBy } = req.body;

  const appIndex = applications.findIndex((a) => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ error: 'Formulário não encontrado.' });
  }

  applications[appIndex] = {
    ...applications[appIndex],
    status: status || applications[appIndex].status,
    adminNotes: adminNotes !== undefined ? adminNotes : applications[appIndex].adminNotes,
    reviewedBy: reviewedBy || 'Administração Staff',
    reviewedAt: new Date().toISOString(),
  };

  return res.json({
    success: true,
    message: 'Status do formulário atualizado!',
    application: applications[appIndex],
  });
};

app.patch('/complete/:id', handleUpdateApplication);
app.patch('/api/complete/:id', handleUpdateApplication);
app.patch('/api/applications/:id', handleUpdateApplication);
app.post('/complete/update', (req, res) => {
  req.params = { id: req.body.id };
  return handleUpdateApplication(req, res);
});

// DELETE APPLICATION ROUTE
const handleDeleteApplication = (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const initialLength = applications.length;
  applications = applications.filter((a) => a.id !== id);

  if (applications.length === initialLength) {
    return res.status(404).json({ error: 'Formulário não encontrado.' });
  }

  return res.json({
    success: true,
    message: 'Formulário excluído do servidor.',
  });
};

app.delete('/complete/:id', handleDeleteApplication);
app.delete('/api/complete/:id', handleDeleteApplication);
app.delete('/api/applications/:id', handleDeleteApplication);

// Start Vite middleware or static server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Formulário Astral rodando na porta ${PORT}`);
  });
}

startServer();

export default app;

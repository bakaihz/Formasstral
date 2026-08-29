let globalApplications: any[] = [
  {
    id: 'astral-8921',
    submissionId: 'ENV-ASTRAL-8921',
    discordUsername: 'kaito_astral#1029',
    discordId: '849201938491029384',
    discordAvatar: '',
    discordGlobalName: 'Kaito Astral',
    age: 18,
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'Pendente',
    answers: {
      1: '18',
      2: '5 a 8 horas por dia',
      3: 'Fui Administrador durante 1 ano no servidor "Astral Community" (22k membros). Tinha foco em gerenciar a equipe de moderação.',
      4: 'Domínio total de Carl-bot, Dyno, MEE6 e Ticket Tool.',
      5: 'Acompanho o Formulário Astral há meses e vejo grande potencial.',
      6: 'Apagaria mensagens ofensivas, aplicaria aviso verbal imediato.',
      7: 'A amizade não anula as diretrizes. Aplicaria sanção imparcialmente.',
      8: 'Abuso de poder é punir sem motivo. Evito mantendo a ética.',
      9: 'Pediria gravações ou registros no chat log, verificaria logs.',
      10: 'Criar noites de minigames no Discord e um canal semanal de feedback.',
    },
    detailedAnswers: [
      { questionId: 1, questionTitle: 'Quantos anos você tem?', answerText: '18' },
      { questionId: 2, questionTitle: 'Qual o seu tempo de disponibilidade diária?', answerText: '5 a 8 horas por dia' },
      { questionId: 3, questionTitle: 'Você já teve experiência anterior como Staff em outros servidores?', answerText: 'Fui Administrador durante 1 ano no servidor Astral Community (22k membros).' },
      { questionId: 4, questionTitle: 'Qual o seu conhecimento sobre Bots de Moderação e permissões do Discord?', answerText: 'Domínio total de Carl-bot, Dyno, MEE6 e Ticket Tool.' },
      { questionId: 5, questionTitle: 'Por que você deseja entrar para a Staff do Formulário Astral?', answerText: 'Acompanho o Formulário Astral há meses e vejo grande potencial.' },
      { questionId: 6, questionTitle: 'Como você agiria se presenciasse uma discussão inflamada?', answerText: 'Apagaria mensagens ofensivas, aplicaria aviso verbal imediato.' },
      { questionId: 7, questionTitle: 'Caso um amigo próximo seu descumpra uma regra grave no servidor, o que você faria?', answerText: 'A amizade não anula as diretrizes. Aplicaria a sanção imparcialmente.' },
      { questionId: 8, questionTitle: 'O que significa "Abuso de Poder" na Staff e como você evita cometê-lo?', answerText: 'Abuso de poder é punir sem motivo. Evito sempre mantendo a ética.' },
      { questionId: 9, questionTitle: 'Como você trataria um ticket de denúncia sem provas conclusivas?', answerText: 'Pediria gravações ou registros no chat log e verificaria as logs.' },
      { questionId: 10, questionTitle: 'Qual ideia, evento ou melhoria você gostaria de propor?', answerText: 'Criar noites de minigames no Discord e canal semanal de feedback.' },
    ],
    targetAdmins: ['bakai_shuziro978', 'Helena', 'cyan'],
    adminNotes: '',
    authToken: 'astral_tok_seed_kaito',
  },
];

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      count: globalApplications.length,
      applications: globalApplications,
    });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
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
      authToken,
      token,
    } = body;

    const userNick = (discordUsername || '').trim();
    if (!userNick) {
      return res.status(400).json({ error: 'Campo discordUsername é obrigatório.' });
    }

    const finalToken = authToken || token || `astral_tok_${Math.random().toString(36).substring(2)}`;
    const finalSubmissionId = submissionId || `ENV-ASTRAL-${Math.floor(10000 + Math.random() * 90000)}`;
    const assignedAdmins = targetAdmins && Array.isArray(targetAdmins) && targetAdmins.length > 0
      ? targetAdmins
      : ['bakai_shuziro978', 'Helena', 'cyan'];

    const newApp = {
      id: `astral-${Math.floor(1000 + Math.random() * 9000)}`,
      submissionId: finalSubmissionId,
      discordUsername: userNick,
      discordId: discordId || '',
      discordAvatar: discordAvatar || '',
      discordGlobalName: discordGlobalName || userNick,
      age: Number(age) || 16,
      submittedAt: new Date().toISOString(),
      status: 'Pendente',
      answers: answers || {},
      detailedAnswers: detailedAnswers || [],
      targetAdmins: assignedAdmins,
      adminNotes: '',
      authToken: finalToken,
    };

    globalApplications.unshift(newApp);

    return res.status(201).json({
      success: true,
      message: `Formulário enviado com sucesso (ID de Envio: ${finalSubmissionId}) para os Administradores!`,
      submissionId: finalSubmissionId,
      targetAdmins: assignedAdmins,
      token: finalToken,
      application: newApp,
      totalApplications: globalApplications.length,
    });
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const id = req.query?.id || body.id;
    const { status, adminNotes, reviewedBy } = body;

    const appIndex = globalApplications.findIndex((a) => a.id === id);
    if (appIndex !== -1) {
      globalApplications[appIndex] = {
        ...globalApplications[appIndex],
        status: status || globalApplications[appIndex].status,
        adminNotes: adminNotes !== undefined ? adminNotes : globalApplications[appIndex].adminNotes,
        reviewedBy: reviewedBy || 'Administração Staff',
        reviewedAt: new Date().toISOString(),
      };
      return res.status(200).json({
        success: true,
        message: 'Status do formulário atualizado!',
        application: globalApplications[appIndex],
      });
    }
    return res.status(404).json({ error: 'Formulário não encontrado.' });
  }

  if (req.method === 'DELETE') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const id = req.query?.id || body.id;
    globalApplications = globalApplications.filter((a) => a.id !== id);
    return res.status(200).json({ success: true, message: 'Formulário excluído.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

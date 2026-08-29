import crypto from 'crypto';

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

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { discordUsername } = body;

  if (!discordUsername || typeof discordUsername !== 'string' || !discordUsername.trim()) {
    return res.status(400).json({ error: 'Nick do Discord é obrigatório.' });
  }

  const cleanNick = discordUsername.trim();
  const isAdmin = cleanNick.toLowerCase() === 'bakai_shuziro978';
  const random = crypto.randomBytes(16).toString('hex');
  const token = `astral_tok_${random}`;

  return res.status(200).json({
    success: true,
    token,
    discordUsername: cleanNick,
    isAdmin,
  });
}

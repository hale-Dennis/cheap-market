import type { NextApiRequest, NextApiResponse } from 'next';

import { serializeClearedAccessTokenCookie } from '@/lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  res.setHeader('Set-Cookie', serializeClearedAccessTokenCookie());
  return res.status(204).end();
}

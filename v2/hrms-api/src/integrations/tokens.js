import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
export const createTokens = config => ({
  signToken: payload => jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn, jwtid: randomUUID(), algorithm: 'HS256' }),
  verifyToken: token => jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }),
});

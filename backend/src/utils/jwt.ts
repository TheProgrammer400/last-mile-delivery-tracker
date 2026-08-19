import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config';

export interface JwtPayload {
  userId: string;
  role: Role;
  email: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);

      const existingUser = await prisma.user.findUnique({ where: { email: validated.email } });
      if (existingUser) {
        throw new ConflictError(`User with email '${validated.email}' already exists`);
      }

      const passwordHash = await bcrypt.hash(validated.password, 10);

      const user = await prisma.user.create({
        data: {
          name: validated.name,
          email: validated.email,
          passwordHash,
          role: Role.CUSTOMER,
          phone: validated.phone,
        },
      });

      const token = generateToken({
        userId: user.id,
        role: user.role,
        email: user.email,
      });

      return res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
        token,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: validated.email },
        include: { agentProfile: { include: { zone: true } } },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(validated.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const token = generateToken({
        userId: user.id,
        role: user.role,
        email: user.email,
      });

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          agentProfile: user.agentProfile || null,
        },
        token,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { agentProfile: { include: { zone: true } } },
      });

      if (!user) {
        throw new UnauthorizedError('User profile not found');
      }

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          agentProfile: user.agentProfile || null,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

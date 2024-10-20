import { Role, User } from '@prisma/client';
import { hash, compare } from 'bcrypt';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { Response } from 'express';

export { Role };

export type UserRead = Omit<User, 'password'>;

export const userReadSelectConfig: Record<keyof UserRead, boolean> = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  passwordChangedAt: true,
};

export const UserSignupSchema = z.object({
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().trim().min(6).max(16),
});

export const UserLoginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().trim().min(6).max(16),
});

export const UserUpdatePasswordSchema = z.object({
  currentPassword: z.string().trim(),
  password: z.string().trim().min(6).max(16),
});

export const UserCreateSchema = z.object({
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().trim().min(6).max(16),
  role: z.enum([Role.ADMIN, Role.USER]).optional(),
});

export const encryptPassword = (password: string) => {
  return hash(password, 10);
};

export const verifyPassword = (password: string, encryptedPassword: string) => {
  return compare(password, encryptedPassword);
};

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const createSendToken = (
  user: UserRead,
  statusCode: number,
  res: Response,
) => {
  const token = signToken(user.id);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const changedPasswordAfter = (user: UserRead, limiterInS: number) => {
  if (!user.passwordChangedAt) return false;

  const changedTimestampInS = parseInt(
    String(user.passwordChangedAt.getTime() / 1000),
    10,
  );

  console.log(changedTimestampInS);
  console.log(limiterInS);

  return limiterInS < changedTimestampInS;
};

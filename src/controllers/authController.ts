import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import { prisma } from '../database';
import {
  UserSignupSchema,
  encryptPassword,
  userReadSelectConfig,
  createSendToken,
  UserLoginSchema,
  verifyPassword,
  changedPasswordAfter,
  UserUpdatePasswordSchema,
  UserRead,
  Role,
} from '../models/userModel';
import { AppError } from '../utils/appError';
import excludeFields from '../utils/excludeFields';
import verifyJWT from '../utils/verifyJwt';

export const signup = catchAsync(async (req, res, next) => {
  const { body = {} } = req;

  const { success, error, data } = await UserSignupSchema.safeParseAsync(body);

  if (!success) {
    return next(error);
  }

  const password = await encryptPassword(data.password);

  const newUser = await prisma.user.create({
    data: {
      ...data,
      password,
    },
    select: userReadSelectConfig,
  });

  createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { body = {} } = req;

  const { success, error, data } = await UserLoginSchema.safeParseAsync(body);

  if (!success) {
    return next(error);
  }

  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
    select: {
      ...userReadSelectConfig,
      password: true,
    },
  });

  if (!user || !(await verifyPassword(data.password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(excludeFields(user, ['password']), 200, res);
});

export const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  // 2) Verification token
  const decoded = await verifyJWT(token, process.env.JWT_SECRET as string);

  // 3) Check if user still exists
  const user = await prisma.user.findUnique({
    where: {
      id: decoded.id,
    },
    select: {
      ...userReadSelectConfig,
    },
  });

  if (!user) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }

  // 4) Check if user changed password after the token was issued
  if (changedPasswordAfter(user, decoded.iat as number)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }

  res.locals.user = user;
  next();
});

export const restrictTo =
  (...roles: Role[]) =>
  (_req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(res.locals.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };

export const updatePassword = catchAsync(async (req, res, next) => {
  const { body = {} } = req;

  const { success, error, data } =
    await UserUpdatePasswordSchema.safeParseAsync(body);

  if (!success) {
    return next(error);
  }

  const user = (await prisma.user.findUnique({
    where: {
      id: res.locals.user.id,
    },
    select: {
      ...userReadSelectConfig,
      password: true,
    },
  })) as UserRead & { password: string };

  if (!(await verifyPassword(data.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  const password = await encryptPassword(data.password);

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password,
      updatedAt: new Date(),
      passwordChangedAt: new Date(),
    },
    select: userReadSelectConfig,
  });

  createSendToken(updatedUser, 200, res);
});

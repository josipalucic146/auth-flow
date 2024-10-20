import { prisma } from '../database';
import {
  encryptPassword,
  UserCreateSchema,
  userReadSelectConfig,
} from '../models/userModel';
import catchAsync from '../utils/catchAsync';

export const createUser = catchAsync(async (req, res, next) => {
  const { body = {} } = req;

  const { success, error, data } = await UserCreateSchema.safeParseAsync(body);

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

  res.status(201).json({
    status: 'success',
    data: {
      user: newUser,
    },
  });
});

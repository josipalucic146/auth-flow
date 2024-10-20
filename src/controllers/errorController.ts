import { Request, Response, NextFunction } from 'express';
import { ErrorExt, AppError } from '../utils/appError';
import { z } from 'zod';

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const handleDBUniqueError = (err: ErrorExt) => {
  const fields = err.meta.target as string[];

  return new AppError(
    `${fields.length > 1 ? 'Fields' : 'Field'} ${fields.join(',')} must be unique`,
    400,
  );
};

const handleZodError = (err: ErrorExt) => {
  const issues = err.issues as { message: string }[];
  console.log(issues);
  const message = issues
    .map(issue => issue.message)
    .map(item => `${item}.`)
    .join(' ');

  return new AppError(message, 400);
};

const sendErrorDev = (err: ErrorExt, res: Response) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: ErrorExt, res: Response) => {
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);
  // 2) Send generic message
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};

export default (
  err: ErrorExt,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'JsonWebTokenError') {
      sendErrorProd(handleJWTError(), res);
    } else if (err.name === 'TokenExpiredError') {
      sendErrorProd(handleJWTExpiredError(), res);
    } else if (err.code === 'P2002') {
      sendErrorProd(handleDBUniqueError(err), res);
    } else if (err instanceof z.ZodError) {
      sendErrorProd(handleZodError(err), res);
    } else {
      sendErrorProd(err, res);
    }
  }
};

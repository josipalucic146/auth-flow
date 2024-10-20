import express from 'express';
import globalErrorHandler from './controllers/errorController';
import { AppError } from './utils/appError';
import userRouter from './routers/userRouter';
import publicRouter from './routers/publicRouter';

const app = express();

app.use(express.json({ limit: '10kb' }));

app.use('/api/v1/public', publicRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, _res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;

import catchAsync from '../utils/catchAsync';

export const greet = catchAsync(async (req, res, next) => {
  res.json({
    message: 'Hello from the server 😁',
  });
});

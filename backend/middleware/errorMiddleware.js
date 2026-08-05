const errorMiddleware = (err, _req, res, _next) => {
  const statusCode = err.statusCode || res.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error ${statusCode}]:`, err);

  res.status(statusCode === 200 ? 500 : statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

const notFound = (req, res, _next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
};

module.exports = {
  errorMiddleware,
  notFound,
};

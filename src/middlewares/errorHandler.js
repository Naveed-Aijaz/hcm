// Centralised error handling: maps known error types to proper HTTP status codes
// and never leaks internal details for 5xx responses.
export function notFound(_req, res) {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
}

export function errorHandler(err, _req, res, _next) {
  if (res.headersSent) return;

  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Request failed';

  if (err.name === 'ValidationError' && err.errors) {
    status = 400; // Mongoose validation
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate record';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large';
  } else if (err.name === 'MulterError') {
    status = 400;
  } else if (err.code === 'CORS_NOT_ALLOWED') {
    status = 403;
  }

  if (status >= 500) {
    console.error('[error]', err.name, err.message);
    message = 'Internal server error';
  }

  res.status(status).json({ success: false, message });
}

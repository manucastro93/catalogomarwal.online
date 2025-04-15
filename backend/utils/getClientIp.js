export const getClientIp = (req) => {
  const rawIp =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip;

  return rawIp?.replace(/^::ffff:/, '').trim();
};

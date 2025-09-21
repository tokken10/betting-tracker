import jwt from 'jsonwebtoken';

export default function (req, res, next) {
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

import jwt from 'jsonwebtoken';

export default function (req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = req.cookies?.token;
  if (!token && authHeader) {
    token = authHeader.split(' ')[1];
  }
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

const jwt = require('jsonwebtoken');

exports.auth= async (req, res, next)=> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded =await jwt.verify(token, process.env.token);
    req.user = decoded; // { userId, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('FATAL: JWT_SECRET environment variable is not set.');

export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided, authorization denied.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Token is invalid or expired.' });
    }

    // Attach user information to request
    req.user = decoded; // { userId, email, sessionId }

    // If the token has a sessionId, check if it's active in MongoDB
    if (decoded.sessionId) {
      const user = await User.findById(decoded.userId).select('sessions');
      if (!user) {
        return res.status(401).json({ error: 'User not found.' });
      }

      const activeSession = user.sessions.find(s => s.sessionId === decoded.sessionId);
      if (!activeSession) {
        return res.status(401).json({ error: 'Session has been invalidated. Please log in again.' });
      }

      // Update lastActive timestamp in background (non-blocking)
      User.updateOne(
        { _id: user._id, 'sessions.sessionId': decoded.sessionId },
        { $set: { 'sessions.$.lastActive': new Date() } }
      ).catch(() => {});
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Token is invalid or expired.' });
  }
}

import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db, isDatabaseConfigured } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  // Support custom session tokens (e.g. session:email:name)
  if (token.startsWith('session:')) {
    const parts = token.split(':');
    const email = parts[1] || 'customer@albarakah.store';
    const name = parts[2] ? decodeURIComponent(parts[2]) : email.split('@')[0];
    const emailLower = email.toLowerCase();
    const isSuperAdminEmail = emailLower === 'albarakahpremium10@gmail.com' || emailLower === 'pctanvirt@gmail.com';

    req.dbUser = {
      id: `usr_${Math.abs(email.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0))}`,
      email,
      name,
      role: isSuperAdminEmail ? 'super_admin' : 'customer',
      isActive: true,
    };

    if (isDatabaseConfigured) {
      try {
        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing.length > 0) {
          req.dbUser = existing[0];
        } else {
          const [newUser] = await db.insert(users).values({
            googleId: `session_${Date.now()}`,
            email,
            name,
            role: isSuperAdminEmail ? 'super_admin' : 'customer',
            isActive: true,
          }).returning();
          req.dbUser = newUser;
        }
      } catch (e) {
        // Fallback user already set
      }
    }

    return next();
  }

  try {
    if (adminAuth && typeof adminAuth.verifyIdToken === 'function') {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;

      const email = decodedToken.email || 'user@example.com';
      const emailLower = email.toLowerCase();
      const isSuperAdminEmail = emailLower === 'albarakahpremium10@gmail.com' || emailLower === 'pctanvirt@gmail.com';

      req.dbUser = {
        id: decodedToken.uid,
        email,
        name: decodedToken.name || email.split('@')[0],
        role: isSuperAdminEmail ? 'super_admin' : 'customer',
        isActive: true,
      };

      if (isDatabaseConfigured && decodedToken.email) {
        try {
          const existing = await db.select().from(users).where(eq(users.email, decodedToken.email)).limit(1);
          if (existing.length > 0) {
            req.dbUser = existing[0];
          } else {
            const [newUser] = await db.insert(users).values({
              googleId: decodedToken.uid,
              email: decodedToken.email,
              name: decodedToken.name || decodedToken.email.split('@')[0],
              avatarUrl: decodedToken.picture || null,
              role: isSuperAdminEmail ? 'super_admin' : 'customer',
              isActive: true,
            }).returning();
            req.dbUser = newUser;
          }
        } catch (e) {
          // Keep default fallback
        }
      }

      if (req.dbUser && !req.dbUser.isActive) {
        return res.status(403).json({ error: 'Account is deactivated. Contact customer support.' });
      }

      return next();
    } else {
      return res.status(401).json({ error: 'Auth service initializing. Please try again in a moment.' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    
    if (token.startsWith('session:')) {
      const parts = token.split(':');
      const email = parts[1] || 'customer@albarakah.store';
      const name = parts[2] ? decodeURIComponent(parts[2]) : email.split('@')[0];
      const emailLower = email.toLowerCase();
      const isSuperAdminEmail = emailLower === 'albarakahpremium10@gmail.com' || emailLower === 'pctanvirt@gmail.com';

      req.dbUser = {
        id: `usr_${Math.abs(email.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0))}`,
        email,
        name,
        role: isSuperAdminEmail ? 'super_admin' : 'customer',
        isActive: true,
      };

      if (isDatabaseConfigured) {
        try {
          const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
          if (existing.length > 0) {
            req.dbUser = existing[0];
          }
        } catch (e) {
          // Optional auth fail silently
        }
      }
      return next();
    }

    try {
      if (adminAuth && typeof adminAuth.verifyIdToken === 'function') {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
        if (decodedToken.email) {
          const isSuperAdminEmail = decodedToken.email.toLowerCase() === 'albarakahpremium10@gmail.com' || decodedToken.email.toLowerCase() === 'pctanvirt@gmail.com';
          req.dbUser = {
            id: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || decodedToken.email.split('@')[0],
            role: isSuperAdminEmail ? 'super_admin' : 'customer',
            isActive: true,
          };
          if (isDatabaseConfigured) {
            try {
              const existing = await db.select().from(users).where(eq(users.email, decodedToken.email)).limit(1);
              if (existing.length > 0) {
                req.dbUser = existing[0];
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }
    } catch (e) {
      // Ignore token failure for optional auth
    }
  }
  next();
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.dbUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.dbUser.role !== 'admin' && req.dbUser.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  next();
};

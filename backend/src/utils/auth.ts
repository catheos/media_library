import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  user_id: number;
}

// Generate JWT token
export const generateToken = (user_id: number): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any
  };
  
  return jwt.sign({ user_id }, JWT_SECRET, options);
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

// Compare password
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
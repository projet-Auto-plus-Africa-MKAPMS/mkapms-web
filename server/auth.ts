import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { env } from "./env.js";

export interface JwtPayload {
  uid: number;
  role: string;
  email: string;
}

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleProfile | null> {
  if (!env.GOOGLE_CLIENT_ID) return null;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    if (!p || !p.email) return null;
    return {
      googleId: p.sub,
      email: p.email,
      name: p.name || p.email.split("@")[0],
      picture: p.picture,
    };
  } catch {
    return null;
  }
}

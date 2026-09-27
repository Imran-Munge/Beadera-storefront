import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "hello@beadera.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "beadera-demo";
const SESSION_COOKIE = "beadera_admin";

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminCredentialsValid(email: string, password: string): boolean {
  return safeEqual(email, ADMIN_EMAIL) && safeEqual(password, ADMIN_PASSWORD);
}

export function getAdminEmail(req: Request): string | null {
  const email = req.signedCookies?.[SESSION_COOKIE];
  return typeof email === "string" ? email : null;
}

export function setAdminSession(res: Response, email: string): void {
  res.cookie(SESSION_COOKIE, email, {
    httpOnly: true,
    signed: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

export function clearAdminSession(res: Response): void {
  res.clearCookie(SESSION_COOKIE);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!getAdminEmail(req)) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }
  next();
}
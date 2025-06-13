import { cookies } from "next/headers";
import db from "./db";

export interface User {
  id: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
}

// Simple session management using cookies
export async function createSession(user: User) {
  const sessionData = {
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  const cookieStore = await cookies();
  cookieStore.set("session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours in seconds
  });

  return sessionData;
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    
    if (!sessionCookie) {
      return null;
    }

    const sessionData = JSON.parse(sessionCookie.value);
    
    // Check if session is expired
    if (new Date() > new Date(sessionData.expiresAt)) {
      await destroySession();
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  try {
    const user = await db("users")
      .where("id", session.userId)
      .first();

    if (!user) {
      await destroySession();
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

// Simple password hashing (in production, use bcrypt)
export function hashPassword(password: string): string {
  // This is a very basic hash - in production, use bcrypt
  return Buffer.from(password).toString("base64");
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}
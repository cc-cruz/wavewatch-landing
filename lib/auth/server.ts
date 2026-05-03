import {
  createNeonAuth,
  type NeonAuth,
} from "@neondatabase/auth/next/server";

let authInstance: NeonAuth | null = null;

function requireAuthEnv() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;
  const missing = [
    !baseUrl && "NEON_AUTH_BASE_URL",
    !cookieSecret && "NEON_AUTH_COOKIE_SECRET",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing Neon Auth env: ${missing.join(", ")}`);
  }

  return {
    baseUrl,
    cookieSecret,
  };
}

export function getAuth() {
  if (!authInstance) {
    const { baseUrl, cookieSecret } = requireAuthEnv();

    authInstance = createNeonAuth({
      baseUrl,
      cookies: {
        secret: cookieSecret,
      },
    });
  }

  return authInstance;
}

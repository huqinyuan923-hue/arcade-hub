export const SESSION_COOKIE = "arcade_session";

// 仅本地开发/测试兜底；生产环境缺少 JWT_SECRET 时必须直接失败，
// 否则任何人都能用公开密钥伪造管理员会话。
const DEV_FALLBACK = "arcade-hub-dev-secret-fallback-0000";

export function getSessionSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) {
    return new TextEncoder().encode(secret);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET 未配置或过短（生产环境要求至少 16 位）");
  }
  return new TextEncoder().encode(DEV_FALLBACK);
}

import bcrypt from "bcryptjs";

// 异步版本：bcrypt 同步调用会阻塞整个 Node 事件循环（每次约 80-120ms），
// 登录/注册并发时会拖慢同实例上的所有请求。
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

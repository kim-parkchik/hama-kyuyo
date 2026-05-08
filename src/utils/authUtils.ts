import { invoke } from "@tauri-apps/api/core";

/**
 * パスワードを Rust 側の Argon2 でハッシュ化する
 * (useFirstSetup, useSystemSettings などで使用)
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await invoke<string>("hash_password", { password });
  } catch (error) {
    console.error("AuthUtils: Password hashing failed:", error);
    throw new Error("パスワードの処理に失敗しました。");
  }
}

/**
 * パスワードの照合を Rust 側に依頼する
 * (useLogin で使用)
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await invoke<boolean>("verify_password", { password, hash });
  } catch (error) {
    console.error("AuthUtils: Password verification failed:", error);
    return false;
  }
}
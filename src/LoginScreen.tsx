import { useState } from "react";

export default function LoginScreen({ db, onLoginSuccess }: { db: any, onLoginSuccess: (user: any) => void }) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // 本来はハッシュ化して比較しますが、まずは平文で admin / admin を通します
      const users = await db.select(
        "SELECT * FROM users WHERE login_id = ? AND password_hash = ? AND status = 'active'",
        [loginId, password]
      ) as any[];

      if (users.length > 0) {
        // ログイン成功！ 最終ログイン時刻を更新（非同期でOK）
        db.execute("UPDATE users SET last_login = DATETIME('now', 'localtime') WHERE id = ?", [users[0].id]);
        onLoginSuccess(users[0]);
      } else {
        setError("ログインIDまたはパスワードが正しくありません。");
      }
    } catch (err) {
      console.error(err);
      setError("データベース接続エラーが発生しました。");
    }
  };

  return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: "#2c3e50", color: "white", fontFamily: "sans-serif"
    }}>
      <div style={{
        width: "350px", padding: "40px", backgroundColor: "white", borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)", color: "#2c3e50"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#34495e" }}>⚓️ はま給与 ログイン</h2>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", color: "#7f8c8d" }}>ログインID</label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              style={{ width: "100%", padding: "12px", marginTop: "5px", border: "1px solid #ddd", borderRadius: "6px", boxSizing: "border-box" }}
              placeholder="admin"
              required
            />
          </div>
          
          <div style={{ marginBottom: "25px" }}>
            <label style={{ fontSize: "12px", color: "#7f8c8d" }}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px", marginTop: "5px", border: "1px solid #ddd", borderRadius: "6px", boxSizing: "border-box" }}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p style={{ color: "#e74c3c", fontSize: "13px", marginBottom: "15px" }}>{error}</p>}

          <button type="submit" style={{
            width: "100%", padding: "12px", backgroundColor: "#3498db", color: "white",
            border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "16px"
          }}>
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
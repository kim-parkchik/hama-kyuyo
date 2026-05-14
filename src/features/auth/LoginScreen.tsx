import { S } from "./LoginScreen.styles";
import { useLogin } from "./useLogin";
import { AlertTriangle } from 'lucide-react';

export default function LoginScreen({ db, onLoginSuccess }: { db: any, onLoginSuccess: (user: any) => void }) {
  const { loginId, setLoginId, password, setPassword, error, handleLogin } = useLogin(db, onLoginSuccess);

  return (
    <div style={S.container}>
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <img 
            src="/logo.svg" 
            alt="App Logo" 
            style={{ width: "120px", height: "auto" }} 
          />
        </div>
        
        <form onSubmit={handleLogin}>
          <div style={S.inputGroup}>
            <label style={S.label}>ログインID</label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              style={S.input}
              placeholder="admin"
              required
            />
          </div>
          
          <div style={{ ...S.inputGroup, marginBottom: "25px" }}>
            <label style={S.label}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={S.input}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p style={S.errorText}>
              <AlertTriangle size={14} /> {error}
            </p>
          )}

          <button type="submit" style={S.button}>
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
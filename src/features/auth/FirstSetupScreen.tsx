import { AlertTriangle } from 'lucide-react';
import { S }  from "./FirstSetupScreen.styles";
import { useFirstSetup } from "./useFirstSetup";

export default function FirstSetupScreen({ db, onComplete }: { db: any, onComplete: () => void }) {

  const f = useFirstSetup(db, onComplete);

  return (
    <div style={S.container}>
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img 
            src="/logo.svg" 
            alt="App Logo" 
            style={{ width: "120px", height: "auto" }} 
          />
        </div>
        <p style={{ textAlign: "center", color: "#95a5a6", fontSize: "14px" }}>
          最初に使用する管理者アカウントを作成します。
        </p>

        <form onSubmit={f.handleSubmit}>
          <label style={S.label}>ログインID</label>
          <input 
            type="text" 
            value={f.loginId} 
            readOnly 
            style={{ ...S.input, backgroundColor: "#f9f9f9", cursor: "not-allowed" }} 
          />

          <label style={S.label}>管理者のお名前</label>
          <input 
            type="text" 
            value={f.displayName} 
            onChange={e => f.setDisplayName(e.target.value)} 
            style={S.input}
            required 
          />

          <label style={S.label}>パスワード</label>
          <input 
            type="password" 
            value={f.password} 
            onChange={e => f.setPassword(e.target.value)} 
            style={S.input}
            required 
          />

          <label style={S.label}>パスワード（確認）</label>
          <input 
            type="password" 
            value={f.passwordConfirm} 
            onChange={e => f.setPasswordConfirm(e.target.value)} 
            style={S.input}
            required 
          />

          {f.error && (
            <p style={{ 
              color: "#e74c3c", 
              fontSize: "13px", 
              textAlign: "center",
              display: "flex",         // アイコンと文字を横並びに
              alignItems: "center",    // 上下中央揃え
              justifyContent: "center", // 左右中央揃え
              gap: "6px",              // アイコンと文字の間隔
              marginTop: "10px"
            }}>
              <AlertTriangle size={16} strokeWidth={2.5} /> 
              {f.error}
            </p>
          )}

          <button type="submit" style={S.primaryButton}>
            アカウントを作成して開始
          </button>
        </form>
      </div>
    </div>
  );
}
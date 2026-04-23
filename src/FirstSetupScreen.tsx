import { useState } from "react";

export default function FirstSetupScreen({ db, onComplete }: { db: any, onComplete: () => void }) {
    const [loginId, setLoginId] = useState("admin");
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // バリデーション
        if (password !== passwordConfirm) {
            return setError("パスワードが一致しません。");
        }
        if (password.length < 4) {
            return setError("パスワードは4文字以上で設定してください。");
        }
        if (!displayName.trim()) {
            return setError("表示名を入力してください。");
        }

        try {
            // 管理者ユーザーを作成
            await db.execute(
                `INSERT INTO users (login_id, display_name, password_hash, role) 
                 VALUES (?, ?, ?, 'admin')`,
                [loginId, displayName, password] // 現時点ではパスワードをそのまま保存
            );
            
            alert("管理者アカウントを作成しました。ログインしてください。");
            onComplete(); // App側の hasUser を true に更新させる
        } catch (err) {
            console.error(err);
            setError("ユーザーの作成に失敗しました。IDが重複している可能性があります。");
        }
    };

    const containerStyle = {
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#34495e",
        fontFamily: "sans-serif"
    };

    const cardStyle = {
        width: "400px",
        padding: "40px",
        backgroundColor: "white",
        borderRadius: "15px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
    };

    const inputStyle = {
        width: "100%",
        padding: "12px",
        marginTop: "5px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        boxSizing: "border-box" as const,
        fontSize: "16px"
    };

    const labelStyle = {
        fontSize: "12px",
        color: "#7f8c8d",
        fontWeight: "bold" as const,
        display: "block",
        marginTop: "15px"
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h2 style={{ textAlign: "center", color: "#2c3e50", marginBottom: "10px" }}>⚓️ はま給与 セットアップ</h2>
                <p style={{ textAlign: "center", color: "#95a5a6", fontSize: "14px", marginBottom: "30px" }}>
                    最初に使用する管理者アカウントを作成します。
                </p>

                <form onSubmit={handleSubmit}>
                    <label style={labelStyle}>ログインID（変更不可）</label>
                    <input 
                        type="text" 
                        value={loginId} 
                        readOnly 
                        style={{ ...inputStyle, backgroundColor: "#f9f9f9", color: "#95a5a6" }} 
                    />

                    <label style={labelStyle}>管理者のお名前（表示名）</label>
                    <input 
                        type="text" 
                        placeholder="例：山田 太郎" 
                        value={displayName} 
                        onChange={e => setDisplayName(e.target.value)} 
                        style={inputStyle}
                        required 
                    />

                    <label style={labelStyle}>パスワード</label>
                    <input 
                        type="password" 
                        placeholder="4文字以上" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        style={inputStyle}
                        required 
                    />

                    <label style={labelStyle}>パスワード（確認）</label>
                    <input 
                        type="password" 
                        placeholder="もう一度入力" 
                        value={passwordConfirm} 
                        onChange={e => setPasswordConfirm(e.target.value)} 
                        style={inputStyle}
                        required 
                    />

                    {error && (
                        <p style={{ color: "#e74c3c", fontSize: "13px", marginTop: "15px", textAlign: "center" }}>
                            ⚠️ {error}
                        </p>
                    )}

                    <button type="submit" style={{
                        width: "100%",
                        padding: "15px",
                        backgroundColor: "#2ecc71",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        marginTop: "30px",
                        fontSize: "18px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "background 0.3s"
                    }}>
                        アカウントを作成して開始
                    </button>
                </form>
            </div>
        </div>
    );
}
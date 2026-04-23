import { useEffect, useState } from "react";

export default function UserManager({ db }: { db: any }) {
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await db.select("SELECT id, login_id, display_name, role, last_login FROM users");
      setUsers(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>⚙️ ユーザー管理</h2>
      <p style={{ color: "#666", fontSize: "14px" }}>システムを利用できるアカウントを管理します。</p>
      
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px", backgroundColor: "white" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
            <th style={{ padding: "12px" }}>ログインID</th>
            <th style={{ padding: "12px" }}>表示名</th>
            <th style={{ padding: "12px" }}>権限</th>
            <th style={{ padding: "12px" }}>最終ログイン</th>
            <th style={{ padding: "12px" }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "12px" }}>{user.login_id}</td>
              <td style={{ padding: "12px" }}>{user.display_name}</td>
              <td style={{ padding: "12px" }}>
                <span style={{ 
                  padding: "2px 8px", 
                  borderRadius: "4px", 
                  backgroundColor: user.role === 'admin' ? "#e74c3c" : "#3498db",
                  color: "white",
                  fontSize: "12px"
                }}>
                  {user.role}
                </span>
              </td>
              <td style={{ padding: "12px", fontSize: "13px", color: "#7f8c8d" }}>
                {user.last_login || "未ログイン"}
              </td>
              <td style={{ padding: "12px" }}>
                <button 
                  disabled={user.login_id === 'admin'} 
                  style={{ cursor: user.login_id === 'admin' ? "not-allowed" : "pointer" }}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <button 
        onClick={() => alert("新規ユーザー追加機能は開発中です！")}
        style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer" }}
      >
        ＋ 新規ユーザーを追加
      </button>
    </div>
  );
}
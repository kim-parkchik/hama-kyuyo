// @ts-ignore
import Database from "@tauri-apps/plugin-sql";
import { useEffect, useState } from "react";
import { modernIconBtnStyle } from "./utils";
import AttendanceManager from "./AttendanceManager"; // ✨ 新しく作った専門家を呼ぶ

function App() {
  const [db, setDb] = useState<Database | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("staff");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // 編集中のID（nullなら新規登録）
  const [targetYear, setTargetYear] = useState(2026);
  const [targetMonth, setTargetMonth] = useState(4);

  // --- 従業員情報ステート ---
  const [targetId, setTargetId] = useState("");
  const [targetName, setTargetName] = useState("");
  const [targetFurigana, setTargetFurigana] = useState("");
  const [targetBirthday, setTargetBirthday] = useState("");
  const [targetWage, setTargetWage] = useState(1200);
  const [targetJoinDate, setTargetJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetZip, setTargetZip] = useState("");
  const [targetAddress, setTargetAddress] = useState("");
  const [targetCommuteType, setTargetCommuteType] = useState("daily");
  const [targetCommuteWage, setTargetCommuteWage] = useState(0);
  const [isSaving, setIsSaving] = useState(false); // ✨ 保存完了演出用
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const sqlite = await Database.load("sqlite:hama_kyuyo.db");

        // 一度テーブルを削除して最新構造で作り直す
        // ※ 本番運用中なら注意が必要ですが、開発中の今ならこれが一番スッキリします。
        // await sqlite.execute("DROP TABLE IF EXISTS attendance;"); 

        await sqlite.execute(`
          CREATE TABLE IF NOT EXISTS staff (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, furigana TEXT, 
            birthday TEXT, join_date TEXT, zip_code TEXT, address TEXT,
            hourly_wage INTEGER NOT NULL, commute_type TEXT DEFAULT 'none', commute_wage INTEGER DEFAULT 0
          );
          
          CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id TEXT NOT NULL,
            work_date TEXT NOT NULL,
            entry_time TEXT,
            exit_time TEXT,
            break_start TEXT,
            break_end TEXT,
            out_time TEXT,
            return_time TEXT,
            work_hours REAL DEFAULT 0,
            night_hours REAL DEFAULT 0,
            -- 🆕 将来の再現性のための「その時の単価」保存用カラム
            actual_hourly_wage INTEGER, 
            overtime_rate REAL,
            night_rate REAL,
            UNIQUE(staff_id, work_date),
            FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE
          );
        `);
        
        await sqlite.execute("PRAGMA foreign_keys = ON;");
        setDb(sqlite);
        
        const resStaff = await sqlite.select<any[]>("SELECT * FROM staff ORDER BY id ASC");
        setStaffList(resStaff);
      } catch (error) { console.error(error); }
    };
    init();
  }, []);

  const refreshData = async () => {
    if (!db) return;
    const resStaff = await db.select<any[]>("SELECT * FROM staff ORDER BY id ASC");
    setStaffList(resStaff);
  };

  // タブが切り替わった時に削除確認をリセットする
  useEffect(() => { 
    setDeletingId(null); // ✨ 別の画面に行ったら削除のことは一旦忘れる
  }, [activeTab]);

  // フォームをクリアする
  const clearForm = () => {
    setTargetId(""); setTargetName(""); setTargetFurigana(""); setTargetBirthday(""); 
    setTargetZip(""); setTargetAddress(""); setTargetCommuteWage(0);
    setEditingId(null);
  };

  // 編集モードに入る
  const startEdit = (s: any) => {
    setDeletingId(null); // ✨ 削除モードを解除してから編集を開く
    setEditingId(s.id);
    setTargetId(s.id);
    setTargetName(s.name);
    setTargetFurigana(s.furigana);
    setTargetBirthday(s.birthday);
    setTargetJoinDate(s.join_date);
    setTargetZip(s.zip_code);
    setTargetAddress(s.address);
    setTargetWage(s.hourly_wage);
    setTargetCommuteType(s.commute_type);
    setTargetCommuteWage(s.commute_wage);
    setShowForm(true);
  };

  const isIdDuplicated = () => {
    // 編集モード、または「保存完了演出中」はチェックしない
    if (editingId || isSaving) return false;
    if (!targetId.trim()) return false;
    
    return staffList.some(s => String(s.id) === String(targetId).trim());
  };
  // フォームが「保存可能な状態」かどうかを判定
  const canSave = () => {
    const hasRequiredFields = targetId.trim() !== "" && targetName.trim() !== "";
    const noDuplicate = !isIdDuplicated();
    const hasChanges = isChanged(); // 編集時は変更があること
    const notSaving = !isSaving;    // 保存中でないこと

    return hasRequiredFields && noDuplicate && hasChanges && notSaving;
  };

  // --- 判定ロジック（型変換を入れて確実にする） ---
  const isChanged = () => {
    if (!editingId) return true; 
    const original = staffList.find(s => String(s.id) === String(editingId));
    if (!original) return true;

    return (
      String(targetName) !== String(original.name) ||
      String(targetFurigana) !== String(original.furigana || "") ||
      Number(targetWage) !== Number(original.hourly_wage) ||
      String(targetBirthday) !== String(original.birthday || "") ||
      String(targetJoinDate) !== String(original.join_date || "") ||
      String(targetZip) !== String(original.zip_code || "") ||
      String(targetAddress) !== String(original.address || "") ||
      String(targetCommuteType) !== String(original.commute_type) ||
      Number(targetCommuteWage) !== Number(original.commute_wage)
    );
  };

  // --- 保存処理（超・安全版） ---
  const saveStaff = async () => {
    if (!db || !targetId || !targetName) return alert("IDと名前は必須です");
    
    // IDを確実に文字列にする
    const safeId = String(targetId).trim();

    try {
      if (editingId) {
        // 更新 (UPDATE)
        console.log("Updating ID:", safeId);
        await db.execute(
          `UPDATE staff SET name=?, furigana=?, birthday=?, join_date=?, zip_code=?, address=?, hourly_wage=?, commute_type=?, commute_wage=? WHERE id=?`,
          [targetName, targetFurigana, targetBirthday, targetJoinDate, targetZip, targetAddress, Number(targetWage), targetCommuteType, Number(targetCommuteWage), safeId]
        );
      } else {
        // 新規 (INSERT)
        console.log("Inserting ID:", safeId);
        await db.execute(
          "INSERT INTO staff (id, name, furigana, birthday, join_date, zip_code, address, hourly_wage, commute_type, commute_wage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
          [safeId, targetName, targetFurigana, targetBirthday, targetJoinDate, targetZip, targetAddress, Number(targetWage), targetCommuteType, Number(targetCommuteWage)]
        );
      }
      
      setIsSaving(true); 
      await refreshData(); // 🔄 ここで確実に再読み込みを待つ
      
      setTimeout(() => {
        setIsSaving(false);
        setShowForm(false);
        clearForm();
      }, 800); 

    } catch (e) { 
      console.error("Database Error:", e);
      alert("保存エラー: " + e); 
    }
  };

  // --- 削除機能（デバッグ強化版） ---
  const deleteStaff = async (id: any, name: string) => {
    console.log("削除ボタンが押されました:", id, name);
    
    if (!db) return;

    // 一旦 confirm をコメントアウトして強制実行します
    // const confirmed = window.confirm(`削除しますか？`);
    // if (!confirmed) return;

    try {
      const safeId = String(id);
      await db.execute("DELETE FROM staff WHERE id = ?", [safeId]);
      
      console.log("削除成功。一覧を更新します。");
      await refreshData();
      // alert ではなくコンソールで確認
    } catch (e) {
      console.error("削除エラー:", e);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif", backgroundColor: "#f4f7f6" }}>
      <nav style={{ width: "220px", backgroundColor: "#2c3e50", color: "#ecf0f1", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px", fontSize: "20px", fontWeight: "bold", borderBottom: "1px solid #34495e" }}>⚓️ はま給与</div>
        <ul style={{ listStyle: "none", padding: "10px", margin: 0 }}>
          <li onClick={() => setActiveTab("staff")} style={{ padding: "12px 15px", cursor: "pointer", borderRadius: "5px", marginBottom: "5px", backgroundColor: activeTab === "staff" ? "#3498db" : "transparent" }}>👤 従業員管理</li>
          <li onClick={() => setActiveTab("attendance")} style={{ padding: "12px 15px", cursor: "pointer", borderRadius: "5px", backgroundColor: activeTab === "attendance" ? "#3498db" : "transparent" }}>📅 勤務・給与</li>
        </ul>
      </nav>

      <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
        {activeTab === "staff" && (
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#2c3e50", margin: 0 }}>👤 従業員詳細管理</h2>
              <button onClick={() => { setDeletingId(null); if(showForm) clearForm(); setShowForm(!showForm); }} style={{ backgroundColor: showForm ? "#95a5a6" : "#3498db", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                {showForm ? "✖ 閉じる" : "＋ 新規登録"}
              </button>
            </div>

            {showForm && (
              <section style={{ 
                ...cardStyle, 
                border: editingId ? "2px solid #f1c40f" : "1px solid #3498db",
                animation: "slideDown 0.3s ease-out" 
              }}>
                <h3 style={{ marginTop: 0, fontSize: "18px" }}>
                  {editingId ? "📝 従業員情報の編集" : "✨ 新規従業員登録"}
                </h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h4 style={{ borderLeft: "4px solid #3498db", paddingLeft: "10px", margin: "0 0 5px 0", fontSize: "14px" }}>基本情報・給与</h4>
                    
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>従業員ID {editingId && "(固定)"}</label>
                        <input 
                          placeholder="Ex: 001" 
                          value={targetId} 
                          onChange={e => setTargetId(e.target.value)} 
                          style={{ 
                            ...inputStyle, 
                            borderColor: isIdDuplicated() ? "#e74c3c" : "#ddd", // 重複なら赤く
                            backgroundColor: isIdDuplicated() ? "#fff5f5" : "white"
                          }} 
                          disabled={!!editingId} 
                        />
                        {isIdDuplicated() && (
                          <span style={{ color: "#e74c3c", fontSize: "10px", fontWeight: "bold", marginTop: "4px", display: "block" }}>
                            ⚠️ このIDは既に使用されています
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 2 }}>
                        <label style={labelStyle}>氏名</label>
                        <input placeholder="浜 太郎" value={targetName} onChange={e => setTargetName(e.target.value)} style={inputStyle} />
                      </div>
                    </div>

                    <label style={labelStyle}>ふりがな</label>
                    <input placeholder="はま たろう" value={targetFurigana} onChange={e => setTargetFurigana(e.target.value)} style={inputStyle} />
                    
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>基本時給 (円)</label>
                        <input type="number" value={targetWage} onChange={e => setTargetWage(Number(e.target.value))} style={inputStyle} />
                      </div>
                      <div style={{ flex: 1, backgroundColor: "#f8fafc", padding: "8px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <label style={labelStyle}>交通費区分</label>
                        <select value={targetCommuteType} onChange={e => setTargetCommuteType(e.target.value)} style={{ ...inputStyle, border: "none", background: "transparent", padding: "5px" }}>
                          <option value="none">支給なし</option>
                          <option value="daily">日額 (実費)</option>
                          <option value="monthly">月額 (定期)</option>
                        </select>
                      </div>
                    </div>

                    {targetCommuteType !== 'none' && (
                      <div style={{ animation: "fadeIn 0.3s" }}>
                        <label style={labelStyle}>交通費 金額 (円)</label>
                        <input type="number" value={targetCommuteWage} onChange={e => setTargetCommuteWage(Number(e.target.value))} style={inputStyle} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h4 style={{ borderLeft: "4px solid #e67e22", paddingLeft: "10px", margin: "0 0 5px 0", fontSize: "14px" }}>入社・連絡先</h4>
                    
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>生年月日</label>
                        <input type="date" value={targetBirthday} onChange={e => setTargetBirthday(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>入社日</label>
                        <input type="date" value={targetJoinDate} onChange={e => setTargetJoinDate(e.target.value)} style={inputStyle} />
                      </div>
                    </div>

                    <label style={labelStyle}>郵便番号</label>
                    <input placeholder="000-0000" value={targetZip} onChange={e => setTargetZip(e.target.value)} style={inputStyle} />
                    
                    <label style={labelStyle}>住所</label>
                    <textarea 
                      placeholder="東京都港区..." 
                      value={targetAddress} 
                      onChange={e => setTargetAddress(e.target.value)} 
                      style={{ ...inputStyle, height: "85px", resize: "none" }} 
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "25px" }}>
                  <button 
                    onClick={saveStaff} 
                    disabled={!canSave()} // ✨ まとめてスッキリ！
                    style={{ 
                      ...btnStyle, 
                      flex: 2, 
                      // 色の出し分け（優先順位：保存完了 > 重複 > 入力不足 > 変更なし > 登録）
                      backgroundColor: isSaving ? "#3498db" : 
                                      isIdDuplicated() ? "#e74c3c" : 
                                      (targetId.trim() === "" || targetName.trim() === "") ? "#cbd5e1" :
                                      (!isChanged() ? "#95a5a6" : (editingId ? "#f1c40f" : "#2ecc71")),
                      cursor: canSave() ? "pointer" : "not-allowed",
                      color: "white"
                    }}
                  >
                    {isSaving ? "✅ 保存が完了しました！" : 
                    isIdDuplicated() ? "⚠️ IDが重複しています" : 
                    (targetId.trim() === "" || targetName.trim() === "") ? "IDと名前を入力してください" :
                    (editingId ? (isChanged() ? "更新を保存する" : "変更はありません") : "新規登録を確定する")}
                  </button>
                  <button 
                    onClick={() => { clearForm(); setShowForm(false); }} 
                    style={{ ...btnStyle, flex: 1, backgroundColor: "#94a3b8", boxShadow: "0 4px 0 #64748b" }}
                  >
                    キャンセル
                  </button>
                </div>
              </section>
            )}

            <section style={cardStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={thGroupStyle}><th style={thStyle}>ID</th><th style={thStyle}>氏名 / ふりがな</th><th style={thStyle}>生年月日 / 年齢</th><th style={thStyle}>入社日</th><th style={thStyle}>基本時給</th><th style={{ ...thStyle, textAlign: "center" }}>操作</th></tr>
                </thead>
                <tbody>
                  {staffList.map(s => {
                    const getAge = (birthday: string) => {
                      if (!birthday) return "-";
                      const birth = new Date(birthday);
                      const today = new Date();
                      let age = today.getFullYear() - birth.getFullYear();
                      const m = today.getMonth() - birth.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                      return `${age}歳`;
                    };
                    const getTenure = (joinDate: string) => {
                      if (!joinDate) return "-";
                      const start = new Date(joinDate);
                      const today = new Date();
                      let years = today.getFullYear() - start.getFullYear();
                      let months = today.getMonth() - start.getMonth();
                      if (months < 0) { years--; months += 12; }
                      return years === 0 ? `${months}ヶ月` : `${years}年 ${months}ヶ月`;
                    };
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={tdStyle}>{s.id}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: "bold", fontSize: "15px" }}>{s.name}</div>
                          <div style={{ fontSize: "11px", color: "#7f8c8d" }}>{s.furigana}</div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: "13px" }}>{s.birthday || "-"}</div>
                          <div style={{ fontSize: "11px", color: "#e67e22" }}>{getAge(s.birthday)}</div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: "13px" }}>{s.join_date || "-"}</div>
                          <div style={{ fontSize: "11px", color: "#3498db", fontWeight: "bold" }}>{getTenure(s.join_date)}</div>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: "bold", color: "#2c3e50" }}>{s.hourly_wage.toLocaleString()}円</td>
                        <td style={{ ...tdStyle, textAlign: "center", width: "160px", minWidth: "160px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", justifyContent: "center", gap: "8px", width: "100%" }}>
                            {deletingId === s.id ? (
                              <div style={{ display: "inline-flex", justifyContent: "center", gap: "8px", width: "100%" }}>
                                <button 
                                  className="dangerous-btn" 
                                  onClick={async () => { 
                                    await deleteStaff(s.id, s.name); // ✨ ここで関数を呼び出す！
                                    setDeletingId(null); 
                                  }} 
                                  style={{ ...modernIconBtnStyle("#ff0000"), width: "75px" }}
                                >
                                  削除！
                                </button>
                                <button onClick={() => setDeletingId(null)} style={{ ...modernIconBtnStyle("#34495e"), width: "75px" }}>戻る</button>
                              </div>
                            ) : (
                              <>
                                <button onClick={() => startEdit(s)} style={{ ...modernIconBtnStyle("#3498db"), width: "75px" }}>編集</button>
                                <button onClick={() => setDeletingId(s.id)} style={{ ...modernIconBtnStyle("#e74c3c"), width: "75px" }}>削除</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {activeTab === "attendance" && db && (
          // ✨ 専門家を呼び出す。必要な道具（props）を渡してあげる。
          <AttendanceManager 
            db={db} 
            staffList={staffList}
            targetYear={targetYear}
            setTargetYear={setTargetYear}
            targetMonth={targetMonth}
            setTargetMonth={setTargetMonth}
          />
        )}
      </div>
    </div>
  );
}

// 💀 ヤバいボタン用のアニメーション
const injectDangerousStyles = () => {
  if (typeof document === 'undefined') return;
  // 二重に追加されないようにチェック
  if (document.getElementById('dangerous-style')) return;

  const style = document.createElement('style');
  style.id = 'dangerous-style';
  style.innerHTML = `
    @keyframes pulse-red {
      0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
      70% { box-shadow: 0 0 0 15px rgba(255, 0, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
    }
    @keyframes shake-extreme {
      0% { transform: translate(1px, 1px); }
      20% { transform: translate(-2px, -1px); }
      40% { transform: translate(-2px, 2px); }
      60% { transform: translate(2px, 1px); }
      80% { transform: translate(1px, -2px); }
      100% { transform: translate(-1px, 1px); }
    }
    .dangerous-btn {
      animation: pulse-red 1.2s infinite !important; /* 少し鼓動を速く */
      background-color: #ff0000 !important;
      color: white !important;
      border: 1px solid #b30000 !important;
      font-weight: 900 !important;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    }
    .dangerous-btn:hover {
      animation: shake-extreme 0.1s infinite !important; /* 超高速震動 */
      background-color: #e60000 !important;
      /* cursor指定を削除しました */
    }
  `;
  document.head.appendChild(style);
};
injectDangerousStyles();

const cardStyle = { backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", marginBottom: "20px" };
const inputStyle = { padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", width: "100%", boxSizing: "border-box" };
const labelStyle = { fontSize: "12px", color: "#7f8c8d", marginBottom: "2px", display: "block" };
const thGroupStyle = { textAlign: "left", borderBottom: "2px solid #eee", backgroundColor: "#fcfcfc" };
const thStyle = { padding: "12px", fontSize: "14px", color: "#7f8c8d" };
const tdStyle = { padding: "12px", fontSize: "14px" };
const btnStyle = { backgroundColor: "#2ecc71", color: "white", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" };

export default App;
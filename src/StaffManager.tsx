import React, { useState, useEffect } from "react";
// @ts-ignore
import Database from "@tauri-apps/plugin-sql";
import { modernIconBtnStyle } from "./utils";

interface Props {
    db: Database;
    onDataChange: () => void; // データが更新されたことを親に知らせる
    staffList: any[];
}

export default function StaffManager({ db, onDataChange, staffList }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // --- フォーム用ステート ---
    const [targetId, setTargetId] = useState("");
    const [targetName, setTargetName] = useState("");
    const [targetFurigana, setTargetFurigana] = useState("");
    const [targetBirthday, setTargetBirthday] = useState("");
    const [targetWage, setTargetWage] = useState(1200);
    const [targetJoinDate, setTargetJoinDate] = useState(new Date().toISOString().split('T')[0]);
    const [targetZip, setTargetZip] = useState("");
    const [targetAddress, setTargetAddress] = useState("");
    const [targetPhone, setTargetPhone] = useState("");
    const [targetMobile, setTargetMobile] = useState("");
    const [targetCommuteType, setTargetCommuteType] = useState("daily");
    const [targetCommuteWage, setTargetCommuteWage] = useState(0);
    const [targetWageType, setTargetWageType] = useState("hourly");
    const [targetDependents, setTargetDependents] = useState(0);
    const [targetResidentTax, setTargetResidentTax] = useState(0);

    const [branches, setBranches] = useState<any[]>([]);
    const [targetBranchId, setTargetBranchId] = useState(0); // 0（本店）をデフォルトに

    const clearForm = () => {
        setTargetId(""); setTargetName(""); setTargetFurigana(""); setTargetBirthday(""); 
        setTargetZip(""); setTargetAddress(""); setTargetPhone(""); setTargetMobile(""); setTargetCommuteWage(0);
        setTargetBranchId(0); setTargetDependents(0); setTargetResidentTax(0);
        setEditingId(null);
    };

    const startEdit = (s: any) => {
        setDeletingId(null);
        setEditingId(s.id);
        setTargetId(s.id);
        setTargetName(s.name);
        setTargetFurigana(s.furigana || "");
        setTargetBirthday(s.birthday || "");
        setTargetJoinDate(s.join_date || "");
        setTargetZip(s.zip_code || "");
        setTargetAddress(s.address || "");
        setTargetPhone(s.phone || ""); // 👈 追加
        setTargetMobile(s.mobile || ""); // 👈 追加
        setTargetWage(s.hourly_wage);
        setTargetCommuteType(s.commute_type);
        setTargetCommuteWage(s.commute_wage);
        setTargetWageType(s.wage_type || "hourly");
        setTargetBranchId(s.branch_id || 0); // 👈 追加
        setTargetDependents(s.dependents_count || 0);
        setTargetResidentTax(s.resident_tax || 0);
        setShowForm(true);
    };

    const isIdDuplicated = () => {
        if (editingId || isSaving) return false;
        if (!targetId.trim()) return false;
        return staffList.some(s => String(s.id) === String(targetId).trim());
    };

    const isChanged = () => {
        if (!editingId) return true; 
        const original = staffList.find(s => String(s.id) === String(editingId));
        if (!original) return true;

        return (
            String(targetWageType) !== String(original.wage_type || "hourly") ||
            String(targetName) !== String(original.name) ||
            String(targetFurigana) !== String(original.furigana || "") ||
            Number(targetWage) !== Number(original.hourly_wage) ||
            String(targetBirthday) !== String(original.birthday || "") ||
            String(targetJoinDate) !== String(original.join_date || "") ||
            String(targetZip) !== String(original.zip_code || "") ||
            String(targetAddress) !== String(original.address || "") ||
            String(targetPhone) !== String(original.phone || "") || // 👈 追加
            String(targetMobile) !== String(original.mobile || "") || // 👈 追加
            String(targetCommuteType) !== String(original.commute_type) ||
            Number(targetCommuteWage) !== Number(original.commute_wage) ||
            Number(targetBranchId) !== Number(original.branch_id || 0) || // 👈 追加
            Number(targetDependents) !== Number(original.dependents_count || 0) ||
            Number(targetResidentTax) !== Number(original.resident_tax || 0)
        );
    };

    const canSave = () => {
        const hasRequiredFields = targetId.trim() !== "" && targetName.trim() !== "";
        return hasRequiredFields && !isIdDuplicated() && isChanged() && !isSaving;
    };

    const saveStaff = async () => {
        if (!db || !targetId || !targetName) return;
        const safeId = String(targetId).trim();
        setIsSaving(true);
        try {
            if (editingId) {
                await db.execute(
                    `UPDATE staff SET name=?, furigana=?, birthday=?, join_date=?, zip_code=?, address=?, phone=?, mobile=?, wage_type=?, hourly_wage=?, commute_type=?, commute_wage=?, branch_id=?, dependents_count=?, resident_tax=? WHERE id=?`,
                    [targetName, targetFurigana, targetBirthday, targetJoinDate, targetZip, targetAddress, targetPhone, targetMobile, targetWageType, Number(targetWage), targetCommuteType, Number(targetCommuteWage), Number(targetBranchId), Number(targetDependents), Number(targetResidentTax), safeId]
                );
            } else {
                await db.execute(
                    "INSERT INTO staff (id, name, furigana, birthday, join_date, zip_code, address, phone, mobile, wage_type, hourly_wage, commute_type, commute_wage, branch_id, dependents_count, resident_tax) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                    [safeId, targetName, targetFurigana, targetBirthday, targetJoinDate, targetZip, targetAddress, targetPhone, targetMobile, targetWageType, Number(targetWage), targetCommuteType, Number(targetCommuteWage), Number(targetBranchId), Number(targetDependents), Number(targetResidentTax)]
                );
            }
            onDataChange(); // 親のリストを更新
            setTimeout(() => {
                setIsSaving(false);
                setShowForm(false);
                clearForm();
            }, 800);
        } catch (e) {
            alert("保存エラー: " + e);
            setIsSaving(false);
        }
    };

    const deleteStaff = async (id: any) => {
        try {
            await db.execute("DELETE FROM staff WHERE id = ?", [String(id)]);
            onDataChange();
        } catch (e) {
            console.error(e);
        }
    };

    // 店舗リストを取得する関数
    const fetchBranches = async () => {
    if (!db) return;
    const res = await db.select<any[]>("SELECT * FROM branches ORDER BY id ASC");
    setBranches(res);
    };

    // コンポーネント表示時や staffList が変わった時に店舗情報も更新
    useEffect(() => {
    fetchBranches();
    }, [db]);

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ color: "#2c3e50", margin: 0 }}>👤 従業員詳細管理</h2>
                <button onClick={() => { setDeletingId(null); if(showForm) clearForm(); setShowForm(!showForm); }} style={{ backgroundColor: showForm ? "#95a5a6" : "#3498db", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                    {showForm ? "✖ 閉じる" : "＋ 新規登録"}
                </button>
            </div>

            {showForm && (
                <section style={{ ...cardStyle, border: editingId ? "2px solid #f1c40f" : "1px solid #3498db" }}>
                    <h3 style={{ marginTop: 0, fontSize: "18px" }}>{editingId ? "📝 従業員情報の編集" : "✨ 新規従業員登録"}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                        {/* 左側：基本情報・給与（こちらに日付移動） */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <h4 style={{ borderLeft: "4px solid #3498db", paddingLeft: "10px", margin: "0 0 5px 0", fontSize: "14px" }}>基本情報・給与</h4>
                            
                            {/* 1段目：IDと氏名 */}
                            <div style={{ display: "flex", gap: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>従業員ID {editingId && "(固定)"}</label>
                                    <input placeholder="001" value={targetId} onChange={e => setTargetId(e.target.value)} style={{ ...inputStyle, borderColor: isIdDuplicated() ? "#e74c3c" : "#ddd" }} disabled={!!editingId} />
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label style={labelStyle}>氏名</label>
                                    <input placeholder="浜 太郎" value={targetName} onChange={e => setTargetName(e.target.value)} style={inputStyle} />
                                    {/* 氏名の真下にふりがなを配置（ラベルなしでスッキリ） */}
                                    <input placeholder="はま たろう" value={targetFurigana} onChange={e => setTargetFurigana(e.target.value)} style={{ ...inputStyle, marginTop: "4px", fontSize: "12px", height: "30px" }} />
                                </div>
                            </div>

                            {/* 2段目：生年月日と入社日 */}
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

                            {/* 3段目：給与区分と基本給（横並び） */}
                            <div style={{ display: "flex", gap: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>給与区分</label>
                                    <select 
                                        value={targetWageType} 
                                        onChange={e => setTargetWageType(e.target.value)} 
                                        style={{ ...inputStyle, height: "38px" }} /* 👈 inputと同じ高さに固定 */
                                    >
                                        <option value="hourly">⏱️ 時給制</option>
                                        <option value="monthly">📅 月給制</option>
                                    </select>
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label style={labelStyle}>
                                        {targetWageType === "hourly" ? "基本時給" : "基本月給"}
                                    </label>
                                    {/* 単位を表示するためのコンテナ */}
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <input 
                                        type="number" 
                                        value={targetWage} 
                                        onChange={e => setTargetWage(Number(e.target.value))} 
                                        style={{ 
                                            ...inputStyle, 
                                            paddingRight: "50px" // 右側に単位が入るスペースを確保
                                        }} 
                                        />
                                        <span style={{ 
                                        position: "absolute", 
                                        right: "12px", 
                                        fontSize: "12px", 
                                        color: "#7f8c8d",
                                        pointerEvents: "none" // 単位をクリックしても入力の邪魔をしない
                                        }}>
                                        {targetWageType === "hourly" ? "円 / 時" : "円 / 月"}
                                        </span>
                                    </div>
                                </div>
                            </div>    
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <h4 style={{ borderLeft: "4px solid #e67e22", paddingLeft: "10px", margin: "0 0 5px 0", fontSize: "14px" }}>連絡先・住所</h4>
                            <label style={labelStyle}>郵便番号</label>
                            <input value={targetZip} onChange={e => setTargetZip(e.target.value)} style={inputStyle} />
                            <label style={labelStyle}>住所</label>
                            <textarea value={targetAddress} onChange={e => setTargetAddress(e.target.value)} style={{ ...inputStyle, height: "80px", resize: "none" }} />
                            {/* 電話番号・携帯電話を横並びに追加 */}
                            <div style={{ display: "flex", gap: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>電話番号</label>
                                    <input placeholder="03-xxxx-xxxx" value={targetPhone} onChange={e => setTargetPhone(e.target.value)} style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>携帯電話</label>
                                    <input placeholder="090-xxxx-xxxx" value={targetMobile} onChange={e => setTargetMobile(e.target.value)} style={inputStyle} />
                                </div>
                            </div>
                        </div>
                    
                        <div style={{ marginTop: "20px" }}>
                            <h4 style={{ borderLeft: "4px solid #9b59b6", paddingLeft: "10px", margin: "0 0 10px 0", fontSize: "14px" }}>税・社保・所属設定</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={labelStyle}>所属店舗</label>
                                    <select 
                                        value={targetBranchId} 
                                        onChange={e => setTargetBranchId(Number(e.target.value))} 
                                        style={inputStyle}
                                    >
                                        {branches.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} ({b.prefecture})
                                        </option>
                                        ))}
                                    </select>
                                    <div style={{ fontSize: "10px", color: "#9b59b6", marginTop: "4px" }}>
                                        ※健康保険料率は店舗の所在地に基づきます
                                    </div>
                                </div>
                                
                                <div>
                                    <label style={labelStyle}>扶養人数（所得税）</label>
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <input type="number" value={targetDependents} onChange={e => setTargetDependents(Number(e.target.value))} style={{ ...inputStyle, paddingRight: "30px" }} />
                                        <span style={{ position: "absolute", right: "10px", fontSize: "12px", color: "#7f8c8d", pointerEvents: "none" }}>人</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label style={labelStyle}>住民税額（月額）</label>
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <input type="number" value={targetResidentTax} onChange={e => setTargetResidentTax(Number(e.target.value))} style={{ ...inputStyle, paddingRight: "40px" }} />
                                        <span style={{ position: "absolute", right: "10px", fontSize: "12px", color: "#7f8c8d", pointerEvents: "none" }}>円</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "25px" }}>
                        <button onClick={saveStaff} disabled={!canSave()} style={{ ...btnStyle, flex: 2, backgroundColor: isSaving ? "#3498db" : (canSave() ? (editingId ? "#f1c40f" : "#2ecc71") : "#cbd5e1") }}>
                            {isSaving ? "✅ 保存中..." : (editingId ? "更新を保存" : "新規登録")}
                        </button>
                        <button onClick={() => { clearForm(); setShowForm(false); }} style={{ ...btnStyle, flex: 1, backgroundColor: "#94a3b8" }}>キャンセル</button>
                    </div>
                </section>
            )}

            <section style={cardStyle}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={thGroupStyle}>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>氏名</th>
                        <th style={thStyle}>給与形態</th>
                        <th style={{ ...thStyle, textAlign: "center" }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffList.map(s => (
                            <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={tdStyle}>{s.id}</td>
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: "bold" }}>{s.name}</div>
                                    <div style={{ fontSize: "11px", color: "#7f8c8d" }}>{s.furigana}</div>
                                </td>
                                <td style={tdStyle}>{s.wage_type === "monthly" ? "月給" : "時給"} {s.hourly_wage.toLocaleString()}円</td>
                                <td style={{ ...tdStyle, textAlign: "center" }}>
                                    {deletingId === s.id ? (
                                        <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                                            <button className="dangerous-btn" onClick={() => deleteStaff(s.id)} style={modernIconBtnStyle("#ff0000")}>削除</button>
                                            <button onClick={() => setDeletingId(null)} style={modernIconBtnStyle("#34495e")}>戻る</button>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                                            <button onClick={() => startEdit(s)} style={modernIconBtnStyle("#3498db")}>編集</button>
                                            <button onClick={() => setDeletingId(s.id)} style={modernIconBtnStyle("#e74c3c")}>削除</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}

const cardStyle = { backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", marginBottom: "20px" };
const inputStyle = { padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", width: "100%", boxSizing: "border-box" as const };
const labelStyle = { fontSize: "12px", color: "#7f8c8d", marginBottom: "2px", display: "block" };
const thGroupStyle = { textAlign: "left" as const, borderBottom: "2px solid #eee", backgroundColor: "#fcfcfc" };
const thStyle = { padding: "12px", fontSize: "14px", color: "#7f8c8d" };
const tdStyle = { padding: "12px", fontSize: "14px" };
const btnStyle = { color: "white", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" as const };
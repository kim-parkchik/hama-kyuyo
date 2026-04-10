import { useState } from "react";
// @ts-ignore
import Database from "@tauri-apps/plugin-sql";
import PayStubModal from "./PayStubModal"; 

interface Props {
  db: Database;
  staffList: any[];
  targetYear: number;
  targetMonth: number;
}

export default function PaySlipManager({ db, staffList, targetYear, targetMonth }: Props) {
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  const loadStaffData = async (staff: any) => {
    const monthStr = String(targetMonth).padStart(2, '0');
    const datePattern = `${targetYear}-${monthStr}-%`;
    const res = await db.select<any[]>(
      "SELECT * FROM attendance WHERE staff_id = ? AND work_date LIKE ?",
      [staff.id, datePattern]
    );
    setAttendanceData(res || []);
    setSelectedStaff(staff);
    setShowModal(true);
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ color: "#2c3e50" }}>📄 給与明細の発行</h2>
      <p>対象年月: {targetYear}年{targetMonth}月</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px", marginTop: "20px" }}>
        {staffList.map(s => (
          <div 
            key={s.id} 
            onClick={() => loadStaffData(s)}
            style={{ padding: "20px", background: "#fff", borderRadius: "10px", cursor: "pointer", border: "1px solid #ddd", textAlign: "center" }}
          >
            <div style={{ fontWeight: "bold" }}>{s.name}</div>
            <button style={{ marginTop: "10px", cursor: "pointer" }}>明細を表示</button>
          </div>
        ))}
      </div>

      {showModal && selectedStaff && (
        <PayStubModal 
          staff={selectedStaff}
          attendanceData={attendanceData}
          year={targetYear}
          month={targetMonth}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
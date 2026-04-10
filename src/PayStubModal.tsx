import React, { useState } from 'react';

const formatHours = (num: number) => {
    const h = Math.floor(num);
    const m = Math.round((num - h) * 60);
    return `${h}:${String(m).padStart(2, '0')}`;
};

interface Props {
    staff: any;
    attendanceData: any[];
    year: number;
    month: number;
    onClose: () => void;
}

export default function PayStubModal({ staff, attendanceData, year, month, onClose }: Props) {
    const [extras, setExtras] = useState({
        allowanceName: "役職手当", allowanceAmount: 0,
        healthInsurance: 0,    // 健康保険
        welfarePension: 0,     // 厚生年金
        empInsurance: 0,       // 雇用保険
        incomeTax: 0,          // 所得税
        residentTax: 0,        // 住民税
    });

    // --- 計算ロジック ---
    let totalWorkHours = 0;
    let totalNightHours = 0;
    let totalOvertimeHours = 0;
    
    let basePay = 0;
    let overtime25Pay = 0;
    let overtime50Pay = 0;
    let nightPay = 0;

    attendanceData.forEach(row => {
        const h = Number(row.work_hours) || 0;
        const n = Number(row.night_hours) || 0;
        const wage = Number(row.actual_hourly_wage) || Number(staff?.hourly_wage) || 0;
        
        totalWorkHours += h;
        totalNightHours += n;

        const dailyOvertime = Math.max(0, h - 8);
        
        for (let i = 0; i < dailyOvertime; i += 0.01) {
            if (totalOvertimeHours < 60) {
                overtime25Pay += (wage * 0.25 * 0.01);
            } else {
                overtime50Pay += (wage * 0.50 * 0.01);
            }
            totalOvertimeHours += 0.01;
        }

        basePay += (wage * h);
        nightPay += (wage * 0.25 * n);
    });

    const workDays = attendanceData.length;
    const commutePay = staff?.commute_type === "daily" 
        ? ((Number(staff?.commute_wage) || 0) * workDays) 
        : (staff?.commute_type === "monthly" ? (Number(staff?.commute_wage) || 0) : 0);

    const totalEarnings = Math.ceil(basePay + overtime25Pay + overtime50Pay + nightPay) + commutePay + extras.allowanceAmount;
    // 控除合計を詳細項目から計算
    const totalDeductions = extras.healthInsurance + extras.welfarePension + extras.empInsurance + extras.incomeTax + extras.residentTax;
    const netPay = totalEarnings - totalDeductions;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '900px', maxHeight: '95vh', overflowY: 'auto', color: '#000' }}>
                
                {/* 調整エリア：詳細5項目 */}
                <div className="no-print" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f4f8', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0 }}>📊 社会保険・税金の入力</h3>
                        <button onClick={onClose} style={{ cursor: 'pointer' }}>閉じる</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                        <div><label style={sLabel}>健康保険</label><input type="number" style={sInput} onChange={e => setExtras({...extras, healthInsurance: Number(e.target.value)})} /></div>
                        <div><label style={sLabel}>厚生年金</label><input type="number" style={sInput} onChange={e => setExtras({...extras, welfarePension: Number(e.target.value)})} /></div>
                        <div><label style={sLabel}>雇用保険</label><input type="number" style={sInput} onChange={e => setExtras({...extras, empInsurance: Number(e.target.value)})} /></div>
                        <div><label style={sLabel}>所得税</label><input type="number" style={sInput} onChange={e => setExtras({...extras, incomeTax: Number(e.target.value)})} /></div>
                        <div><label style={sLabel}>住民税</label><input type="number" style={sInput} onChange={e => setExtras({...extras, residentTax: Number(e.target.value)})} /></div>
                    </div>
                    <button onClick={() => window.print()} style={{ marginTop: '15px', width: '100%', padding: '10px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>🖨 印刷・PDF保存</button>
                </div>

                {/* 明細書本体 */}
                <div id="print-area" style={{ padding: '20px', backgroundColor: 'white' }}>
                    <h1 style={{ textAlign: 'center', letterSpacing: '10px', margin: '0 0 20px 0' }}>給与明細書</h1>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div style={{ fontSize: '18px', borderBottom: '1px solid #000', width: '250px', paddingBottom: '2px' }}>{staff.name} 様</div>
                        <div>{year} 年 {month} 月分</div>
                    </div>

                    <table style={tableStyle}>
                        <thead>
                            <tr style={thStyle}>
                                <th style={tdStyle}>出勤日数</th>
                                <th style={tdStyle}>総労働時間</th>
                                <th style={tdStyle}>時間外(残業)</th>
                                <th style={tdStyle}>うち60h超</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={tdCenter}>{workDays} 日</td>
                                <td style={tdCenter}>{formatHours(totalWorkHours)}</td>
                                <td style={tdCenter}>{formatHours(totalOvertimeHours)}</td>
                                <td style={tdCenter}>{formatHours(Math.max(0, totalOvertimeHours - 60))}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                        {/* 支給項目 */}
                        <div style={{ flex: 1 }}>
                            <table style={tableStyle}>
                                <thead><tr style={thStyle}><th colSpan={2} style={tdStyle}>支給項目</th></tr></thead>
                                <tbody>
                                    <tr><td style={tdStyle}>基本時給分</td><td style={rightTd}>¥{Math.ceil(basePay).toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>残業手当(25%増)</td><td style={rightTd}>¥{Math.ceil(overtime25Pay).toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>残業手当(50%増)</td><td style={rightTd}>¥{Math.ceil(overtime50Pay).toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>深夜手当(25%増)</td><td style={rightTd}>¥{Math.ceil(nightPay).toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>通勤手当</td><td style={rightTd}>¥{commutePay.toLocaleString()}</td></tr>
                                    <tr style={{ height: '31px' }}><td style={tdStyle}></td><td style={tdStyle}></td></tr>
                                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                                        <td style={tdStyle}>支給合計</td><td style={rightTd}>¥{totalEarnings.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 控除項目（詳細版） */}
                        <div style={{ flex: 1 }}>
                            <table style={tableStyle}>
                                <thead><tr style={thStyle}><th colSpan={2} style={tdStyle}>控除項目</th></tr></thead>
                                <tbody>
                                    <tr><td style={tdStyle}>健康保険</td><td style={rightTd}>¥{extras.healthInsurance.toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>厚生年金</td><td style={rightTd}>¥{extras.welfarePension.toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>雇用保険</td><td style={rightTd}>¥{extras.empInsurance.toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>所得税</td><td style={rightTd}>¥{extras.incomeTax.toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>住民税</td><td style={rightTd}>¥{extras.residentTax.toLocaleString()}</td></tr>
                                    <tr style={{ height: '31px' }}><td style={tdStyle}></td><td style={tdStyle}></td></tr>
                                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                                        <td style={tdStyle}>控除合計</td><td style={rightTd}>¥{totalDeductions.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-block', border: '2px solid #000', padding: '12px 25px' }}>
                            <span style={{ fontSize: '15px' }}>差引支払額：</span>
                            <span style={{ fontSize: '28px', fontWeight: 'bold' }}>¥{netPay.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background-color: white !important; }
                    #print-area { width: 100% !important; margin: 0 !important; padding: 0 !important; }
                }
            `}</style>
        </div>
    );
}

const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, border: '1px solid #000', fontSize: '12px' };
const thStyle = { backgroundColor: '#f2f2f2' };
const tdStyle = { border: '1px solid #000', padding: '8px' };
const tdCenter = { ...tdStyle, textAlign: 'center' as const };
const rightTd = { ...tdStyle, textAlign: 'right' as const };
const sInput = { width: '100%', padding: '4px', boxSizing: 'border-box' as const };
const sLabel = { fontSize: '10px', display: 'block', marginBottom: '2px' };
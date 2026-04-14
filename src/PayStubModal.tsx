import React, { useState } from 'react';
import { calculateSalary } from './calcSalary';

const formatHours = (num: number) => {
    const h = Math.floor(num);
    const m = Math.round((num - h) * 60);
    return `${h}:${String(m).padStart(2, '0')}`;
};

// 指定した数まで空行（tr）を生成する関数
const renderEmptyRows = (currentCount: number, targetCount: number) => {
    const rows = [];
    for (let i = currentCount; i < targetCount; i++) {
        rows.push(
            <tr key={`empty-${i}`} style={{ height: '35px' }}>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
            </tr>
        );
    }
    return rows;
};

interface Props {
    staff: any;
    attendanceData: any[];
    year: number;
    month: number;
    onClose: () => void;
}

export default function PayStubModal({ staff, attendanceData, year, month, onClose }: Props) {
    // 1. 手入力が必要な最小限の項目だけを State にする
    const [extras, setExtras] = useState({
        allowanceName: "役職手当",
        allowanceAmount: 0,
        residentTax: 0,      // 住民税だけは手入力
        prefecture: "東京",   // 健保の計算用
        dependents: 0        // 所得税の計算用
    });

    const salary = calculateSalary(staff, attendanceData, extras, year, month);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '900px', maxHeight: '95vh', overflowY: 'auto', color: '#000' }}>
                {/* 🆕 右上の閉じるボタンを追加 */}
                <button 
                    onClick={onClose} 
                    className="no-print"
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        border: 'none',
                        background: '#eee',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    ×
                </button>

                {/* 調整エリア：詳細5項目 */}
                <div className="no-print" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f4f8', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                        {/* エンジンが計算した結果を value に表示しつつ、変更もできるように */}
                        <div>
                            <label style={sLabel}>健康保険 (自動)</label>
                            <input type="number" style={sInput} value={salary.healthInsurance} readOnly />
                        </div>
                        <div>
                            <label style={sLabel}>介護保険 {salary.isNursingCareTarget ? "⚠️対象" : ""}</label>
                            <input type="number" style={sInput} value={salary.nursingInsurance} readOnly />
                        </div>
                        <div>
                            <label style={sLabel}>厚生年金 (自動)</label>
                            <input type="number" style={sInput} value={salary.welfarePension} readOnly />
                        </div>
                        <div>
                            <label style={sLabel}>所得税 (自動)</label>
                            <input type="number" style={sInput} value={salary.incomeTax} readOnly />
                        </div>
                        <div>
                            <label style={sLabel}>住民税 (手入力)</label>
                            <input type="number" style={sInput} value={extras.residentTax} onChange={e => setExtras({...extras, residentTax: Number(e.target.value)})} />
                        </div>
                    </div>
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
                                <td style={tdCenter}>{salary.workDays} 日</td>
                                <td style={tdCenter}>{formatHours(salary.totalWorkHours)}</td>
                                <td style={tdCenter}>{formatHours(salary.totalOvertimeHours)}</td>
                                <td style={tdCenter}>{formatHours(Math.max(0, salary.totalOvertimeHours - 60))}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                        {/* 支給項目 */}
                        <div style={{ flex: 1 }}>
                            <table style={tableStyle}>
                                <thead><tr style={thStyle}><th colSpan={2} style={tdStyle}>支給項目</th></tr></thead>
                                <tbody>
                                    <tr><td style={tdStyle}>基本時給分</td><td style={rightTd}>¥{Math.ceil(salary.basePay).toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>残業手当(25%増)</td><td style={rightTd}>¥{Math.ceil(salary.overtime25Pay).toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>残業手当(50%増)</td><td style={rightTd}>¥{Math.ceil(salary.overtime50Pay).toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>深夜手当(25%増)</td><td style={rightTd}>¥{Math.ceil(salary.nightPay).toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>通勤手当</td><td style={rightTd}>¥{salary.commutePay.toLocaleString()}</td></tr>
                                    {/* 現在5行なので、7行まで残り2行を自動生成 */}
                                    {renderEmptyRows(5, 7)}
                                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                                        <td style={tdStyle}>支給合計</td><td style={rightTd}>¥{salary.totalEarnings.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 控除項目（詳細版） */}
                        <div style={{ flex: 1 }}>
                            <table style={tableStyle}>
                                <thead><tr style={thStyle}><th colSpan={2} style={tdStyle}>控除項目</th></tr></thead>
                                <tbody>
                                    {/* 全て salary から取得するように変更します */}
                                    <tr><td style={tdStyle}>健康保険</td><td style={rightTd}>¥{salary.healthInsurance.toLocaleString()}</td></tr>
                                    <tr style={{ color: !salary.isNursingCareTarget ? '#ccc' : '#000' }}>
                                        <td style={tdStyle}>介護保険 {!salary.isNursingCareTarget && "(非該当)"}</td>
                                        <td style={rightTd}>¥{salary.nursingInsurance.toLocaleString()}</td>
                                    </tr>
                                    <tr><td style={tdStyle}>厚生年金</td><td style={rightTd}>¥{salary.welfarePension.toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>雇用保険</td><td style={rightTd}>¥{salary.empInsurance.toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>所得税</td><td style={rightTd}>¥{salary.incomeTax.toLocaleString()}</td></tr>
                                    <tr><td style={tdStyle}>住民税</td><td style={rightTd}>¥{salary.residentTax.toLocaleString()}</td></tr>
                                    {renderEmptyRows(6, 7)}
                                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                                        <td style={tdStyle}>控除合計</td><td style={rightTd}>¥{salary.totalDeductions.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-block', border: '2px solid #000', padding: '12px 25px' }}>
                            <span style={{ fontSize: '15px' }}>差引支払額：</span>
                            <span style={{ fontSize: '28px', fontWeight: 'bold' }}>¥{salary.netPay.toLocaleString()}</span>
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
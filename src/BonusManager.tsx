import React, { useState } from "react";
// @ts-ignore
import Database from "@tauri-apps/plugin-sql";
import * as Master from './constants/salaryMaster2026';

interface Props {
    db: Database;
    staffList: any[];
}

export default function BonusManager({ db, staffList }: Props) {
    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ color: "#2c3e50", margin: 0 }}>💰 賞与計算・管理</h2>
            </div>

            <section style={{ 
                padding: "40px", 
                textAlign: "center", 
                backgroundColor: "#f8f9fa", 
                border: "2px dashed #bdc3c7", 
                borderRadius: "12px",
                color: "#7f8c8d"
            }}>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>🏗️</div>
                <h3>賞与計算機能は現在設計中です</h3>
                <p>「達者な人」のアドバイスに基づき、以下の機能を実装予定：</p>
                <ul style={{ textAlign: "left", display: "inline-block", fontSize: "14px", lineHeight: "2" }}>
                    <li>✅ <b>標準賞与額</b>の自動算出（1,000円未満切り捨て）</li>
                    <li>✅ <b>前月給与</b>を参照した所得税率の自動決定</li>
                    <li>✅ 健康保険の<b>年度累計上限（573万円）</b>のチェック機能</li>
                    <li>✅ 賞与支払届（算定用データ）の書き出し</li>
                </ul>
            </section>
        </div>
    );
}
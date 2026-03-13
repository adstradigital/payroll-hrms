'use client';

import { useState, useEffect } from 'react';
import { mockClaims } from '@/api/reimbursementsApi';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './Reports.css';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

const Reports = () => {

  const [summary, setSummary] = useState({
    totalAmount: 0,
    approvedAmount: 0,
    pendingAmount: 0,
    categoriesTotal: {}
  });

  useEffect(() => {

    const total = mockClaims.reduce((sum, c) => sum + c.amount, 0);

    const approved = mockClaims
      .filter(c => c.status === 'approved')
      .reduce((sum, c) => sum + c.amount, 0);

    const pending = mockClaims
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0);

    const cats = mockClaims.reduce((acc, c) => {
      acc[c.category.name] = (acc[c.category.name] || 0) + c.amount;
      return acc;
    }, {});

    setSummary({
      totalAmount: total,
      approvedAmount: approved,
      pendingAmount: pending,
      categoriesTotal: cats
    });

  }, []);


  const chartData = Object.entries(summary.categoriesTotal).map(([name, value]) => ({
    name, value
  }));


  return (

    <div className="reports">

      <h2 className="report-title">Expense Reports</h2>

      {/* SUMMARY CARDS */}

      <div className="report-stats">

        <div className="report-stat-card">
          <span>Total Expenses</span>
          <h3>₹{summary.totalAmount.toLocaleString()}</h3>
        </div>

        <div className="report-stat-card success">
          <span>Approved</span>
          <h3>₹{summary.approvedAmount.toLocaleString()}</h3>
        </div>

        <div className="report-stat-card warning">
          <span>Pending</span>
          <h3>₹{summary.pendingAmount.toLocaleString()}</h3>
        </div>

      </div>


      {/* CHART */}

      <div className="report-flex">

        {/* CHART */}

        <div className="report-chart">

          <h4>Expenses by Category</h4>

          <div className="chart-wrapper">

            <ResponsiveContainer width="100%" height={280}>
              <PieChart>

                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                >

                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}

                </Pie>

                <Tooltip />

              </PieChart>
            </ResponsiveContainer>

            {/* CENTER VALUE */}

            <div className="chart-center">
              <span>Total</span>
              <b>₹{summary.totalAmount.toLocaleString()}</b>
            </div>

          </div>

        </div>


        {/* CATEGORY LIST */}

        <div className="report-category">

          <h4>Category Breakdown</h4>

          <ul>

            {Object.entries(summary.categoriesTotal).map(([cat, amt], index) => (

              <li key={cat}>

                <div className="cat-left">
                  <span
                    className="cat-dot"
                    style={{ background: COLORS[index % COLORS.length] }}
                  ></span>

                  <span>{cat}</span>
                </div>

                <b>₹{amt.toLocaleString()}</b>

              </li>

            ))}

          </ul>

        </div>

      </div>

    </div>

  );

};

export default Reports;
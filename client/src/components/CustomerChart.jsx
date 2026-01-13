"use client"

import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Simple custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function CustomChart({ type = "line" }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    )
  }

  const data = [
    { name: "T1", value: 4000, pv: 2400, amt: 2400 },
    { name: "T2", value: 3000, pv: 1398, amt: 2210 },
    { name: "T3", value: 2000, pv: 9800, amt: 2290 },
    { name: "T4", value: 2780, pv: 3908, amt: 2000 },
    { name: "T5", value: 1890, pv: 4800, amt: 2181 },
    { name: "T6", value: 2390, pv: 3800, amt: 2500 },
    { name: "T7", value: 3490, pv: 4300, amt: 2100 },
    { name: "T8", value: 3490, pv: 4300, amt: 2100 },
    { name: "T9", value: 3490, pv: 4300, amt: 2100 },
    { name: "T10", value: 3490, pv: 4300, amt: 2100 },
    { name: "T11", value: 3490, pv: 4300, amt: 2100 },
    { name: "T12", value: 3490, pv: 4300, amt: 2100 },
  ]

  const pieData = [
    { name: "Nhóm A", value: 400, color: "#10b981" },
    { name: "Nhóm B", value: 300, color: "#3b82f6" },
    { name: "Nhóm C", value: 300, color: "#8b5cf6" },
    { name: "Nhóm D", value: 200, color: "#ec4899" },
  ]

  if (type === "line") {
    return (
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis dataKey="name" stroke="rgba(0,0,0,0.5)" tick={{ fill: "rgba(0,0,0,0.5)", fontSize: 12 }} />
            <YAxis stroke="rgba(0,0,0,0.5)" tick={{ fill: "rgba(0,0,0,0.5)", fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="pv"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#3b82f6" }}
              activeDot={{ r: 6, fill: "#3b82f6" }}
              name="Số lượng"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4, fill: "#10b981" }}
              activeDot={{ r: 6, fill: "#10b981" }}
              name="Giá trị"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === "bar") {
    return (
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis dataKey="name" stroke="rgba(0,0,0,0.5)" tick={{ fill: "rgba(0,0,0,0.5)", fontSize: 12 }} />
            <YAxis stroke="rgba(0,0,0,0.5)" tick={{ fill: "rgba(0,0,0,0.5)", fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="pv" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Số lượng" />
            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Giá trị" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === "pie") {
    return (
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="h-[350px] w-full flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-gray-500">Chart type not supported</div>
    </div>
  )
}

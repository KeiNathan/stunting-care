import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Baby, Activity, Users, AlertTriangle } from 'lucide-react'

const COLORS_RISK    = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444' }
const COLORS_STUNTING= { Normal: '#22c55e', Stunting: '#f59e0b', 'Stunting Berat': '#ef4444' }

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-[#F0FDFA] rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user }      = useAuth()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/dashboard/statistik')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"/>
    </div>
  )

  const riskData = stats ? Object.entries(stats.distribusi_risiko).map(
    ([name, value]) => ({ name, value })
  ) : []

  const stuntingData = stats ? Object.entries(stats.distribusi_stunting).map(
    ([name, value]) => ({ name, value })
  ) : []
  const stuntingTotal = stuntingData.reduce(
    (total, item) => total + Number(item.value), 0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Selamat datang, <span className="font-medium text-teal-600">{user?.nama}</span>!
          Berikut ringkasan data monitoring stunting.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Baby size={22} className="text-teal-600"/>}
          label="Total Balita"
          value={stats?.total_balita ?? 0}
          color="bg-teal-50"
        />
        <StatCard
          icon={<Activity size={22} className="text-purple-600"/>}
          label="Total Pengukuran"
          value={stats?.total_pengukuran ?? 0}
          color="bg-purple-50"
        />
        <StatCard
          icon={<Users size={22} className="text-green-600"/>}
          label="Total Kader"
          value={stats?.total_kader ?? 0}
          color="bg-green-50"
        />
        <StatCard
          icon={<AlertTriangle size={22} className="text-red-600"/>}
          label="Risiko Tinggi"
          value={stats?.distribusi_risiko?.High ?? 0}
          color="bg-red-50"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar Chart — Distribusi Risiko */}
        <div className="bg-[#F0FDFA] rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Distribusi Tingkat Risiko Stunting
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={riskData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="name" tick={{ fontSize: 13 }}/>
              <YAxis tick={{ fontSize: 13 }}/>
              <Tooltip/>
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {riskData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS_RISK[entry.name] || '#6366f1'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — Status Stunting */}
        <div className="bg-[#F0FDFA] rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Status Stunting (Z-Score WHO)
          </h2>
          <div className="stunting-pie-chart">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={stuntingData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {stuntingData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS_STUNTING[entry.name] || '#6366f1'}/>
                  ))}
                </Pie>
                <Tooltip/>
                <Legend content={({ payload = [] }) => (
                  <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
                    {payload.map((entry) => {
                      const value = Number(
                        stuntingData.find(item => item.name === entry.value)?.value ?? 0
                      )
                      const percent = stuntingTotal
                        ? Math.round((value / stuntingTotal) * 100)
                        : 0
                      return (
                        <li key={entry.value} className="flex items-center gap-1 whitespace-nowrap">
                          <span className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: entry.color }}/>
                          <span>{entry.value}</span>
                          <span className="md:hidden"> {percent}%</span>
                        </li>
                      )
                    })}
                  </ul>
                )}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Info Cards Risiko */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {riskData.map((item) => (
          <div key={item.name}
            className="bg-[#F0FDFA] rounded-xl border border-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Risiko {item.name === 'Low' ? 'Rendah' : item.name === 'Medium' ? 'Sedang' : 'Tinggi'}
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: COLORS_RISK[item.name] + '20',
                  color: COLORS_RISK[item.name]
                }}
              >
                {item.name}
              </span>
            </div>
            <p className="text-3xl font-bold" style={{ color: COLORS_RISK[item.name] }}>
              {item.value}
            </p>
            <p className="text-xs text-gray-400 mt-1">balita terdeteksi</p>
          </div>
        ))}
      </div>
    </div>
  )
}
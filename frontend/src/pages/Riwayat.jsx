import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import { ClipboardList, TrendingUp, Calendar } from 'lucide-react'

const RISK_COLOR = {
  Low:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Risiko Rendah'  },
  Medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Risiko Sedang'  },
  High:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Risiko Tinggi'  },
}

const STUNTING_COLOR = {
  green:  'text-green-600',
  orange: 'text-yellow-600',
  red:    'text-red-600',
}

export default function Riwayat() {
  const [searchParams]          = useSearchParams()
  const balitaIdParam           = searchParams.get('balita_id')
  const namaParam               = searchParams.get('nama')

  const [balitaList, setBalitaList]   = useState([])
  const [selectedBalita, setSelected] = useState(balitaIdParam || '')
  const [namaBalita, setNamaBalita]   = useState(namaParam || '')
  const [riwayat, setRiwayat]         = useState([])
  const [loading, setLoading]         = useState(false)
  const [activeTab, setActiveTab]     = useState('grafik')

  useEffect(() => {
    api.get('/api/balita/').then(res => setBalitaList(res.data))
  }, [])

  useEffect(() => {
    if (balitaIdParam) fetchRiwayat(balitaIdParam)
  }, [balitaIdParam])

  const fetchRiwayat = (id) => {
    setLoading(true)
    api.get(`/api/prediksi/balita/${id}`)
      .then(res => setRiwayat(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleSelectBalita = (e) => {
    const id   = e.target.value
    const nama = balitaList.find(b => b.id === id)?.nama || ''
    setSelected(id)
    setNamaBalita(nama)
    if (id) fetchRiwayat(id)
    else setRiwayat([])
  }

  // Data untuk grafik
  const grafikData = riwayat.map(r => ({
    tanggal : new Date(r.pengukuran.tanggal).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: '2-digit'
    }),
    'Tinggi (cm)' : r.pengukuran.tinggi_cm,
    'Berat (kg)'  : r.pengukuran.berat_kg,
    'HAZ'         : r.hasil.haz,
    'WAZ'         : r.hasil.waz,
    'Risk Score'  : r.hasil.risk_score,
  }))

  const latest = riwayat[riwayat.length - 1]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Riwayat Pertumbuhan</h1>
        <p className="text-gray-500 text-sm mt-1">
          Pantau tren pertumbuhan dan risiko stunting balita dari waktu ke waktu
        </p>
      </div>

      {/* Pilih Balita */}
      <div className="bg-[#F0FDFA] rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pilih Balita
        </label>
        <select
          value={selectedBalita}
          onChange={handleSelectBalita}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <option value="">-- Pilih Balita --</option>
          {balitaList.map(b => (
            <option key={b.id} value={b.id}>
              {b.nama} ({b.jenis_kelamin === 'M' ? 'L' : 'P'})
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"/>
        </div>
      )}

      {/* Belum pilih */}
      {!selectedBalita && !loading && (
        <div className="text-center py-16 bg-[#F0FDFA] rounded-xl border border-gray-100">
          <ClipboardList size={40} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500">Pilih balita untuk melihat riwayat pertumbuhan</p>
        </div>
      )}

      {/* Belum ada data */}
      {selectedBalita && !loading && riwayat.length === 0 && (
        <div className="text-center py-16 bg-[#F0FDFA] rounded-xl border border-gray-100">
          <TrendingUp size={40} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500 font-medium">Belum ada data pengukuran</p>
          <p className="text-gray-400 text-sm mt-1">
            Lakukan pengukuran pertama di halaman Prediksi
          </p>
        </div>
      )}

      {/* Ada data */}
      {selectedBalita && !loading && riwayat.length > 0 && (
        <>
          {/* Summary card */}
          {latest && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#F0FDFA] rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 mb-1">Pengukuran Terakhir</p>
                <p className="font-bold text-gray-800">
                  {new Date(latest.pengukuran.tanggal).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              <div className="bg-[#F0FDFA] rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 mb-1">TB / BB Terakhir</p>
                <p className="font-bold text-gray-800">
                  {latest.pengukuran.tinggi_cm} cm / {latest.pengukuran.berat_kg} kg
                </p>
              </div>
              <div className="bg-[#F0FDFA] rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 mb-1">Status Stunting</p>
                <p className={`font-bold ${STUNTING_COLOR[latest.hasil.stunting_color]}`}>
                  {latest.hasil.stunting_status}
                </p>
              </div>
              <div className={`rounded-xl border shadow-sm p-4
                ${RISK_COLOR[latest.hasil.risk_level]?.bg || 'bg-gray-50'}`}>
                <p className="text-xs text-gray-500 mb-1">Tingkat Risiko</p>
                <p className={`font-bold ${RISK_COLOR[latest.hasil.risk_level]?.text}`}>
                  {RISK_COLOR[latest.hasil.risk_level]?.label}
                </p>
              </div>
            </div>
          )}

          {/* Tab */}
          <div className="bg-[#F0FDFA] rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {[
                { key: 'grafik', label: '📈 Grafik Pertumbuhan' },
                { key: 'zscore', label: '📊 Grafik Z-Score' },
                { key: 'tabel',  label: '📋 Tabel Riwayat'    },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3 text-sm font-medium transition-all
                    ${activeTab === tab.key
                      ? 'border-b-2 border-cyan-500 text-teal-700'
                      : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Grafik Pertumbuhan */}
              {activeTab === 'grafik' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                      Tren Tinggi Badan (cm)
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={grafikData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="tanggal" tick={{ fontSize: 11 }}/>
                        <YAxis tick={{ fontSize: 11 }}/>
                        <Tooltip/>
                        <Line
                          type="monotone" dataKey="Tinggi (cm)"
                          stroke="#06b6d4" strokeWidth={2}
                          dot={{ r: 4, fill: '#06b6d4' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                      Tren Berat Badan (kg)
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={grafikData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="tanggal" tick={{ fontSize: 11 }}/>
                        <YAxis tick={{ fontSize: 11 }}/>
                        <Tooltip/>
                        <Line
                          type="monotone" dataKey="Berat (kg)"
                          stroke="#10b981" strokeWidth={2}
                          dot={{ r: 4, fill: '#10b981' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Grafik Z-Score */}
              {activeTab === 'zscore' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    Tren Z-Score WHO (HAZ & WAZ)
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Garis merah = ambang stunting (-2 SD) | Garis oranye = stunting berat (-3 SD)
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={grafikData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis dataKey="tanggal" tick={{ fontSize: 11 }}/>
                      <YAxis tick={{ fontSize: 11 }}/>
                      <Tooltip/>
                      <Legend/>
                      <ReferenceLine y={-2} stroke="#ef4444" strokeDasharray="4 4"
                        label={{ value: '-2 SD', position: 'right', fontSize: 10 }}/>
                      <ReferenceLine y={-3} stroke="#f97316" strokeDasharray="4 4"
                        label={{ value: '-3 SD', position: 'right', fontSize: 10 }}/>
                      <Line type="monotone" dataKey="HAZ" stroke="#6366f1"
                        strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                      <Line type="monotone" dataKey="WAZ" stroke="#ec4899"
                        strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Tabel Riwayat */}
              {activeTab === 'tabel' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {['Tanggal','TB (cm)','BB (kg)','HAZ','WAZ','Status Stunting','Risiko','Skor'].map(h => (
                          <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-gray-500">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...riwayat].reverse().map((r, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2 text-gray-700">
                            {new Date(r.pengukuran.tanggal).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-2 font-medium">{r.pengukuran.tinggi_cm}</td>
                          <td className="py-3 px-2 font-medium">{r.pengukuran.berat_kg}</td>
                          <td className={`py-3 px-2 font-medium
                            ${r.hasil.haz < -3 ? 'text-red-600'
                              : r.hasil.haz < -2 ? 'text-yellow-600'
                              : 'text-green-600'}`}>
                            {r.hasil.haz}
                          </td>
                          <td className={`py-3 px-2 font-medium
                            ${r.hasil.waz < -3 ? 'text-red-600'
                              : r.hasil.waz < -2 ? 'text-yellow-600'
                              : 'text-green-600'}`}>
                            {r.hasil.waz}
                          </td>
                          <td className={`py-3 px-2 font-medium
                            ${STUNTING_COLOR[r.hasil.stunting_color]}`}>
                            {r.hasil.stunting_status}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium
                              ${RISK_COLOR[r.hasil.risk_level]?.bg}
                              ${RISK_COLOR[r.hasil.risk_level]?.text}`}>
                              {r.hasil.risk_level}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-gray-600">
                            {r.hasil.risk_score.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
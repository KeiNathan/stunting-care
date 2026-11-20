import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import BalitaAvatar from '../components/BalitaAvatar'
import { Baby, TrendingUp } from 'lucide-react'

const RISK_COLOR = {
  Low:    { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Risiko Rendah' },
  Medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Risiko Sedang' },
  High:   { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Risiko Tinggi' },
}

function hitungUsia(tgl) {
  const lahir = new Date(tgl)
  const now   = new Date()
  const bulan = (now.getFullYear() - lahir.getFullYear()) * 12 +
                (now.getMonth() - lahir.getMonth())
  if (bulan < 12) return `${bulan} bulan`
  return `${Math.floor(bulan / 12)} tahun ${bulan % 12} bulan`
}

export default function DashboardOrtu() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [balitaList, setBalitaList]   = useState([])
  const [selected, setSelected]       = useState(null)
  const [riwayat, setRiwayat]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [loadingRiwayat, setLoadingRiwayat] = useState(false)

  // Fetch daftar balita milik ortu ini
  useEffect(() => {
    api.get('/api/balita/')
      .then(res => {
        const list = res.data
        setBalitaList(list)
        if (list.length > 0) {
          setSelected(list[0])
          return api.get(`/api/prediksi/balita/${list[0].id}`)
        }
      })
      .then(res => { if (res) setRiwayat(res.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Ganti balita yang dipilih
  const handleSelectBalita = (b) => {
    setSelected(b)
    setRiwayat([])
    setLoadingRiwayat(true)
    api.get(`/api/prediksi/balita/${b.id}`)
      .then(res => setRiwayat(res.data))
      .catch(console.error)
      .finally(() => setLoadingRiwayat(false))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"/>
    </div>
  )

  if (balitaList.length === 0) return (
    <div className="text-center py-16">
      <Baby size={48} className="mx-auto text-gray-300 mb-3"/>
      <p className="text-gray-500 font-medium">Data balita belum tersedia</p>
      <p className="text-gray-400 text-sm mt-1">
        Hubungi kader Posyandu untuk menghubungkan akun ini dengan data balita.
      </p>
    </div>
  )

  const latest = riwayat[riwayat.length - 1]
  const risk   = latest ? RISK_COLOR[latest.hasil.risk_level] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Selamat datang, <span className="font-medium text-teal-600">{user?.nama}</span>!
          Pantau pertumbuhan anak Anda di sini.
        </p>
      </div>

      {/* Selector anak — tampil jika lebih dari 1 */}
      {balitaList.length > 1 && (
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Pilih Anak:</p>
          <div className="flex gap-2 flex-wrap">
            {balitaList.map(b => (
              <button
                key={b.id}
                onClick={() => handleSelectBalita(b)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${selected?.id === b.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-[#F0FDFA] border border-gray-300 text-gray-600 hover:bg-cyan-50'}`}
              >
                {b.nama}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Balita yang dipilih */}
      {selected && (
        <div className="bg-[#F0FDFA] rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <BalitaAvatar
              jenisKelamin={selected.jenis_kelamin}
              className="h-14 w-14 rounded-full object-contain"
            />
            <div>
              <h2 className="text-lg font-bold text-gray-800">{selected.nama}</h2>
              <p className="text-sm text-gray-500">
                {selected.jenis_kelamin === 'M' ? 'Laki-laki' : 'Perempuan'} •
                Usia {hitungUsia(selected.tanggal_lahir)}
              </p>
              <p className="text-sm text-gray-500">
                Lahir: {new Date(selected.tanggal_lahir).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading riwayat */}
      {loadingRiwayat && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"/>
        </div>
      )}

      {/* Konten berdasarkan riwayat */}
      {!loadingRiwayat && latest ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#F0FDFA] rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Tinggi Terakhir</p>
              <p className="text-2xl font-bold text-gray-800">
                {latest.pengukuran.tinggi_cm}
                <span className="text-sm font-normal"> cm</span>
              </p>
            </div>
            <div className="bg-[#F0FDFA] rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Berat Terakhir</p>
              <p className="text-2xl font-bold text-gray-800">
                {latest.pengukuran.berat_kg}
                <span className="text-sm font-normal"> kg</span>
              </p>
            </div>
            <div className="bg-[#F0FDFA] rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Status Stunting</p>
              <p className={`text-lg font-bold
                ${latest.hasil.stunting_color === 'green'  ? 'text-green-600'
                : latest.hasil.stunting_color === 'orange' ? 'text-yellow-600'
                : 'text-red-600'}`}>
                {latest.hasil.stunting_status}
              </p>
            </div>
            <div className={`rounded-xl border shadow-sm p-4 ${risk?.bg}`}>
              <p className="text-xs text-gray-500 mb-1">Tingkat Risiko</p>
              <p className={`text-lg font-bold ${risk?.text}`}>{risk?.label}</p>
            </div>
          </div>

          {/* Z-Score */}
          <div className="bg-[#F0FDFA] rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Nilai Z-Score WHO (Pengukuran Terakhir)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'HAZ (Tinggi/Usia)',  value: latest.hasil.haz, status: latest.hasil.haz_label },
                { label: 'WAZ (Berat/Usia)',   value: latest.hasil.waz, status: latest.hasil.waz_label },
                { label: 'WHZ (Berat/Tinggi)', value: latest.hasil.whz, status: latest.hasil.whz_label },
              ].map(z => {
                const color = z.value >= -2 ? 'green' : z.value >= -3 ? 'yellow' : 'red'
                const cls = {
                  green:  { bg: 'bg-green-50',  text: 'text-green-700'  },
                  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
                  red:    { bg: 'bg-red-50',    text: 'text-red-700'    },
                }[color]
                return (
                  <div key={z.label} className={`rounded-xl p-4 ${cls.bg}`}>
                    <p className="text-xs text-gray-500 mb-1">{z.label}</p>
                    <p className={`text-2xl font-bold ${cls.text}`}>{z.value}</p>
                    <p className="text-xs mt-1 text-gray-500">{z.status}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rekomendasi */}
          <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-teal-800 mb-1">💡 Rekomendasi</p>
            <p className="text-sm text-teal-700">{latest.hasil.rekomendasi}</p>
          </div>

          {/* Tombol aksi */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/riwayat?balita_id=${selected.id}&nama=${selected.nama}`)}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white
                         py-2.5 rounded-lg text-sm font-semibold transition-all"
            >
              Lihat Riwayat Lengkap
            </button>
            {user?.canPredict && (
              <button
                onClick={() => navigate(`/prediksi?balita_id=${selected.id}&nama=${selected.nama}`)}
                className="flex-1 border border-teal-500 text-teal-600
                           hover:bg-cyan-50
                           py-2.5 rounded-lg text-sm font-semibold transition-all"
              >
                Input Pengukuran Baru
              </button>
            )}
          </div>
        </>
      ) : !loadingRiwayat && (
        <div className="text-center py-12 bg-[#F0FDFA] rounded-xl border border-gray-100">
          <TrendingUp size={40} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500 font-medium">Belum ada data pengukuran</p>
          <p className="text-gray-400 text-sm mt-1">
            Minta kader Posyandu untuk melakukan pengukuran pertama
          </p>
        </div>
      )}
    </div>
  )
}
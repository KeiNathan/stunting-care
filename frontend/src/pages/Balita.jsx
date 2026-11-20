import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import BalitaAvatar from '../components/BalitaAvatar'
import { Plus, Search, Baby, Calendar, User, Trash2, Activity } from 'lucide-react'

function hitungUsia(tanggal_lahir) {
  const lahir = new Date(tanggal_lahir)
  const now   = new Date()
  const bulan = (now.getFullYear() - lahir.getFullYear()) * 12 +
                (now.getMonth() - lahir.getMonth())
  if (bulan < 12) return `${bulan} bulan`
  return `${Math.floor(bulan / 12)} tahun ${bulan % 12} bulan`
}

function ModalTambahBalita({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    nama: '', tanggal_lahir: '', jenis_kelamin: 'M', nama_ibu: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/balita/', form)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menambah balita')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F0FDFA] rounded-xl shadow-lg w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Tambah Data Balita</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap Balita
            </label>
            <input
              type="text"
              value={form.nama}
              onChange={e => setForm({ ...form, nama: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Contoh: Budi Santoso"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Lahir
            </label>
            <input
              type="date"
              value={form.tanggal_lahir}
              onChange={e => setForm({ ...form, tanggal_lahir: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Kelamin
            </label>
            <select
              value={form.jenis_kelamin}
              onChange={e => setForm({ ...form, jenis_kelamin: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="M">Laki-laki</option>
              <option value="F">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Ibu
            </label>
            <input
              type="text"
              value={form.nama_ibu}
              onChange={e => setForm({ ...form, nama_ibu: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Contoh: Siti Rahayu"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg
                         text-sm hover:bg-gray-50 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400
                         text-white py-2.5 rounded-lg text-sm font-semibold transition-all"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Balita() {
  const [balitaList, setBalitaList] = useState([])
  const [filtered, setFiltered]     = useState([])
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const navigate = useNavigate()

  const fetchBalita = () => {
    setLoading(true)
    api.get('/api/balita/')
      .then(res => {
        setBalitaList(res.data)
        setFiltered(res.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBalita() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(balitaList.filter(b =>
      b.nama.toLowerCase().includes(q) ||
      b.nama_ibu.toLowerCase().includes(q)
    ))
  }, [search, balitaList])

  const handleDelete = async (id, nama) => {
    if (!confirm(`Hapus data balita "${nama}"?`)) return
    try {
      await api.delete(`/api/balita/${id}`)
      fetchBalita()
    } catch (err) {
      alert('Gagal menghapus data')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Balita</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola data balita yang terdaftar di Posyandu
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700
                     text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all
                     sm:flex-none"
        >
          <Plus size={16}/> Tambah Balita
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama balita atau nama ibu..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#F0FDFA] rounded-xl border border-gray-100">
          <Baby size={40} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500 font-medium">Belum ada data balita</p>
          <p className="text-gray-400 text-sm mt-1">
            Klik tombol "Tambah Balita" untuk menambahkan data
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(b => (
            <div key={b.id}
              className="bg-[#F0FDFA] rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5
                         hover:shadow-md transition-all"
            >
              {/* Header card */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <BalitaAvatar
                    jenisKelamin={b.jenis_kelamin}
                    className="h-10 w-10 rounded-full object-contain"
                  />
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-gray-800 text-sm">{b.nama}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${b.jenis_kelamin === 'M'
                        ? 'bg-cyan-50 text-teal-700'
                        : 'bg-pink-50 text-pink-600'}`}>
                      {b.jenis_kelamin === 'M' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} className="text-gray-400"/>
                  <span className="min-w-0 break-words">{new Date(b.tanggal_lahir).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Activity size={14} className="text-gray-400"/>
                  <span>Usia: <b>{hitungUsia(b.tanggal_lahir)}</b></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={14} className="text-gray-400"/>
                  <span className="min-w-0 break-words">Ibu: {b.nama_ibu}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/prediksi?balita_id=${b.id}&nama=${b.nama}`)}
                  className="min-w-[calc(50%-0.25rem)] flex-1 bg-teal-600 hover:bg-teal-700 text-white
                             py-2 rounded-lg text-xs font-semibold transition-all"
                >
                  Input Pengukuran
                </button>
                <button
                  onClick={() => navigate(`/riwayat?balita_id=${b.id}&nama=${b.nama}`)}
                  className="min-w-[calc(50%-0.25rem)] flex-1 border border-gray-300 text-gray-600
                             hover:bg-gray-50 py-2 rounded-lg text-xs transition-all"
                >
                  Riwayat
                </button>
                <button
                  onClick={() => handleDelete(b.id, b.nama)}
                  className="ml-auto p-2 border border-red-200 text-red-500
                             hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ModalTambahBalita
          onClose={() => setShowModal(false)}
          onSuccess={fetchBalita}
        />
      )}
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import BalitaAvatar from '../components/BalitaAvatar'
import { Plus, Search, Users, Trash2, ToggleLeft, ToggleRight,
         Shield, User, Baby, Eye, Activity } from 'lucide-react'

const ROLE_CONFIG = {
  admin: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin',      icon: <Shield size={12}/> },
  kader: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Kader', icon: <User size={12}/> },
  ortu:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Orang Tua',  icon: <Baby size={12}/>   },
}

function ModalTambahOrtu({ onClose, onSuccess }) {
  const [balitaList, setBalitaList] = useState([])
  const [showBalitaPicker, setShowBalitaPicker] = useState(false)
  const [form, setForm] = useState({nama: '', email: '', password: '', balita_ids: [], can_predict: false})
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get('/api/balita/')
      .then(res => setBalitaList(res.data.filter(b => !b.ortu_id)))
  }, [])

  const addBalita = (b) => {
    if (!form.balita_ids.includes(b.id)) {
      setForm(prev => ({ ...prev, balita_ids: [...prev.balita_ids, b.id] }))
    }
    setShowBalitaPicker(false)
  }

  const removeBalita = (id) => {
    setForm(prev => ({ ...prev, balita_ids: prev.balita_ids.filter(x => x !== id) }))
  }

  const selectedBalita = balitaList.filter(b => form.balita_ids.includes(b.id))
  const availableBalita = balitaList.filter(b => !form.balita_ids.includes(b.id))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.balita_ids.length === 0) { setError('Tambahkan minimal satu balita'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/api/users/ortu', form)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menambah akun orang tua')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F0FDFA] rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Tambah Akun Orang Tua</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input type="text" value={form.nama}
              onChange={e => setForm({...form, nama: e.target.value})}
              className={inputClass} placeholder="Nama orang tua" required/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className={inputClass} placeholder="email@example.com" required/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className={inputClass} placeholder="Minimal 6 karakter" required minLength={6}/>
          </div>

          {/* Hubungkan ke Balita */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hubungkan ke Balita
            </label>

            {/* List balita yang sudah dipilih */}
            <div className="space-y-2 mb-2">
              {selectedBalita.map(b => (
                <div key={b.id}
                  className="flex items-center justify-between bg-teal-50
                             border border-teal-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <BalitaAvatar
                      jenisKelamin={b.jenis_kelamin}
                      className="h-7 w-7 flex-shrink-0 rounded-full object-contain"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{b.nama}</p>
                      <p className="text-xs text-gray-500">
                        {b.jenis_kelamin === 'M' ? 'Laki-laki' : 'Perempuan'} •{' '}
                        {new Date(b.tanggal_lahir).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeBalita(b.id)}
                    className="text-gray-400 hover:text-red-500 transition-all text-lg leading-none">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Tombol + Tambah Balita */}
            {availableBalita.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBalitaPicker(!showBalitaPicker)}
                  className="flex items-center gap-1.5 text-sm text-teal-600
                             border border-teal-300 border-dashed rounded-lg
                             px-3 py-2 w-full hover:bg-cyan-50 transition-all"
                >
                  <span className="text-lg leading-none">+</span> Tambah Balita
                </button>

                {/* Dropdown picker */}
                {showBalitaPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#F0FDFA]
                                  border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {availableBalita.map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => addBalita(b)}
                        className="flex items-center gap-3 w-full px-4 py-3
                                   hover:bg-gray-50 transition-all text-left border-b border-gray-100 last:border-0"
                      >
                        <BalitaAvatar
                          jenisKelamin={b.jenis_kelamin}
                          className="h-8 w-8 flex-shrink-0 rounded-full object-contain"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{b.nama}</p>
                          <p className="text-xs text-gray-500">
                            {b.jenis_kelamin === 'M' ? 'Laki-laki' : 'Perempuan'} •{' '}
                            {new Date(b.tanggal_lahir).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {availableBalita.length === 0 && selectedBalita.length === 0 && (
              <p className="text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
                Semua balita sudah terhubung ke akun orang tua
              </p>
            )}
          </div>

          {/* Toggle can_predict */}
          <div className="flex items-center justify-between bg-[#F0FDFA]
                          border border-gray-200 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Izin Prediksi Stunting</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Aktifkan agar orang tua bisa melakukan prediksi mandiri
              </p>
            </div>
            <button type="button"
              onClick={() => setForm({...form, can_predict: !form.can_predict})}>
              {form.can_predict
                ? <ToggleRight size={28} className="text-teal-500"/>
                : <ToggleLeft  size={28} className="text-gray-400"/>
              }
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400
                         text-white py-2.5 rounded-lg text-sm font-semibold">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalTambahUser({ onClose, onSuccess }) {
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'kader' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/users/', form)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menambah pengguna')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F0FDFA] rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Tambah Pengguna</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
            <input type="text" value={form.nama}
              onChange={e => setForm({...form, nama: e.target.value})}
              className={inputClass} required/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className={inputClass} required/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className={inputClass} required minLength={6}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              className={inputClass}>
              <option value="kader">Kader Posyandu</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400
                         text-white py-2.5 rounded-lg text-sm font-semibold">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ManajemenUser() {
  const { user: currentUser }   = useAuth()
  const [users, setUsers]       = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch]     = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [loading, setLoading]   = useState(true)
  const [showModalOrtu, setShowModalOrtu] = useState(false)
  const [showModalUser, setShowModalUser] = useState(false)

  const isAdmin = currentUser?.role === 'admin'

  const fetchUsers = () => {
    setLoading(true)
    const endpoint = isAdmin ? '/api/users/' : '/api/users/ortu/list'
    api.get(endpoint)
      .then(res => { setUsers(res.data); setFiltered(res.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  useEffect(() => {
    let data = users
    if (filterRole !== 'all') data = data.filter(u => u.role === filterRole)
    if (search) data = data.filter(u =>
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(data)
  }, [search, filterRole, users])

  const handleToggle = async (u, field) => {
    try {
      await api.put(`/api/users/${u.id}`, { [field]: !u[field] })
      fetchUsers()
    } catch { alert('Gagal mengubah status') }
  }

  const handleDelete = async (id, nama) => {
    if (!confirm(`Hapus pengguna "${nama}"?`)) return
    try {
      await api.delete(`/api/users/${id}`)
      fetchUsers()
    } catch { alert('Gagal menghapus') }
  }

  const counts = {
    all:   users.length,
    admin: users.filter(u => u.role === 'admin').length,
    kader: users.filter(u => u.role === 'kader').length,
    ortu:  users.filter(u => u.role === 'ortu').length,
  }

  const filterTabs = isAdmin
    ? [
        { key: 'all',   label: `Semua (${counts.all})`      },
        { key: 'admin', label: `Admin (${counts.admin})`    },
        { key: 'kader', label: `Kader (${counts.kader})`    },
        { key: 'ortu',  label: `Orang Tua (${counts.ortu})` },
      ]
    : [{ key: 'all', label: `Orang Tua (${counts.all})` }]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isAdmin ? 'Manajemen Pengguna' : 'Kelola Orang Tua'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAdmin
              ? 'Kelola seluruh akun pengguna sistem'
              : 'Kelola akun orang tua balita'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModalOrtu(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700
                       text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
            <Plus size={16}/> Tambah Orang Tua
          </button>
          {isAdmin && (
            <button onClick={() => setShowModalUser(true)}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700
                         text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
              <Plus size={16}/> Tambah User
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map(tab => (
          <button key={tab.key} onClick={() => setFilterRole(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${filterRole === tab.key
                ? 'bg-teal-600 text-white'
                : 'bg-[#F0FDFA] border border-gray-300 text-gray-600 hover:bg-cyan-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-cyan-400"/>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#F0FDFA] rounded-xl border border-gray-100">
          <Users size={40} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500">Tidak ada pengguna ditemukan</p>
        </div>
      ) : (
        <div className="bg-[#F0FDFA] rounded-xl border border-gray-200 overflow-hidden">
          <p className="px-4 py-2 text-xs text-gray-500 md:hidden">
            Geser tabel ke kanan atau kiri untuk melihat semua kolom.
          </p>
          <div className="overflow-x-auto overscroll-x-contain touch-pan-x">
          <table className="w-full min-w-[760px] text-sm md:min-w-full">
            <thead>
              <tr className="border-b border-cyan-100 bg-cyan-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">PENGGUNA</th>
                {isAdmin && <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">ROLE</th>}
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">STATUS AKUN</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">IZIN PREDIKSI</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">TERDAFTAR</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const role = ROLE_CONFIG[u.role]
                return (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center
                          font-semibold text-sm ${role?.bg} ${role?.text}`}>
                          {u.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{u.nama}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4">
                        <span className={`flex items-center gap-1 w-fit text-xs px-2 py-1
                          rounded-full font-medium ${role?.bg} ${role?.text}`}>
                          {role?.icon} {role?.label}
                        </span>
                      </td>
                    )}
                    {/* Toggle aktif */}
                    <td className="py-3 px-4">
                      <button onClick={() => handleToggle(u, 'is_active')}
                        className="flex items-center gap-1.5 text-xs font-medium">
                        {u.is_active
                          ? <><ToggleRight size={18} className="text-green-500"/><span className="text-green-600">Aktif</span></>
                          : <><ToggleLeft  size={18} className="text-gray-400"/><span className="text-gray-500">Nonaktif</span></>
                        }
                      </button>
                    </td>
                    {/* Toggle can_predict — hanya ortu */}
                    <td className="py-3 px-4">
                      {u.role === 'ortu' ? (
                        <button onClick={() => handleToggle(u, 'can_predict')}
                          className="flex items-center gap-1.5 text-xs font-medium">
                          {u.can_predict
                            ? <><Activity size={14} className="text-teal-500"/><span className="text-teal-600">Aktif</span></>
                            : <><Eye      size={14} className="text-gray-400"/><span className="text-gray-500">Hanya pantau</span></>
                          }
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4">
                      {isAdmin && (
                        <button onClick={() => handleDelete(u.id, u.nama)}
                          className="p-1.5 border border-red-200 text-red-500
                                     hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {showModalOrtu && (
        <ModalTambahOrtu onClose={() => setShowModalOrtu(false)} onSuccess={fetchUsers}/>
      )}
      {showModalUser && isAdmin && (
        <ModalTambahUser onClose={() => setShowModalUser(false)} onSuccess={fetchUsers}/>
      )}
    </div>
  )
}
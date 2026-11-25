import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import { Activity, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

function ZScoreCard({ label, value, status, labelStatus }) {
  const color = status === 'normal' ? 'green'
    : status === 'stunting' || status === 'underweight' || status === 'wasted' ? 'yellow'
    : 'red'

  const colorMap = {
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700'  },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700'},
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700'      },
  }
  const c = colorMap[color]

  return (
    <div className={`${c.bg} rounded-xl p-4`}>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>
        {labelStatus}
      </span>
    </div>
  )
}

function HasilPrediksi({ hasil, onReset }) {
  const { pengukuran, hasil: h } = hasil
  const riskColor = h.risk_level === 'Low' ? 'green'
    : h.risk_level === 'Medium' ? 'yellow' : 'red'
  const colorMap = {
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200', icon: <CheckCircle  className="text-green-500"  size={28}/> },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200',icon: <AlertTriangle className="text-yellow-500" size={28}/> },
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',   icon: <XCircle       className="text-red-500"    size={28}/> },
  }
  const c = colorMap[riskColor]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Hasil Analisis</h2>
        <button
          onClick={onReset}
          className="text-sm text-teal-600 hover:underline"
        >
          ← Input Baru
        </button>
      </div>

      {/* Risk Level */}
      <div className={`${c.bg} ${c.border} border rounded-2xl p-6 flex items-center gap-4`}>
        {c.icon}
        <div>
          <p className="text-sm text-gray-500">Tingkat Risiko Stunting</p>
          <p className={`text-3xl font-bold ${c.text}`}>
            {h.risk_level === 'Low' ? 'Risiko Rendah'
              : h.risk_level === 'Medium' ? 'Risiko Sedang'
              : 'Risiko Tinggi'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Skor: <b>{h.risk_score.toFixed(1)}%</b> keyakinan model
          </p>
        </div>
      </div>

      {/* Z-Score Cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Nilai Z-Score WHO
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <ZScoreCard
            label="HAZ (Tinggi/Usia)"
            value={h.haz}
            status={h.haz_status}
            labelStatus={h.haz_label}
          />
          <ZScoreCard
            label="WAZ (Berat/Usia)"
            value={h.waz}
            status={h.waz_status}
            labelStatus={h.waz_label}
          />
          <ZScoreCard
            label="WHZ (Berat/Tinggi)"
            value={h.whz}
            status={h.whz_status}
            labelStatus={h.whz_label}
          />
        </div>
      </div>

      {/* Status Stunting */}
      <div className="bg-[#F0FDFA] border border-gray-200 rounded-xl p-4">
        <p className="text-sm text-gray-500 mb-1">Status Stunting (WHO)</p>
        <div className="flex items-center gap-2">
          <span
            className="text-lg font-bold"
            style={{ color: h.stunting_color === 'green' ? '#16a34a'
              : h.stunting_color === 'orange' ? '#d97706' : '#dc2626' }}
          >
            {h.stunting_status}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2">{h.interpretation}</p>
      </div>

      {/* Rekomendasi */}
      <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-teal-800 mb-2">
          💡 Rekomendasi Intervensi
        </p>
        <p className="text-sm text-teal-700">{h.rekomendasi}</p>
        {h.recommendation && h.recommendation !== h.rekomendasi && (
          <p className="text-sm text-teal-700 mt-1">{h.recommendation}</p>
        )}
      </div>

      {/* Detail Pengukuran */}
      <div className="bg-[#F0FDFA] border border-gray-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Data Pengukuran</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-500">Tinggi Badan</div>
          <div className="font-medium">{pengukuran.tinggi_cm} cm</div>
          <div className="text-gray-500">Berat Badan</div>
          <div className="font-medium">{pengukuran.berat_kg} kg</div>
          <div className="text-gray-500">Tanggal</div>
          <div className="font-medium">
            {new Date(pengukuran.tanggal).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Prediksi() {
  const [searchParams] = useSearchParams()
  const balitaId       = searchParams.get('balita_id')
  const namaBalita     = searchParams.get('nama') || ''

  const [balitaList, setBalitaList] = useState([])
  const [selectedBalita, setSelectedBalita] = useState(balitaId || '')
  const [balitaSearch, setBalitaSearch] = useState(namaBalita)
  const [showBalitaResults, setShowBalitaResults] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [hasil, setHasil]       = useState(null)
  const [error, setError]       = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [form, setForm] = useState({
    tanggal         : new Date().toISOString().split('T')[0],
    tinggi_cm       : '',
    berat_kg        : '',
    sanitasi        : 'Improved',
    air_bersih      : 'Protected',
    ekonomi         : 'Middle',
    imunisasi       : 'Complete',
    asi_eksklusif   : true,
    // Advanced
    mother_age      : '',
    mother_height   : '',
    mother_education: 'High School',
    mother_working  : 0,
    father_education: 'High School',
    father_working  : 1,
    anc_visits      : 4,
    complementary_age: 6,
    diarrhea_freq   : 0,
    residence_type  : 'Urban',
    deworming       : 'Yes',
  })

  useEffect(() => {
    api.get('/api/balita/').then(res => setBalitaList(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Gagal memuat data balita'))
  }, [])

  const balitaTerpilih = balitaList.find(b => b.id === selectedBalita)
  const nilaiPencarian = balitaTerpilih?.nama || balitaSearch
  const hasilPencarian = balitaList.filter(b => {
    const query = balitaSearch.trim().toLocaleLowerCase('id')
    return b.nama.toLocaleLowerCase('id').includes(query)
      || b.nama_ibu.toLocaleLowerCase('id').includes(query)
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!balitaTerpilih) {
      setError('Cari dan pilih satu balita dari daftar terlebih dahulu')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        balita_id     : selectedBalita,
        tanggal       : form.tanggal,
        tinggi_cm     : parseFloat(form.tinggi_cm),
        berat_kg      : parseFloat(form.berat_kg),
        sanitasi      : form.sanitasi,
        air_bersih    : form.air_bersih,
        ekonomi       : form.ekonomi,
        imunisasi     : form.imunisasi,
        asi_eksklusif : form.asi_eksklusif,
        ...(form.mother_age    && { mother_age:      parseFloat(form.mother_age)    }),
        ...(form.mother_height && { mother_height:   parseFloat(form.mother_height) }),
        mother_education : form.mother_education,
        mother_working   : parseInt(form.mother_working),
        father_education : form.father_education,
        father_working   : parseInt(form.father_working),
        anc_visits       : parseFloat(form.anc_visits),
        complementary_age: parseFloat(form.complementary_age),
        diarrhea_freq    : parseFloat(form.diarrhea_freq),
        residence_type   : form.residence_type,
        deworming        : form.deworming,
      }
      const res = await api.post('/api/prediksi/', payload)
      setHasil(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal melakukan prediksi')
    } finally {
      setLoading(false)
    }
  }

  if (hasil) return (
    <div className="max-w-2xl mx-auto">
      <HasilPrediksi hasil={hasil} onReset={() => setHasil(null)} />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Input Pengukuran & Prediksi</h1>
        <p className="text-gray-500 text-sm mt-1">
          Masukkan data pengukuran balita untuk mendapatkan prediksi risiko stunting
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Pilih Balita */}
        <div className="bg-[#F0FDFA] rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Activity size={16} className="text-teal-600"/> Pilih Balita
          </h2>
          <div
            className="relative"
            onBlur={e => {
              if (!e.currentTarget.contains(e.relatedTarget)) setShowBalitaResults(false)
            }}
          >
            <label htmlFor="cari-balita" className="block text-sm font-medium text-gray-700 mb-1">
              Cari nama balita atau nama ibu
            </label>
            <input
              id="cari-balita"
              type="search"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showBalitaResults}
              aria-controls="hasil-pencarian-balita"
              value={nilaiPencarian}
              onFocus={() => setShowBalitaResults(true)}
              onChange={e => {
                setBalitaSearch(e.target.value)
                setSelectedBalita('')
                setError('')
                setShowBalitaResults(true)
              }}
              autoComplete="off"
              placeholder="Ketik nama balita atau ibu..."
              className="w-full border border-gray-300 rounded-lg bg-[#F0FDFA] px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            {showBalitaResults && (
              <div
                id="hasil-pencarian-balita"
                role="listbox"
                className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg
                           border border-gray-200 bg-[#F0FDFA] py-1 shadow-lg"
              >
                {hasilPencarian.length ? hasilPencarian.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    role="option"
                    aria-selected={b.id === selectedBalita}
                    onClick={() => {
                      setSelectedBalita(b.id)
                      setBalitaSearch(b.nama)
                      setShowBalitaResults(false)
                      setError('')
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-teal-50 focus:bg-teal-50
                               focus:outline-none"
                  >
                    <span className="block text-sm font-medium text-gray-800">
                      {b.nama} ({b.jenis_kelamin === 'M' ? 'Laki-laki' : 'Perempuan'})
                    </span>
                    <span className="block text-xs text-gray-500">Ibu: {b.nama_ibu}</span>
                  </button>
                )) : (
                  <p className="px-4 py-3 text-sm text-gray-500">Balita tidak ditemukan</p>
                )}
              </div>
            )}
          </div>
          {balitaTerpilih && (
            <div className="rounded-lg border border-teal-100 bg-[#F0FDFA] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-500">Profil balita terpilih</p>
                  <p className="font-semibold text-gray-800">{balitaTerpilih.nama}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBalita('')
                    setBalitaSearch('')
                    setShowBalitaResults(true)
                  }}
                  className="text-sm text-teal-700 hover:underline"
                >
                  Ganti
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <span className="text-gray-500">Jenis kelamin</span>
                <span className="text-gray-700">
                  {balitaTerpilih.jenis_kelamin === 'M' ? 'Laki-laki' : 'Perempuan'}
                </span>
                <span className="text-gray-500">Tanggal lahir</span>
                <span className="text-gray-700">
                  {new Date(balitaTerpilih.tanggal_lahir).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </span>
                <span className="text-gray-500">Nama ibu</span>
                <span className="text-gray-700">{balitaTerpilih.nama_ibu}</span>
                <span className="text-gray-500">Panjang lahir</span>
                <span className="text-gray-700">
                  {balitaTerpilih.birth_length != null
                    ? `${balitaTerpilih.birth_length} cm` : 'Belum diisi'}
                </span>
                <span className="text-gray-500">Berat lahir</span>
                <span className="text-gray-700">
                  {balitaTerpilih.birth_weight != null
                    ? `${balitaTerpilih.birth_weight} kg` : 'Belum diisi'}
                </span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Pengukuran
            </label>
            <input
              type="date"
              value={form.tanggal}
              onChange={e => setForm({ ...form, tanggal: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>
        </div>

        {/* Antropometri */}
        <div className="bg-[#F0FDFA] rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">📏 Data Antropometri</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tinggi Badan (cm)
              </label>
              <input
                type="number" step="0.1" min="30" max="130"
                value={form.tinggi_cm}
                onChange={e => setForm({ ...form, tinggi_cm: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Contoh: 75.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Berat Badan (kg)
              </label>
              <input
                type="number" step="0.1" min="1" max="30"
                value={form.berat_kg}
                onChange={e => setForm({ ...form, berat_kg: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Contoh: 8.5"
                required
              />
            </div>
          </div>
        </div>

        {/* Kondisi Lingkungan */}
        <div className="bg-[#F0FDFA] rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700">🏠 Kondisi Lingkungan & Gizi</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sanitasi</label>
              <select
                value={form.sanitasi}
                onChange={e => setForm({ ...form, sanitasi: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="Improved">Baik (Improved)</option>
                <option value="Unimproved">Buruk (Unimproved)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sumber Air Minum</label>
              <select
                value={form.air_bersih}
                onChange={e => setForm({ ...form, air_bersih: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="Protected">Terlindungi (Protected)</option>
                <option value="Unprotected">Tidak Terlindungi (Unprotected)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat Ekonomi</label>
              <select
                value={form.ekonomi}
                onChange={e => setForm({ ...form, ekonomi: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="Low">Rendah</option>
                <option value="Middle">Menengah</option>
                <option value="High">Tinggi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Imunisasi</label>
              <select
                value={form.imunisasi}
                onChange={e => setForm({ ...form, imunisasi: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="Complete">Lengkap</option>
                <option value="Incomplete">Tidak Lengkap</option>
                <option value="Not Immunized">Tidak Diimunisasi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ASI Eksklusif
            </label>
            <div className="flex gap-4">
              {[true, false].map(val => (
                <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="asi"
                    checked={form.asi_eksklusif === val}
                    onChange={() => setForm({ ...form, asi_eksklusif: val })}
                    className="accent-teal-600"
                  />
                  <span className="text-sm text-gray-700">{val ? 'Ya' : 'Tidak'}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced (opsional) */}
        <div className="bg-[#F0FDFA] rounded-xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-5 py-4
                       text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <span>⚙️ Data Tambahan (Opsional — untuk akurasi lebih tinggi)</span>
            {showAdvanced ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>

          {showAdvanced && (
            <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usia Ibu (tahun)
                  </label>
                  <input
                    type="number"
                    value={form.mother_age}
                    onChange={e => setForm({ ...form, mother_age: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Contoh: 28"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tinggi Ibu (cm)
                  </label>
                  <input
                    type="number" step="0.1"
                    value={form.mother_height}
                    onChange={e => setForm({ ...form, mother_height: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Contoh: 155"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pendidikan Ibu
                  </label>
                  <select
                    value={form.mother_education}
                    onChange={e => setForm({ ...form, mother_education: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="No Education">Tidak Sekolah</option>
                    <option value="Elementary/Middle School">SD/SMP</option>
                    <option value="High School">SMA</option>
                    <option value="University">Perguruan Tinggi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pendidikan Ayah
                  </label>
                  <select
                    value={form.father_education}
                    onChange={e => setForm({ ...form, father_education: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="No Education">Tidak Sekolah</option>
                    <option value="Elementary/Middle School">SD/SMP</option>
                    <option value="High School">SMA</option>
                    <option value="University">Perguruan Tinggi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kunjungan ANC
                  </label>
                  <input
                    type="number" min="0" max="20"
                    value={form.anc_visits}
                    onChange={e => setForm({ ...form, anc_visits: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frekuensi Diare (kali/tahun)
                  </label>
                  <input
                    type="number" min="0"
                    value={form.diarrhea_freq}
                    onChange={e => setForm({ ...form, diarrhea_freq: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400
                     text-white font-semibold py-3 rounded-xl transition-all text-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/>
              Memproses prediksi...
            </span>
          ) : (
            '🔍 Prediksi Risiko Stunting'
          )}
        </button>
      </form>
    </div>
  )
}
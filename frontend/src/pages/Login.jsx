import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/auth/login', form)
      login(res.data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0FDFA] to-[#E0F2FE] px-4 py-8">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-[#F0FDFA] shadow-md">
        <div className="bg-teal-600 px-8 py-8 text-center text-white">
          <img
            src="/stuntingcare-mark.png"
            alt="Logo StuntingCare"
            className="mx-auto mb-2 h-20 w-20 object-contain"
          />
          <h1 className="text-4xl font-bold">StuntingCare</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-teal-50">
            Pantau tumbuh kembang si kecil dengan mudah dan penuh kasih 💚
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Selamat Datang! 👋</h2>
            <p className="mt-1 text-sm text-gray-500">
              Masuk untuk mulai memantau pertumbuhan balita
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600
                            text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  📧
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl
                             text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400
                             focus:border-transparent bg-[#F0FDFA]"
                  placeholder="email@posyandu.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  🔒
                </span>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl
                             text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400
                             focus:border-transparent bg-[#F0FDFA]"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400
                         text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? '⏳ Memproses...' : '🚀 Masuk Sekarang'}
            </button>
          </form>

          <div className="mt-8 mb-6 flex justify-center gap-3">
            {['👶', '📏', '📊', '💊', '🏥'].map((icon, i) => (
              <div key={i} className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-lg">
                {icon}
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-cyan-50 px-4 py-3 text-center">
            <p className="text-xs leading-relaxed text-teal-800">
              🏆 Membantu kader Posyandu memantau risiko stunting balita secara akurat
              dengan teknologi <i>machine learning</i>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Universitas Bunda Mulia • StuntingCare v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
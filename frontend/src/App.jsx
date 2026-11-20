import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DashboardOrtu from './pages/DashboardOrtu'
import Balita from './pages/Balita'
import Prediksi from './pages/Prediksi'
import Riwayat from './pages/Riwayat'
import ManajemenUser from './pages/ManajemenUser'

function Layout({ children, darkMode, onToggleTheme }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className={`flex min-h-screen ${darkMode
      ? 'bg-slate-900 text-slate-100'
      : 'bg-gradient-to-br from-[#F0FDFA] to-[#E0F2FE]'}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(collapsed => !collapsed)}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
      />
      <main className="min-w-0 flex-1 px-4 pt-24 pb-6 overflow-auto md:p-6">{children}</main>
    </div>
  )
}

function DashboardRouter() {
  const { user } = useAuth()
  if (user?.role === 'ortu') return <DashboardOrtu/>
  return <Dashboard/>
}

function PageMetadata() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const pageTitles = {
    '/login': 'Masuk',
    '/dashboard': user?.role === 'ortu' ? 'Dashboard Orang Tua' : 'Dashboard',
    '/dashboard-ortu': 'Dashboard Orang Tua',
    '/balita': 'Data Balita',
    '/prediksi': 'Prediksi Stunting',
    '/riwayat': 'Riwayat Pertumbuhan',
    '/users': user?.role === 'admin' ? 'Manajemen Pengguna' : 'Kelola Orang Tua',
  }
  const pageTitle = pageTitles[pathname] || 'StuntingCare'

  useEffect(() => {
    document.title = pageTitle === 'StuntingCare'
      ? pageTitle
      : `${pageTitle} | StuntingCare`
  }, [pageTitle])

  return null
}

export default function App() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('stuntingcare-theme') === 'dark'
  )

  useEffect(() => {
    localStorage.setItem('stuntingcare-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const toggleTheme = () => setDarkMode(current => !current)

  return (
    <div className={darkMode ? 'dark min-h-screen bg-slate-900' : 'min-h-screen'}>
      <AuthProvider>
        <BrowserRouter>
          <PageMetadata/>
          <Routes>
            <Route path="/login" element={<Login/>}/>
            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>

            <Route path="/dashboard" element={
              <PrivateRoute>
                <Layout darkMode={darkMode} onToggleTheme={toggleTheme}>
                  <DashboardRouter/>
                </Layout>
              </PrivateRoute>
            }/>

            <Route path="/dashboard-ortu" element={
              <PrivateRoute roles={['ortu']}>
                <Layout darkMode={darkMode} onToggleTheme={toggleTheme}>
                  <DashboardOrtu/>
                </Layout>
              </PrivateRoute>
            }/>

            <Route path="/balita" element={
              <PrivateRoute roles={['admin','kader']}>
                <Layout darkMode={darkMode} onToggleTheme={toggleTheme}>
                  <Balita/>
                </Layout>
              </PrivateRoute>
            }/>

            <Route path="/prediksi" element={
              <PrivateRoute roles={['admin','kader','ortu']}>
                <Layout darkMode={darkMode} onToggleTheme={toggleTheme}>
                  <Prediksi/>
                </Layout>
              </PrivateRoute>
            }/>

            <Route path="/riwayat" element={
              <PrivateRoute>
                <Layout darkMode={darkMode} onToggleTheme={toggleTheme}>
                  <Riwayat/>
                </Layout>
              </PrivateRoute>
            }/>

            <Route path="/users" element={
              <PrivateRoute roles={['admin','kader']}>
                <Layout darkMode={darkMode} onToggleTheme={toggleTheme}>
                  <ManajemenUser/>
                </Layout>
              </PrivateRoute>
            }/>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  )
}
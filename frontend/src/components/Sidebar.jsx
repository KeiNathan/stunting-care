import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Baby, ClipboardList, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  Users, Activity, Moon, Sun
} from 'lucide-react'

export default function Sidebar({ collapsed, onToggle, darkMode, onToggleTheme }) {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuAdmin = [
    { to: '/dashboard', icon: <LayoutDashboard size={18}/>, label: 'Dashboard',       emoji: '🏠' },
    { to: '/balita',    icon: <Baby size={18}/>,            label: 'Data Balita',      emoji: '👶' },
    { to: '/prediksi',  icon: <Activity size={18}/>,        label: 'Prediksi',         emoji: '🔍' },
    { to: '/riwayat',   icon: <ClipboardList size={18}/>,   label: 'Riwayat',          emoji: '📈' },
    { to: '/users',     icon: <Users size={18}/>,           label: 'Manajemen User',   emoji: '👥' },
  ]

  const menuKader = [
    { to: '/dashboard', icon: <LayoutDashboard size={18}/>, label: 'Dashboard',        emoji: '🏠' },
    { to: '/balita',    icon: <Baby size={18}/>,            label: 'Data Balita',       emoji: '👶' },
    { to: '/prediksi',  icon: <Activity size={18}/>,        label: 'Prediksi',          emoji: '🔍' },
    { to: '/riwayat',   icon: <ClipboardList size={18}/>,   label: 'Riwayat',           emoji: '📈' },
    { to: '/users',     icon: <Users size={18}/>,           label: 'Kelola Orang Tua',  emoji: '👨‍👩‍👦' },
  ]

  const menuOrtu = [
    { to: '/dashboard', icon: <LayoutDashboard size={18}/>, label: 'Dashboard',  emoji: '🏠' },
    { to: '/riwayat',   icon: <ClipboardList size={18}/>,   label: 'Riwayat',    emoji: '📈' },
    ...(user?.canPredict ? [{
      to: '/prediksi', icon: <Activity size={18}/>, label: 'Prediksi', emoji: '🔍'
    }] : []),
  ]

  const menus = user?.role === 'admin' ? menuAdmin
              : user?.role === 'kader' ? menuKader
              : menuOrtu

  const roleLabel = {
    admin: { label: 'Administrator', emoji: '⚙️' },
    kader: { label: 'Kader Posyandu', emoji: '👩‍⚕️' },
    ortu:  { label: 'Orang Tua', emoji: '👨‍👩‍👦' },
  }[user?.role] || { label: user?.role, emoji: '👤' }

  return (
    <aside className={`${collapsed ? 'md:w-20' : 'md:w-64'} fixed inset-x-0 top-0 z-40
                       max-h-screen overflow-y-auto md:sticky md:top-0 md:h-screen md:max-h-screen md:flex-shrink-0
                       ${darkMode ? 'bg-slate-950' : 'bg-teal-700'} text-white flex flex-col
                       md:transition-[width] md:duration-200 md:ease-in-out`}>
      {/* Logo */}
      <div className={`relative p-4 border-b border-teal-500/50
        md:transition-[height] md:duration-200 md:ease-in-out
        ${collapsed ? 'md:h-28' : 'md:h-[72px]'}`}>
        <div className={`flex items-center justify-between gap-2
          ${collapsed ? 'md:justify-center' : ''}`}>
          <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 flex-shrink-0 bg-[#F0FDFA] rounded-xl flex items-center
                          justify-center text-xl">
            <img
              src="/stuntingcare-mark.png"
              alt="Logo StuntingCare"
              className="h-full w-full rounded-xl object-contain p-0.5"
            />
          </div>
          <div className="md:hidden">
            <h1 className="text-lg font-bold leading-tight">StuntingCare</h1>
            <p className="text-teal-200 text-xs">Monitoring Stunting Balita</p>
          </div>
          {!collapsed && <div className="hidden md:block">
            <h1 className="text-lg font-bold leading-tight">StuntingCare</h1>
            <p className="text-teal-200 text-xs">Monitoring Stunting Balita</p>
          </div>}
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(open => !open)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg
                       text-teal-100 hover:bg-cyan-100/15 hover:text-white transition-colors md:hidden"
          >
            {mobileOpen ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            aria-expanded={!collapsed}
            className={`hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg
              text-teal-100 hover:bg-cyan-100/15 hover:text-white transition-colors
              md:absolute md:right-4 md:z-10 md:flex md:transition-all md:duration-200 md:ease-in-out
              ${collapsed ? 'md:top-[68px]' : 'md:top-4'}`}
          >
            {collapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
          </button>
        </div>
      </div>

      <div className={`flex flex-1 flex-col overflow-y-auto transition-[max-height,opacity,transform]
        duration-300 ease-out motion-reduce:transition-none md:contents md:max-h-none
        md:translate-y-0 md:overflow-visible md:opacity-100 md:pointer-events-auto
        ${mobileOpen
          ? 'max-h-[calc(100dvh-4rem)] translate-y-0 opacity-100'
          : 'pointer-events-none max-h-0 -translate-y-2 opacity-0'}`}>
      {/* User info */}
      <div className="p-4 border-b border-teal-500/50">
        <div className={`flex items-center gap-3 ${collapsed ? 'md:justify-center md:gap-0' : ''}`}>
          <div className="w-10 h-10 bg-cyan-100/20 rounded-xl flex items-center
                          justify-center text-xl flex-shrink-0">
            {roleLabel.emoji}
          </div>
          <div className="min-w-0 md:hidden">
            <p className="font-semibold text-sm truncate">{user?.nama}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100/20 text-teal-50">
              {roleLabel.label}
            </span>
          </div>
          {!collapsed && <div className="hidden min-w-0 md:block">
            <p className="font-semibold text-sm truncate">{user?.nama}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100/20 text-teal-50">
              {roleLabel.label}
            </span>
          </div>}
        </div>
        {!collapsed && user?.role === 'ortu' && (
          <div className={`mt-2 text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5
            ${user?.canPredict
              ? 'bg-green-400/20 text-green-100'
              : 'bg-cyan-100/10 text-teal-200'}`}>
            {user?.canPredict ? '✅ Bisa Prediksi' : '👁️ Hanya Pantau'}
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menus.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? m.label : undefined}
            aria-label={m.label}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 ${collapsed ? 'md:justify-center md:px-0 md:gap-0' : ''} py-2.5
              rounded-lg transition-colors text-sm
              ${isActive
                ? 'bg-[#F0FDFA] text-teal-700 font-semibold'
                : 'text-teal-100 hover:bg-cyan-100/15 hover:text-white'}`
            }
          >
            <span className="text-base">{m.emoji}</span>
            <span className="md:hidden">{m.label}</span>
            {!collapsed && <span className="hidden md:inline">{m.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Tombol keluar */}
      <div className="p-4 border-t border-teal-500/50">
        <div className={`mb-2 flex items-center justify-between gap-3 px-4 py-2.5
                        ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
          <span className="text-sm text-teal-100 md:hidden">Mode gelap</span>
          {!collapsed && <span className="hidden text-sm text-teal-100 md:inline">Mode gelap</span>}
          <button
            type="button"
            role="switch"
            onClick={onToggleTheme}
            title={collapsed ? 'Mode gelap' : undefined}
            aria-label="Mode gelap"
            aria-checked={darkMode}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full
                        transition-colors ${darkMode ? 'bg-cyan-400' : 'bg-cyan-100/30'}`}
          >
            <span className={`absolute left-0.5 flex h-5 w-5 items-center justify-center
                              rounded-full bg-white text-teal-700 shadow-sm transition-transform
                              ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}>
              {darkMode ? <Moon size={12}/> : <Sun size={12}/>}
            </span>
          </button>
        </div>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Keluar' : undefined}
          aria-label="Keluar"
          className={`flex items-center gap-3 px-4 ${collapsed ? 'md:justify-center md:px-0 md:gap-0' : ''}
                     w-full py-2.5 rounded-lg
                     text-teal-200 hover:bg-red-500/80 hover:text-white
                     transition-colors text-sm`}
        >
          <span className="text-base">🚪</span>
          <span className="md:hidden">Keluar</span>
          {!collapsed && <span className="hidden md:inline">Keluar</span>}
        </button>
      </div>
      </div>
    </aside>
  )
}
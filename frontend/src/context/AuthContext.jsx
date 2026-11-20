import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token      = localStorage.getItem('token')
    const role       = localStorage.getItem('role')
    const nama       = localStorage.getItem('nama')
    const userId     = localStorage.getItem('user_id')
    const canPredict = localStorage.getItem('can_predict') === 'true'
    if (token) setUser({ token, role, nama, userId, canPredict })
    setLoading(false)
  }, [])

  const login = (data) => {
    localStorage.setItem('token',       data.access_token)
    localStorage.setItem('role',        data.role)
    localStorage.setItem('nama',        data.nama)
    localStorage.setItem('user_id',     data.user_id)
    localStorage.setItem('can_predict', data.can_predict)
    setUser({
      token      : data.access_token,
      role       : data.role,
      nama       : data.nama,
      userId     : data.user_id,
      canPredict : data.can_predict,
    })
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'

// Lazy load components
const Auth = lazy(() => import('./page/Auth'))
const Dashboard = lazy(() => import('./page/Dashboard'))

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-xl">Đang tải...</div>
  </div>
)

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public route - Auth */}
          <Route 
            path="/auth" 
            element={
              !user ? (
                <Auth />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          
          {/* Protected route - Dashboard */}
          <Route 
            path="/dashboard" 
            element={
              user ? (
                <Dashboard />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          
          {/* Default route - Redirect based on auth status */}
          <Route 
            path="/" 
            element={
              <Navigate to={user ? "/dashboard" : "/auth"} replace />
            } 
          />
          
          {/* Catch all - Redirect to appropriate page */}
          <Route 
            path="*" 
            element={
              <Navigate to={user ? "/dashboard" : "/auth"} replace />
            } 
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App

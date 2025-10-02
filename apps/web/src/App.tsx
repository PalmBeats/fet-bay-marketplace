import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/hooks/useAuth'
import Home from '@/pages/Home'
import Auth from '@/pages/Auth'
import ListingDetail from '@/pages/ListingDetail'
import Checkout from '@/pages/Checkout'
import Sell from '@/pages/Sell'
import Account from '@/pages/Account'
import Admin from '@/pages/Admin'
import NewAdmin from '@/pages/NewAdmin'
import Navbar from '@/components/Navbar'

function App() {
  const { loading } = useAuth()
  
  // Handle GitHub Pages routing
  useEffect(() => {
    if (import.meta.env.VITE_SITE_URL?.includes('github.io')) {
      const path = location.pathname
      if (path.length > 1) {
        // Redirect GitHub Pages routes to React Router query format
        let pathPrefix = '/fet-bay-marketplace/'
        if (!path.startsWith(pathPrefix)) {
          let newPath = pathPrefix + '?/' + path.substring(1).replace(/&/g, '~and~').replace(/\?/g, '~q~')
          location.replace(newPath)
        }
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-rose-950 to-black text-white overflow-x-hidden w-full">
        <Navbar />
        <main className="bg-gradient-to-br from-gray-900 via-rose-950 to-black overflow-x-hidden w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/__/newadmin" element={<NewAdmin />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  )
}

export default App
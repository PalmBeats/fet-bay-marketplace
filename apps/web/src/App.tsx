import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
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
import MakeAdmin from '@/pages/MakeAdmin'
import Navbar from '@/components/Navbar'

function AppRoutes() {
  const { loading } = useAuth()
  const location = useLocation()
  
  console.log('App render - loading:', loading)
  console.log('Current pathname:', location.pathname)

  return (
    <>
      <Navbar />
      <main className="bg-gradient-to-br from-gray-900 via-rose-950 to-black overflow-x-hidden w-full">
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fet-bay-marketplace/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/fet-bay-marketplace/admin" element={<Admin />} />
            <Route path="/__/newadmin" element={<NewAdmin />} />
            <Route path="/test-debug" element={
              <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-xl font-bold">🔧 DEBUG TEST ROUTE</h1>
                <p>This route works!</p>
                <p>Current path: {location.pathname}</p>
              </div>
            } />
            <Route path="/make-admin" element={<MakeAdmin />} />
            <Route path="/fet-bay-marketplace/make-admin" element={<MakeAdmin />} />
            <Route path="*" element={
              <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold mb-4">404 - Route Not Found</h1>
                <p className="mb-4">Current URL: {window.location.pathname}</p>
                <div className="mb-4">
                  <a href="/" className="text-blue-400 hover:text-blue-300">← Back to Homepage</a>
                </div>
              </div>
            } />
          </Routes>
        </main>
        <Toaster />
    </>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-rose-950 to-black text-white overflow-x-hidden w-full">
        <AppRoutes />
      </div>
    </Router>
  )
}

export default App
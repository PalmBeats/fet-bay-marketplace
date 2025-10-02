import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function MakeAdmin() {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  console.log('MakeAdmin render - user:', user, 'isAdmin:', isAdmin)

  // Redirect if already admin
  if (isAdmin) {
    console.log('User is already admin - redirecting to /admin')
    navigate('/admin')
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="text-center">Redirecting to admin dashboard...</div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    console.log('No user - redirecting to /auth')
    navigate('/auth')
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="text-center">Please sign in first...</div>
      </div>
    )
  }

  const handleMakeAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Check admin code (simple validation)
      const validAdminCode = 'MAKE-ME-ADMIN-2024'
      
      if (adminCode !== validAdminCode) {
        setError('Invalid admin code')
        setLoading(false)
        return
      }

      // Directly update profile to admin role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error promoting user to admin:', updateError)
        throw new Error('Failed to promote to admin: ' + updateError.message)
      }

      setSuccess(true)
      
      // Refresh auth state to detect admin role
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error) {
      console.error('Error making admin:', error)
      setError(error instanceof Error ? error.message : 'Failed to make admin')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">🎉 Success!</CardTitle>
            <CardDescription>
              You have been promoted to admin! Refreshing to show admin dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="mb-4 text-center text-sm text-muted-foreground bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded">
        🔧 MakeAdmin Page Loaded - Testing debugging
      </div>
      <Card>
        <CardHeader>
          <CardTitle>🔧 Make Me Admin</CardTitle>
          <CardDescription>
            Enter the admin code to promote your account to admin role.
            This gives you access to the admin dashboard with user management, 
            content moderation, and analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Admin Code:</strong> <code>MAKE-ME-ADMIN-2024</code>
            </p>
          </div>
          
          <form onSubmit={handleMakeAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminCode">Admin Code</Label>
              <Input
                id="adminCode"
                type="text"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Enter admin code"
                required
              />
            </div>
            
            {error && (
              <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-md">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : '🔧 Make Me Admin'}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <Button variant="link" onClick={() => navigate('/')}>
              ← Back to Homepage
            </Button>
            <div className="text-xs text-muted-foreground">
              After promotion, you'll see an "Admin" button in the navbar
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewAdmin() {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [bootstrapSecret, setBootstrapSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Redirect if already admin
  if (isAdmin) {
    navigate('/admin')
    return null
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/auth')
    return null
  }

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/auth')
        return
      }

      const response = await fetch(`${window.location.origin}/fet-bay-marketplace/functions/v1/admin-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'bootstrap_admin',
          bootstrap_secret: bootstrapSecret,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Bootstrap failed')
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/admin')
      }, 2000)
    } catch (error) {
      console.error('Error bootstrapping admin:', error)
      setError(error instanceof Error ? error.message : 'Bootstrap failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Success!</CardTitle>
            <CardDescription>
              You have been promoted to admin. Redirecting to admin dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Bootstrap Admin</CardTitle>
          <CardDescription>
            Use the bootstrap secret to promote your account to admin.
            This can only be done once per installation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBootstrap} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bootstrapSecret">Bootstrap Secret</Label>
              <Input
                id="bootstrapSecret"
                type="password"
                value={bootstrapSecret}
                onChange={(e) => setBootstrapSecret(e.target.value)}
                placeholder="Enter bootstrap secret"
                required
              />
            </div>
            
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : 'Bootstrap Admin'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

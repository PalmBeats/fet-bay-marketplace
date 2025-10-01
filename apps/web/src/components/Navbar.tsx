import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, profile, isBanned, isAdmin, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold">
              Fet-Bay
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-sm font-medium hover:text-primary">
                Browse
              </Link>
              {user && !isBanned && (
                <Link to="/sell" className="text-sm font-medium hover:text-primary">
                  Sell
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {isBanned && (
                  <div className="text-sm text-destructive font-medium">
                    Account Banned
                  </div>
                )}
                
                <div className="hidden md:block text-sm text-muted-foreground">
                  {profile?.email}
                </div>
                
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/account">Account</Link>
                </Button>
                
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin">Admin</Link>
                  </Button>
                )}
                
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

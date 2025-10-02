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
    <nav className="border-b gradient-header border-border ambient-glow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center gap-4 hover:text-white sensual-hover">
              <div className="relative">
                <img 
                  className="h-14 w-auto logo-glow transition-transform duration-300 hover:scale-110" 
                  src="/logo.png?v=2" 
                  alt="Fet-Bay Logo" 
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[hsl(var(--crimson-glow))] to-[hsl(var(--neon-glow))] opacity-0 hover:opacity-20 blur-md transition-all duration-500 -z-10" />
              </div>
              <span className="text-4xl font-bold font-[Playfair Display] sensual-glow-text">Fet-Bay</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-medium hover:text-[hsl(var(--crimson-glow))] py-2 px-3 rounded-md sensual-hover neon-border">
              Browse
            </Link>
            {user && !isBanned && (
              <Link to="/sell" className="text-medium hover:text-[hsl(var(--crimson-glow))] py-2 px-3 rounded-md sensual-hover neon-border">
                Sell
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {isBanned && (
                  <div className="text-sm text-destructive font-medium">Account Banned</div>
                )}
                <div className="hidden md:block text-sm text-muted-foreground">{profile?.email}</div>
                <Button variant="ghost" size="lg" asChild>
                  <Link to="/account">Account</Link>
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="lg" asChild>
                    <Link to="/admin">Admin</Link>
                  </Button>
                )}
                <Button variant="ghost" size="lg" onClick={handleSignOut}>Sign Out</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="lg" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="lg" asChild>
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

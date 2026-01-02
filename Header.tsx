import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from './ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

interface HeaderProps {
  onNavigate: (view: 'landing' | 'registration' | 'voting' | 'admin') => void;
}

export default function Header({ onNavigate }: HeaderProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      onNavigate('landing');
      toast.success('Logged out successfully');
    } else {
      try {
        await login();
        toast.success('Logged in successfully');
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer hover-lift transition-transform" onClick={() => onNavigate('landing')}>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md" />
            <img src="/assets/generated/eci-logo-transparent.dim_200x200.png" alt="ECI Logo" className="h-12 w-12 relative z-10" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Election Commission of India</h1>
            <p className="text-xs text-muted-foreground">Simulated Election Platform</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isAuthenticated && userProfile && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm">{userProfile.name}</span>
            </div>
          )}
          
          <Button
            onClick={handleAuth}
            disabled={disabled}
            variant={isAuthenticated ? 'outline' : 'default'}
            size="sm"
            className={`h-10 px-6 rounded-xl transition-all hover-lift shadow-md ${
              !isAuthenticated ? 'gradient-primary text-white hover:opacity-90' : 'border-2'
            }`}
          >
            {disabled ? (
              'Processing...'
            ) : isAuthenticated ? (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

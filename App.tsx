import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import VotingPage from './pages/VotingPage';
import AdminPage from './pages/AdminPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';

type AppView = 'landing' | 'registration' | 'voting' | 'admin';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [currentView, setCurrentView] = useState<AppView>('landing');

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Initializing Election Platform...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen">
        {showProfileSetup && <ProfileSetupModal />}
        
        {currentView === 'landing' && (
          <LandingPage onNavigate={setCurrentView} />
        )}
        
        {currentView === 'registration' && (
          <RegistrationPage onNavigate={setCurrentView} />
        )}
        
        {currentView === 'voting' && (
          <VotingPage onNavigate={setCurrentView} />
        )}
        
        {currentView === 'admin' && (
          <AdminPage onNavigate={setCurrentView} />
        )}
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

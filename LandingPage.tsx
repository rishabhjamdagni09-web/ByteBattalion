import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Vote, Shield, Users, CheckCircle, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'registration' | 'voting' | 'admin') => void;
}

const quotes = [
  {
    text: "Democracy is not merely a form of government. It is primarily a mode of associated living, of conjoint communicated experience.",
    author: "Dr. B.R. Ambedkar"
  },
  {
    text: "The ballot is stronger than the bullet.",
    author: "Abraham Lincoln"
  },
  {
    text: "Democracy is the government of the people, by the people, for the people.",
    author: "Abraham Lincoln"
  },
  {
    text: "Your vote is your voice. Make it count.",
    author: "Election Commission of India"
  }
];

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const [currentQuote, setCurrentQuote] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const isAuthenticated = !!identity;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} />
      
      <main className="flex-1">
        {/* Hero Section with Parallax */}
        <section className="relative overflow-hidden min-h-[90vh] flex items-center">
          {/* Animated Background */}
          <div className="absolute inset-0 gradient-animated" />
          
          {/* Overlay Pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'url(/assets/generated/indian-flag-bg.dim_1200x800.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: `translateY(${scrollY * 0.5}px)`,
            }}
          />
          
          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/20 blur-xl animate-float" />
          <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-accent/20 blur-xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-secondary/20 blur-xl animate-float" style={{ animationDelay: '2s' }} />
          
          <div className="container relative z-10 py-20">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              {/* Logo with Animation */}
              <div className="inline-block animate-bounce-in">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse-slow" />
                  <img 
                    src="/assets/generated/eci-logo-transparent.dim_200x200.png" 
                    alt="ECI Logo" 
                    className="h-32 w-32 mx-auto relative z-10 drop-shadow-2xl"
                  />
                </div>
              </div>
              
              {/* Main Heading with Gradient */}
              <div className="space-y-4 animate-slide-down">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
                  <span className="inline-block gradient-primary bg-clip-text text-transparent animate-shimmer">
                    Democracy in Action
                  </span>
                </h1>
              </div>
              
              {/* Description */}
              <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto leading-relaxed animate-slide-up">
                Experience the power of your vote in this simulated election platform. 
                Secure, transparent, and accessible to all eligible citizens.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 justify-center pt-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {!isAuthenticated ? (
                  <Button 
                    size="lg" 
                    className="gradient-primary text-white hover:opacity-90 transition-all hover-lift text-lg px-8 py-6 rounded-xl shadow-xl"
                    onClick={() => onNavigate('registration')}
                  >
                    Register to Vote
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      className="gradient-primary text-white hover:opacity-90 transition-all hover-lift text-lg px-8 py-6 rounded-xl shadow-xl"
                      onClick={() => onNavigate('voting')}
                    >
                      Cast Your Vote
                      <Vote className="ml-2 h-6 w-6" />
                    </Button>
                    {isAdmin && (
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="hover-lift text-lg px-8 py-6 rounded-xl border-2 shadow-xl bg-background/80 backdrop-blur"
                        onClick={() => onNavigate('admin')}
                      >
                        Admin Panel
                        <Shield className="ml-2 h-6 w-6" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Bottom Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="oklch(var(--background))" />
            </svg>
          </div>
        </section>

        {/* Quote Section with Enhanced Design */}
        <section className="py-20 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          
          <div className="container relative z-10">
            <Card className="max-w-4xl mx-auto border-2 border-primary/20 shadow-2xl hover-lift bg-card/80 backdrop-blur rounded-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 gradient-tricolor-horizontal" />
              
              <CardContent className="p-8 md:p-16 text-center">
                <div className="space-y-6 animate-fade-in" key={currentQuote}>
                  <div className="text-6xl text-primary/20 mb-4">"</div>
                  <p className="text-2xl md:text-4xl font-serif italic text-foreground leading-relaxed">
                    {quotes[currentQuote].text}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <div className="h-px w-12 bg-primary/50" />
                    <p className="text-xl text-primary font-semibold">
                      {quotes[currentQuote].author}
                    </p>
                    <div className="h-px w-12 bg-primary/50" />
                  </div>
                </div>
                
                {/* Quote Navigation Dots */}
                <div className="flex justify-center gap-3 mt-8">
                  {quotes.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuote(index)}
                      className={`h-3 rounded-full transition-all duration-300 ${
                        index === currentQuote 
                          ? 'w-12 gradient-primary' 
                          : 'w-3 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      aria-label={`Go to quote ${index + 1}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section with Enhanced Cards */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
          
          <div className="container relative z-10">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold animate-slide-up">
                Why Vote with Us?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                A secure, transparent, and user-friendly platform for democratic participation
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Feature 1 */}
              <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all hover-lift rounded-2xl overflow-hidden group animate-slide-up bg-card/50 backdrop-blur">
                <div className="absolute inset-0 gradient-primary opacity-0 group-hover:opacity-5 transition-opacity" />
                <CardContent className="p-8 text-center space-y-6 relative z-10">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                    <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto relative z-10 group-hover:scale-110 transition-transform shadow-xl">
                      <Shield className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold">Secure & Verified</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Aadhaar-based verification ensures only eligible voters can participate in the democratic process
                  </p>
                </CardContent>
              </Card>
              
              {/* Feature 2 */}
              <Card className="border-2 border-accent/20 hover:border-accent/40 transition-all hover-lift rounded-2xl overflow-hidden group animate-slide-up bg-card/50 backdrop-blur" style={{ animationDelay: '0.1s' }}>
                <div className="absolute inset-0 gradient-accent opacity-0 group-hover:opacity-5 transition-opacity" />
                <CardContent className="p-8 text-center space-y-6 relative z-10">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                    <div className="w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center mx-auto relative z-10 group-hover:scale-110 transition-transform shadow-xl">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold">One Person, One Vote</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Fair and transparent system preventing duplicate voting and ensuring electoral integrity
                  </p>
                </CardContent>
              </Card>
              
              {/* Feature 3 */}
              <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all hover-lift rounded-2xl overflow-hidden group animate-slide-up bg-card/50 backdrop-blur" style={{ animationDelay: '0.2s' }}>
                <div className="absolute inset-0 gradient-secondary opacity-0 group-hover:opacity-5 transition-opacity" />
                <CardContent className="p-8 text-center space-y-6 relative z-10">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                    <div className="w-20 h-20 rounded-2xl gradient-secondary flex items-center justify-center mx-auto relative z-10 group-hover:scale-110 transition-transform shadow-xl">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold">Accessible to All</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Simple, intuitive interface designed for every citizen to exercise their democratic right
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section with Enhanced Design */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 gradient-animated opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-transparent" />
          
          <div className="container relative z-10 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg animate-slide-up">
                Ready to Make Your Voice Heard?
              </h2>
              <p className="text-xl text-white/90 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Join thousands of citizens participating in this democratic process and shape the future of our nation
              </p>
              {!isAuthenticated && (
                <div className="animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                  <Button 
                    size="lg" 
                    className="bg-white text-primary hover:bg-white/90 transition-all hover-lift text-lg px-10 py-7 rounded-xl shadow-2xl font-bold"
                    onClick={() => onNavigate('registration')}
                  >
                    Get Started Now
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

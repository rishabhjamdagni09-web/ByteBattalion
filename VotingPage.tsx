import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllCandidates, useCanVote, useVote } from '../hooks/useQueries';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, ArrowLeft, Vote as VoteIcon, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import type { Candidate } from '../backend';
import { sanitizeAadhaar, isValidAadhaar } from '../lib/sanitize';

interface VotingPageProps {
  onNavigate: (view: 'landing' | 'registration' | 'voting' | 'admin') => void;
}

const symbolImages: Record<string, string> = {
  'Hand': '/assets/generated/hand-symbol.dim_100x100.png',
  'Lotus': '/assets/generated/lotus-symbol.dim_100x100.png',
  'Star': '/assets/generated/arrow-symbol.dim_100x100.png',
  'Elephant': '/assets/generated/elephant-symbol.dim_100x100.png',
  'Wheel': '/assets/generated/bicycle-symbol.dim_100x100.png',
};

// Enhanced Confetti Component with 3D effect
function Confetti() {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; color: string; size: number }>>([]);

  useEffect(() => {
    const colors = ['oklch(0.65 0.18 45)', 'oklch(0.55 0.15 145)', 'oklch(0.55 0.15 250)', 'oklch(0.98 0 0)'];
    const pieces = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6,
    }));
    setConfetti(pieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="confetti absolute"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function VotingPage({ onNavigate }: VotingPageProps) {
  const { identity } = useInternetIdentity();
  const { data: candidates, isLoading: candidatesLoading } = useGetAllCandidates();
  const canVoteMutation = useCanVote();
  const voteMutation = useVote();
  
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userAadhaar, setUserAadhaar] = useState<string>('');
  const [canVoteStatus, setCanVoteStatus] = useState<boolean | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!isAuthenticated) {
      setCheckingEligibility(false);
      return;
    }

    // Prompt for Aadhaar to check eligibility with sanitization
    const aadhaar = prompt('Please enter your registered Aadhaar number to verify voting eligibility:');
    if (aadhaar) {
      const sanitized = sanitizeAadhaar(aadhaar);
      if (isValidAadhaar(sanitized)) {
        setUserAadhaar(sanitized);
        checkVotingEligibility(sanitized);
      } else {
        setCheckingEligibility(false);
        toast.error('Valid 12-digit Aadhaar number required');
      }
    } else {
      setCheckingEligibility(false);
      toast.error('Aadhaar number is required to proceed');
    }
  }, [isAuthenticated]);

  const checkVotingEligibility = async (aadhaar: string) => {
    try {
      const eligible = await canVoteMutation.mutateAsync(aadhaar);
      setCanVoteStatus(eligible);
      setCheckingEligibility(false);
    } catch (error: any) {
      setCheckingEligibility(false);
      if (error.message?.includes('already voted')) {
        setHasVoted(true);
        toast.info('You have already cast your vote');
      } else {
        toast.error(error.message || 'Unable to verify voting eligibility');
      }
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate || !userAadhaar) return;

    try {
      await voteMutation.mutateAsync({
        aadhaar: userAadhaar,
        candidateId: selectedCandidate.id,
      });
      setHasVoted(true);
      setShowConfetti(true);
      toast.success('Vote cast successfully!');
      
      // Hide confetti after 4 seconds
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to cast vote');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onNavigate={onNavigate} />
        <main className="flex-1 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <Card className="max-w-md mx-4 shadow-2xl rounded-2xl border-2 relative z-10 animate-scale-in backdrop-blur-xl bg-card/80">
            <CardHeader>
              <CardTitle className="text-2xl">Authentication Required</CardTitle>
              <CardDescription>Please login to access the voting system</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => onNavigate('landing')} className="w-full h-12 rounded-xl gradient-primary text-white hover:opacity-90 transition-all hover-lift">
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (checkingEligibility) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onNavigate={onNavigate} />
        <main className="flex-1 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="text-center space-y-6 relative z-10">
            <div className="relative inline-block perspective-1000">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-slow" />
              <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
            </div>
            <p className="text-lg text-muted-foreground">Verifying your voting eligibility...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (canVoteStatus === false && !hasVoted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onNavigate={onNavigate} />
        <main className="flex-1 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-background to-destructive/5" />
          <Card className="max-w-md mx-4 shadow-2xl rounded-2xl border-2 border-destructive/30 relative z-10 animate-scale-in backdrop-blur-xl bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <AlertCircle className="h-6 w-6 text-destructive" />
                Not Eligible to Vote
              </CardTitle>
              <CardDescription>
                You are not registered or verified to vote in this election
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please complete the registration process first.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => onNavigate('registration')} className="flex-1 h-12 rounded-xl gradient-primary text-white hover:opacity-90 transition-all hover-lift">
                  Register Now
                </Button>
                <Button onClick={() => onNavigate('landing')} variant="outline" className="flex-1 h-12 rounded-xl border-2 hover-lift">
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} />
      
      {showConfetti && <Confetti />}
      
      <main className="flex-1 py-12 relative overflow-hidden">
        {/* Enhanced Animated Background with 3D depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" style={{ transform: 'translateZ(0)' }} />
        <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-accent/10 blur-3xl animate-float" style={{ animationDelay: '1s', transform: 'translateZ(0)' }} />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-secondary/10 blur-3xl animate-float" style={{ animationDelay: '2s', transform: 'translateZ(0)' }} />
        
        <div className="container max-w-6xl relative z-10">
          <Button 
            variant="ghost" 
            onClick={() => onNavigate('landing')}
            className="mb-6 hover-lift"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          {hasVoted ? (
            <Card className="shadow-2xl animate-bounce-in border-2 rounded-2xl overflow-hidden bg-card/80 backdrop-blur-xl">
              <div className="absolute top-0 left-0 w-full h-1 gradient-tricolor-horizontal" />
              <CardContent className="text-center space-y-8 py-16">
                <div className="relative inline-block perspective-1000">
                  <div className="absolute inset-0 bg-accent/30 rounded-full blur-3xl animate-pulse-slow" />
                  <div className="w-32 h-32 rounded-full gradient-accent flex items-center justify-center mx-auto relative z-10 shadow-2xl hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="h-20 w-20 text-white" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold">
                    <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
                      Thank You for Voting!
                    </span>
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Your vote has been recorded successfully. You have exercised your democratic right.
                  </p>
                </div>

                <Alert className="max-w-2xl mx-auto border-accent/30 bg-accent/5 rounded-xl backdrop-blur">
                  <AlertDescription className="flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <span>Your vote is confidential and secure. Results will be announced after the election concludes.</span>
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={() => onNavigate('landing')}
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 rounded-xl border-2 hover-lift hover:scale-[1.02] duration-200"
                >
                  Return to Home
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="shadow-2xl mb-8 border-2 rounded-2xl overflow-hidden bg-card/80 backdrop-blur-xl animate-slide-down">
                <div className="absolute top-0 left-0 w-full h-1 gradient-tricolor-horizontal" />
                <CardHeader className="text-center space-y-4 pt-8">
                  <div className="inline-block mx-auto perspective-1000">
                    <div className="relative transform-gpu">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-slow" />
                      <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto relative z-10 shadow-xl hover:scale-110 transition-transform duration-300">
                        <VoteIcon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-4xl font-bold">
                    <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                      Cast Your Vote
                    </span>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Select your preferred candidate and submit your vote
                  </CardDescription>
                </CardHeader>
              </Card>

              {candidatesLoading ? (
                <div className="text-center py-16">
                  <div className="relative inline-block perspective-1000">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-slow" />
                    <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
                  </div>
                  <p className="text-lg text-muted-foreground mt-6">Loading candidates...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    {candidates?.map((candidate, index) => (
                      <Card
                        key={candidate.id.toString()}
                        className={`cursor-pointer transition-all duration-300 hover-lift rounded-2xl overflow-hidden border-2 bg-card/50 backdrop-blur-xl animate-slide-up transform-gpu ${
                          selectedCandidate?.id === candidate.id
                            ? 'ring-4 ring-primary shadow-2xl scale-[1.02] border-primary glow-primary'
                            : 'hover:border-primary/40 border-border hover:scale-[1.01]'
                        }`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => setSelectedCandidate(candidate)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div 
                              className="w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-300 hover:scale-110 transform-gpu"
                              style={{ backgroundColor: `${candidate.color}20` }}
                            >
                              <img
                                src={symbolImages[candidate.symbol] || '/assets/generated/arrow-symbol.dim_100x100.png'}
                                alt={candidate.symbol}
                                className="w-16 h-16 object-contain"
                              />
                            </div>
                            
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-2xl font-bold">{candidate.name}</h3>
                                {selectedCandidate?.id === candidate.id && (
                                  <div className="relative perspective-1000">
                                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-lg animate-pulse-slow" />
                                    <CheckCircle className="h-8 w-8 text-primary shrink-0 relative z-10 hover:scale-110 transition-transform duration-300" />
                                  </div>
                                )}
                              </div>
                              
                              <Badge 
                                className="text-sm px-3 py-1 shadow-md hover:scale-105 transition-transform duration-200"
                                style={{ 
                                  backgroundColor: candidate.color,
                                  color: 'white'
                                }}
                              >
                                {candidate.party}
                              </Badge>
                              
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="font-semibold">Symbol:</span> {candidate.symbol}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {selectedCandidate && (
                    <Card className="shadow-2xl border-2 border-primary/40 rounded-2xl overflow-hidden animate-slide-up bg-card/80 backdrop-blur-xl glow-primary">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="text-center md:text-left">
                            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2 justify-center md:justify-start">
                              <Sparkles className="h-4 w-4" />
                              You have selected:
                            </p>
                            <p className="text-2xl font-bold">
                              {selectedCandidate.name} - {selectedCandidate.party}
                            </p>
                          </div>
                          
                          <Button
                            onClick={handleVote}
                            disabled={voteMutation.isPending}
                            size="lg"
                            className="gradient-primary text-white h-14 px-8 text-lg rounded-xl hover:opacity-90 transition-all hover-lift shadow-xl hover:scale-[1.02] duration-200"
                          >
                            {voteMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <VoteIcon className="mr-2 h-6 w-6" />
                                Confirm Vote
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!selectedCandidate && (
                    <Alert className="border-primary/30 bg-primary/5 rounded-xl animate-slide-up backdrop-blur">
                      <AlertDescription className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Please select a candidate to proceed with voting
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

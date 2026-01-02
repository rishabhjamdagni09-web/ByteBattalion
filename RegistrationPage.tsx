import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGenerateOtp, useValidateOtp } from '../hooks/useQueries';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';
import { CheckCircle, ArrowLeft, Loader2, Sparkles, Shield } from 'lucide-react';
import { sanitizeAadhaar, sanitizeOtp, isValidAadhaar, isValidOtp, validateAge } from '../lib/sanitize';

interface RegistrationPageProps {
  onNavigate: (view: 'landing' | 'registration' | 'voting' | 'admin') => void;
}

export default function RegistrationPage({ onNavigate }: RegistrationPageProps) {
  const { identity, login, loginStatus } = useInternetIdentity();
  const [step, setStep] = useState<'aadhaar' | 'otp' | 'success'>('aadhaar');
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  
  const generateOtpMutation = useGenerateOtp();
  const validateOtpMutation = useValidateOtp();

  const isAuthenticated = !!identity;

  const handleAadhaarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize and validate Aadhaar
    const sanitizedAadhaar = sanitizeAadhaar(aadhaar);
    
    if (!isValidAadhaar(sanitizedAadhaar)) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    // Validate age
    const ageValidation = validateAge(sanitizedAadhaar, 18);
    if (!ageValidation.valid) {
      toast.error(ageValidation.error || 'Age validation failed');
      return;
    }

    try {
      const otpValue = await generateOtpMutation.mutateAsync(sanitizedAadhaar);
      setGeneratedOtp(otpValue.toString());
      setStep('otp');
      toast.success('OTP generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate OTP');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize and validate OTP
    const sanitizedOtp = sanitizeOtp(otp);
    
    if (!isValidOtp(sanitizedOtp)) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please login first to complete registration');
      try {
        await login();
      } catch (error) {
        console.error('Login error:', error);
      }
      return;
    }

    try {
      await validateOtpMutation.mutateAsync({ 
        aadhaar: sanitizeAadhaar(aadhaar), 
        otp: BigInt(sanitizedOtp) 
      });
      setStep('success');
      toast.success('Registration successful!');
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    }
  };

  const handleAadhaarChange = (value: string) => {
    setAadhaar(sanitizeAadhaar(value));
  };

  const handleOtpChange = (value: string) => {
    setOtp(sanitizeOtp(value));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} />
      
      <main className="flex-1 py-12 relative overflow-hidden">
        {/* Animated Background with 3D depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" style={{ transform: 'translateZ(0)' }} />
        <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-accent/10 blur-3xl animate-float" style={{ animationDelay: '1s', transform: 'translateZ(0)' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-secondary/5 blur-3xl animate-float" style={{ animationDelay: '2s', transform: 'translate(-50%, -50%) translateZ(0)' }} />
        
        <div className="container max-w-2xl relative z-10">
          <Button 
            variant="ghost" 
            onClick={() => onNavigate('landing')}
            className="mb-6 hover-lift"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Card className="shadow-2xl animate-scale-in border-2 rounded-2xl overflow-hidden bg-card/80 backdrop-blur-xl">
            <div className="absolute top-0 left-0 w-full h-1 gradient-tricolor-horizontal" />
            
            <CardHeader className="text-center space-y-4 pt-8">
              <div className="inline-block mx-auto perspective-1000">
                <div className="relative transform-gpu">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-slow" />
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto relative z-10 shadow-xl hover:scale-110 transition-transform duration-300">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Voter Registration
                </span>
              </CardTitle>
              <CardDescription className="text-lg">
                Complete the registration process to cast your vote
              </CardDescription>
              
              {/* Enhanced Progress Indicator with 3D effect */}
              <div className="flex items-center justify-center gap-2 pt-4">
                <div className={`h-2 w-16 rounded-full transition-all duration-500 ${step === 'aadhaar' ? 'gradient-primary scale-110' : 'bg-primary'}`} />
                <div className={`h-2 w-16 rounded-full transition-all duration-500 ${step === 'otp' ? 'gradient-primary scale-110' : step === 'success' ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`h-2 w-16 rounded-full transition-all duration-500 ${step === 'success' ? 'gradient-accent scale-110' : 'bg-muted'}`} />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 p-8">
              {step === 'aadhaar' && (
                <form onSubmit={handleAadhaarSubmit} className="space-y-6 animate-slide-up">
                  <div className="space-y-3">
                    <Label htmlFor="aadhaar" className="text-base font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Aadhaar Number
                    </Label>
                    <Input
                      id="aadhaar"
                      type="text"
                      placeholder="Enter 12-digit Aadhaar number"
                      value={aadhaar}
                      onChange={(e) => handleAadhaarChange(e.target.value)}
                      maxLength={12}
                      autoComplete="off"
                      className="text-lg h-14 rounded-xl border-2 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all hover:scale-[1.01] duration-200"
                    />
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      For simulation: Last 4 digits represent birth year (e.g., 1995)
                    </p>
                  </div>

                  <Alert className="border-primary/30 bg-primary/5 rounded-xl backdrop-blur">
                    <AlertDescription className="text-sm">
                      <strong>Note:</strong> This is a simulated platform. Enter any 12-digit number 
                      where the last 4 digits represent a birth year (must be 18+ years old).
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    className="w-full gradient-primary text-white h-14 text-lg rounded-xl hover:opacity-90 transition-all hover-lift shadow-xl hover:scale-[1.02] duration-200"
                    disabled={generateOtpMutation.isPending}
                  >
                    {generateOtpMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating OTP...
                      </>
                    ) : (
                      'Generate OTP'
                    )}
                  </Button>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleOtpSubmit} className="space-y-6 animate-slide-left">
                  <Alert className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30 rounded-xl backdrop-blur">
                    <AlertDescription className="text-center space-y-2">
                      <p className="font-semibold text-base">Your OTP</p>
                      <p className="text-4xl font-mono font-bold text-primary tracking-wider">{generatedOtp}</p>
                      <p className="text-sm text-muted-foreground">
                        (In a real system, this would be sent via SMS)
                      </p>
                    </AlertDescription>
                  </Alert>

                  {!isAuthenticated && (
                    <Alert className="border-secondary/30 bg-secondary/5 rounded-xl backdrop-blur">
                      <AlertDescription>
                        Please login with Internet Identity to complete registration
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="otp" className="text-base font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Enter OTP
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => handleOtpChange(e.target.value)}
                      maxLength={6}
                      autoComplete="off"
                      className="text-2xl text-center tracking-widest h-16 rounded-xl border-2 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all font-mono hover:scale-[1.01] duration-200"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setStep('aadhaar');
                        setOtp('');
                        setGeneratedOtp('');
                      }}
                      className="flex-1 h-14 rounded-xl border-2 hover-lift hover:scale-[1.02] duration-200"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 gradient-primary text-white h-14 rounded-xl hover:opacity-90 transition-all hover-lift shadow-xl hover:scale-[1.02] duration-200"
                      disabled={validateOtpMutation.isPending || loginStatus === 'logging-in'}
                    >
                      {validateOtpMutation.isPending || loginStatus === 'logging-in' ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify & Register'
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {step === 'success' && (
                <div className="text-center space-y-8 py-8 animate-bounce-in">
                  <div className="relative inline-block perspective-1000">
                    <div className="absolute inset-0 bg-accent/30 rounded-full blur-2xl animate-pulse-slow" />
                    <div className="w-28 h-28 rounded-full gradient-accent flex items-center justify-center mx-auto relative z-10 shadow-2xl hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="h-16 w-16 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-3xl font-bold">
                      <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
                        Registration Successful!
                      </span>
                    </h3>
                    <p className="text-lg text-muted-foreground">
                      You are now eligible to cast your vote
                    </p>
                  </div>

                  <Button 
                    onClick={() => onNavigate('voting')}
                    className="gradient-primary text-white h-14 px-8 text-lg rounded-xl hover:opacity-90 transition-all hover-lift shadow-xl hover:scale-[1.02] duration-200"
                    size="lg"
                  >
                    Proceed to Voting
                    <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

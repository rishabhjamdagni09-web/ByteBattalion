import { useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin, useGetVoteCounts, useGetAllVotes, useGetAllVoters, useGetAllCandidates, useResetAdmin } from '../hooks/useQueries';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, Shield, BarChart3, Users, Vote, Loader2, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

interface AdminPageProps {
  onNavigate: (view: 'landing' | 'registration' | 'voting' | 'admin') => void;
}

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminCheckLoading } = useIsCallerAdmin();
  const { data: voteCounts, isLoading: countsLoading } = useGetVoteCounts();
  const { data: allVotes, isLoading: votesLoading } = useGetAllVotes();
  const { data: allVoters, isLoading: votersLoading } = useGetAllVoters();
  const { data: candidates } = useGetAllCandidates();
  const resetAdminMutation = useResetAdmin();

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!adminCheckLoading && !isAdmin) {
      toast.error('Access denied: Admin privileges required');
      onNavigate('landing');
    }
  }, [isAdmin, adminCheckLoading, onNavigate]);

  const handleReset = async () => {
    try {
      await resetAdminMutation.mutateAsync();
      toast.success('All data has been reset successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset data');
    }
  };

  if (!isAuthenticated || adminCheckLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onNavigate={onNavigate} />
        <main className="flex-1 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="text-center space-y-6 relative z-10">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-slow" />
              <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
            </div>
            <p className="text-lg text-muted-foreground">Verifying admin access...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const totalVotes = voteCounts?.reduce((sum, [_, count]) => sum + Number(count), 0) || 0;
  const totalVoters = allVoters?.length || 0;
  const verifiedVoters = allVoters?.filter(v => v.verified).length || 0;
  const votedCount = allVoters?.filter(v => v.hasVoted).length || 0;
  const turnoutPercentage = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} />
      
      <main className="flex-1 py-12 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-secondary/10 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="container max-w-7xl relative z-10">
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('landing')}
              className="hover-lift"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="hover-lift shadow-lg">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Reset All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete all voters, votes, and registration data. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleReset}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                  >
                    {resetAdminMutation.isPending ? 'Resetting...' : 'Reset All Data'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Card className="shadow-2xl mb-8 border-2 rounded-2xl overflow-hidden bg-card/80 backdrop-blur animate-slide-down">
            <div className="absolute top-0 left-0 w-full h-1 gradient-tricolor-horizontal" />
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-slow" />
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center relative z-10 shadow-xl">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-4xl font-bold">Admin Dashboard</CardTitle>
                  <CardDescription className="text-lg">
                    Monitor and manage election data in real-time
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Statistics Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="hover-lift border-2 rounded-2xl overflow-hidden bg-card/50 backdrop-blur animate-slide-up shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center relative z-10">
                      <Vote className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Votes</p>
                    <p className="text-3xl font-bold">{totalVotes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift border-2 rounded-2xl overflow-hidden bg-card/50 backdrop-blur animate-slide-up shadow-xl" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-accent/20 rounded-full blur-lg" />
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center relative z-10">
                      <Users className="h-7 w-7 text-accent" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Registered Voters</p>
                    <p className="text-3xl font-bold">{totalVoters}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift border-2 rounded-2xl overflow-hidden bg-card/50 backdrop-blur animate-slide-up shadow-xl" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-secondary/20 rounded-full blur-lg" />
                    <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center relative z-10">
                      <Shield className="h-7 w-7 text-secondary" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Verified Voters</p>
                    <p className="text-3xl font-bold">{verifiedVoters}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift border-2 rounded-2xl overflow-hidden bg-card/50 backdrop-blur animate-slide-up shadow-xl" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-chart-3/20 rounded-full blur-lg" />
                    <div className="w-14 h-14 rounded-xl bg-chart-3/10 flex items-center justify-center relative z-10">
                      <TrendingUp className="h-7 w-7 text-chart-3" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Turnout</p>
                    <p className="text-3xl font-bold">{turnoutPercentage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="results" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-14 rounded-xl bg-muted/50 p-1">
              <TabsTrigger value="results" className="rounded-lg text-base">Vote Results</TabsTrigger>
              <TabsTrigger value="votes" className="rounded-lg text-base">Vote Records</TabsTrigger>
              <TabsTrigger value="voters" className="rounded-lg text-base">Voter List</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-6">
              <Card className="border-2 rounded-2xl overflow-hidden bg-card/80 backdrop-blur shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle className="text-2xl">Live Vote Counts</CardTitle>
                      <CardDescription>Real-time voting results by candidate</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {countsLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {candidates?.map((candidate, index) => {
                        const voteCount = Number(voteCounts?.find(([id]) => id === candidate.id)?.[1] || 0);
                        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                        
                        return (
                          <div key={candidate.id.toString()} className="space-y-3 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Badge 
                                  className="text-sm px-3 py-1 shadow-md"
                                  style={{ backgroundColor: candidate.color, color: 'white' }}
                                >
                                  {candidate.symbol}
                                </Badge>
                                <div>
                                  <p className="font-bold text-lg">{candidate.name}</p>
                                  <p className="text-sm text-muted-foreground">{candidate.party}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-3xl font-bold">{voteCount}</p>
                                <p className="text-sm text-muted-foreground font-medium">{percentage.toFixed(1)}%</p>
                              </div>
                            </div>
                            <div className="relative">
                              <Progress value={percentage} className="h-3 rounded-full" />
                              <div 
                                className="absolute top-0 left-0 h-3 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: candidate.color,
                                  opacity: 0.3
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="votes">
              <Card className="border-2 rounded-2xl overflow-hidden bg-card/80 backdrop-blur shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Vote Records</CardTitle>
                  <CardDescription>Complete list of all votes cast</CardDescription>
                </CardHeader>
                <CardContent>
                  {votesLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    </div>
                  ) : allVotes && allVotes.length > 0 ? (
                    <div className="rounded-xl border-2 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-bold">Voter Aadhaar</TableHead>
                            <TableHead className="font-bold">Candidate</TableHead>
                            <TableHead className="font-bold">Timestamp</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allVotes.map((vote, index) => {
                            const candidate = candidates?.find(c => c.id === vote.candidateId);
                            const date = new Date(Number(vote.timestamp) / 1000000);
                            
                            return (
                              <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="font-mono">
                                  {vote.voterAadhaar.slice(0, 4)}****{vote.voterAadhaar.slice(-4)}
                                </TableCell>
                                <TableCell>
                                  {candidate ? (
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        className="text-xs"
                                        style={{ backgroundColor: candidate.color, color: 'white' }}
                                      >
                                        {candidate.symbol}
                                      </Badge>
                                      <span className="font-medium">{candidate.name}</span>
                                    </div>
                                  ) : (
                                    `Candidate #${vote.candidateId.toString()}`
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {date.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <Alert className="border-primary/30 bg-primary/5 rounded-xl">
                      <AlertDescription>No votes have been cast yet</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="voters">
              <Card className="border-2 rounded-2xl overflow-hidden bg-card/80 backdrop-blur shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Registered Voters</CardTitle>
                  <CardDescription>List of all registered voters and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  {votersLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    </div>
                  ) : allVoters && allVoters.length > 0 ? (
                    <div className="rounded-xl border-2 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-bold">Aadhaar</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="font-bold">Voted</TableHead>
                            <TableHead className="font-bold">Principal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allVoters.map((voter, index) => (
                            <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-mono">
                                {voter.aadhaar.slice(0, 4)}****{voter.aadhaar.slice(-4)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={voter.verified ? 'default' : 'secondary'} className="shadow-sm">
                                  {voter.verified ? 'Verified' : 'Pending'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={voter.hasVoted ? 'default' : 'outline'} className="shadow-sm">
                                  {voter.hasVoted ? 'Yes' : 'No'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {voter.principal.toString().slice(0, 10)}...
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <Alert className="border-primary/30 bg-primary/5 rounded-xl">
                      <AlertDescription>No voters registered yet</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

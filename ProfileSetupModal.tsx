import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { sanitizeName, isValidName } from '../lib/sanitize';
import { User } from 'lucide-react';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitized = sanitizeName(name);
    
    if (!isValidName(sanitized)) {
      toast.error('Please enter a valid name (2-100 characters)');
      return;
    }

    try {
      await saveProfile.mutateAsync({ name: sanitized });
      toast.success('Profile created successfully!');
    } catch (error) {
      toast.error('Failed to create profile');
      console.error(error);
    }
  };

  const handleNameChange = (value: string) => {
    setName(sanitizeName(value));
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md rounded-2xl backdrop-blur-xl bg-card/95" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-slow" />
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center relative z-10 shadow-xl">
                <User className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">Welcome to the Election Platform</DialogTitle>
          <DialogDescription className="text-center">
            Please enter your name to complete your profile setup.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your full name"
              autoFocus
              autoComplete="off"
              maxLength={100}
              className="h-12 rounded-xl border-2 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl gradient-primary text-white hover:opacity-90 transition-all hover-lift shadow-xl"
            disabled={saveProfile.isPending}
          >
            {saveProfile.isPending ? 'Creating Profile...' : 'Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

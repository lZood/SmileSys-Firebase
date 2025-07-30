
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToothIcon } from '@/components/icons/tooth-icon';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { activateInvitedUser } from '../admin/actions';
import { User } from '@supabase/supabase-js';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
            toast({ variant: 'destructive', title: 'Invalid Invitation', description: 'No user session found. Please use the invitation link from your email.' });
            router.push('/');
        } else {
            setUser(data.user);
        }
    };
    checkUser();
  }, [router, supabase, toast]);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const { error } = await activateInvitedUser({
        firstName,
        lastName,
        password,
    });

    if (error) {
        toast({
            variant: 'destructive',
            title: 'Error Activating Account',
            description: error,
        });
    } else {
        toast({
            title: 'Account Activated!',
            description: 'You can now sign in with your new credentials.',
        });
        // Sign out the temporary session before redirecting to login
        await supabase.auth.signOut();
        router.push('/');
    }
    
    setIsLoading(false);
  };

  if (!user) {
    return <div>Loading...</div>; // Or a proper loading skeleton
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <ToothIcon className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">Complete your SmileSys Account</CardTitle>
          <CardDescription>Welcome! Set your password to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-4">
             <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email} disabled />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Create a Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Activating Account...' : 'Activate and Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

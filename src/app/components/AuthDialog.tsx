import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, name: string) => Promise<void>;
}

export default function AuthDialog({ open, onOpenChange, onLogin, onSignup }: AuthDialogProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await onLogin(loginEmail, loginPassword);
      onOpenChange(false);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      await onSignup(signupEmail, signupPassword, signupName);
      onOpenChange(false);
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-sm border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-[var(--font-heading)]">Welcome</DialogTitle>
          <DialogDescription className="font-[var(--font-body)]">
            Sign in to explore curated home interiors
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="bg-input-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="bg-input-background"
              />
            </div>
            <Button 
              onClick={handleLogin} 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Name</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Your name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                className="bg-input-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="your@email.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="bg-input-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="bg-input-background"
              />
            </div>
            <Button 
              onClick={handleSignup} 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

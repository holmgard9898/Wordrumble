import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useSfx } from '@/hooks/useSfx';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { BubbleTitle } from '@/components/BubbleTitle';
import { BackButton } from '@/components/MenuButton';

const AuthPage = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const bg = useGameBackground();
  const { playClick } = useSfx();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t.loggedIn);
        navigate('/challenge');
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: displayName || email.split('@')[0] }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success(t.accountCreated);
      }
    } catch (err: any) {
      toast.error(err.message || t.somethingWrong);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    playClick();
    const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (result.error) { toast.error(t.googleLoginFailed); return; }
    if (result.redirected) return;
    navigate('/challenge');
  };

  const handleFacebookAuth = async () => {
    playClick();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: window.location.origin + '/challenge' },
    });
    if (error) toast.error(error.message || 'Facebook-inloggning misslyckades');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      <div className="mb-6"><BubbleTitle text="Word Rumble" size="md" /></div>
      
      {/* HÄR BÖRJAR DEN NYA FROSTADE PANELEN */}
      <div className="w-full max-w-sm p-8 rounded-[2.5rem] bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col gap-5">
        
        <p className="text-white/80 text-center font-medium drop-shadow-sm">
          {isLogin ? t.loginToChallenge : t.createAccount}
        </p>

        <div className="flex flex-col gap-3">
          <Button onClick={handleGoogleAuth} size="lg" className="h-12 text-base bg-white text-gray-800 hover:bg-gray-100 gap-3 rounded-xl shadow-md">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t.continueWithGoogle}
          </Button>

          <Button onClick={handleFacebookAuth} size="lg" className="h-12 text-base bg-[#1877F2] text-white hover:bg-[#166FE5] gap-3 rounded-xl shadow-md">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs uppercase font-bold tracking-wider">{t.or}</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input type="text" placeholder={t.displayName} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10 h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:bg-slate-950/60 transition-all" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:bg-slate-950/60 transition-all" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input type="password" placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-10 h-12 bg-slate-950/40 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:bg-slate-950/60 transition-all" />
          </div>
          <Button type="submit" disabled={loading} size="lg" className="h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-xl mt-2 shadow-lg active:scale-95 transition-all">
            {loading ? t.wait : isLogin ? t.logIn : t.createAccount}
          </Button>
        </form>

        <button onClick={() => { playClick(); setIsLogin(!isLogin); }} className="text-white/60 text-sm hover:text-white transition-colors font-medium underline underline-offset-4 decoration-white/20">
          {isLogin ? t.noAccountCreate : t.haveAccountLogin}
        </button>
      </div>

      <BackButton onClick={() => { playClick(); navigate('/'); }} icon={<ArrowLeft className="w-4 h-4" />} label={t.mainMenu} className="mt-8" />
    </div>
  );
};

export default AuthPage;

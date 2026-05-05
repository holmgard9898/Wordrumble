import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, Music, Globe, Shield, LogIn, LogOut, User, Camera } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { AVAILABLE_LANGUAGES, getLanguageConfig } from '@/data/languages';
import type { GameLanguage } from '@/data/languages';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BubbleTitle } from '@/components/BubbleTitle';
import { BackButton } from '@/components/MenuButton';

const SettingsPage = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { playClick } = useSfx();
  const bg = useGameBackground();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); setDisplayName(''); return; }
    supabase.from('profiles').select('avatar_url, display_name').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) { setAvatarUrl(data.avatar_url); setDisplayName(data.display_name || ''); }
      });
  }, [user]);

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const newUrl = pub.publicUrl;
      const { error: updErr } = await supabase.from('profiles').update({ avatar_url: newUrl }).eq('user_id', user.id);
      if (updErr) throw updErr;
      setAvatarUrl(newUrl);
      toast.success(t.avatarUpdated);
    } catch (err: any) {
      toast.error(err.message || t.uploadFailed);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${bg.className}`} style={bg.style}>
      <div className="mb-8"><BubbleTitle text={t.settingsTitle} size="md" /></div>

      <div className="w-full max-w-sm space-y-6">
        {/* Account */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-3 mb-1">
            <User className="w-5 h-5 text-pink-400" />
            <span className="text-white font-semibold">{t.account}</span>
          </div>

          {user ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-white/60" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium truncate">{displayName || user.email?.split('@')[0]}</div>
                  <div className="text-white/50 text-xs truncate">{user.email}</div>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
              <Button
                onClick={() => { playClick(); fileInputRef.current?.click(); }}
                disabled={uploading}
                variant="outline"
                className="w-full gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Camera className="w-4 h-4" /> {uploading ? t.uploading : t.changeAvatar}
              </Button>
              <Button
                onClick={async () => { playClick(); await signOut(); toast.success(t.loggedOut); }}
                variant="outline"
                className="w-full gap-2 bg-white/5 border-white/20 text-white/80 hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" /> {t.logOut}
              </Button>
            </>
          ) : (
            <>
              <p className="text-white/60 text-sm">{t.notLoggedIn}</p>
              <Button
                onClick={() => { playClick(); navigate('/auth'); }}
                className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white"
              >
                <LogIn className="w-4 h-4" /> {t.logIn}
              </Button>
            </>
          )}
        </div>

        {/* Language */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-purple-400" />
            <span className="text-white font-semibold">{t.languageLabel}</span>
          </div>
          <Select
            value={settings.language}
            onValueChange={(val) => { playClick(); updateSettings({ language: val as GameLanguage }); }}
          >
            <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
              <SelectValue>
                {(() => {
                  const config = getLanguageConfig(settings.language);
                  return <span className="flex items-center gap-2"><span>{config.flag}</span><span>{config.name}</span></span>;
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_LANGUAGES.map((lang) => {
                const config = getLanguageConfig(lang);
                return (
                  <SelectItem key={lang} value={lang}>
                    <span className="flex items-center gap-2"><span>{config.flag}</span><span>{config.name}</span></span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-white/40 text-xs text-center">{t.langChangeNote}</p>
        </div>

        {/* Music */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-blue-400" />
              <span className="text-white font-semibold">{t.music}</span>
            </div>
            <Switch checked={settings.musicEnabled} onCheckedChange={(v) => updateSettings({ musicEnabled: v })} />
          </div>
          {settings.musicEnabled && (
            <Slider dir="ltr" value={[settings.musicVolume * 100]} onValueChange={([v]) => updateSettings({ musicVolume: v / 100 })} max={100} step={1} className="w-full" />
          )}
        </div>

        {/* SFX */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">{t.soundEffects}</span>
            </div>
            <Switch checked={settings.sfxEnabled} onCheckedChange={(v) => updateSettings({ sfxEnabled: v })} />
          </div>
          {settings.sfxEnabled && (
            <Slider dir="ltr" value={[settings.sfxVolume * 100]} onValueChange={([v]) => updateSettings({ sfxVolume: v / 100 })} max={100} step={1} className="w-full" />
          )}
        </div>
      </div>

      <button
        onClick={() => { playClick(); navigate('/privacy'); }}
        className="mt-6 flex items-center gap-2 text-white/50 hover:text-white/90 text-sm transition-colors"
      >
        <Shield className="w-4 h-4" /> Privacy Policy
      </button>

      <BackButton onClick={() => { playClick(); navigate('/'); }} icon={<ArrowLeft className="w-4 h-4" />} label={t.mainMenu} className="mt-4" />
    </div>
  );
};

export default SettingsPage;

/**
 * Ads abstraction layer.
 * In native (Capacitor) context → uses AdMob (install @capacitor-community/admob when building native).
 * In web/PWA context → shows a simulated ad (placeholder).
 */

type AdResult = { success: boolean; reward?: number };

function isNativeApp(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

export function useAds() {
  const showRewardedAd = async (): Promise<AdResult> => {
    if (isNativeApp()) {
      try {
        // Dynamic import — only works when @capacitor-community/admob is installed in native build
        const admob = await (Function('return import("@capacitor-community/admob")')() as Promise<any>);
        const { AdMob, RewardAdPluginEvents } = admob;

        return new Promise<AdResult>((resolve) => {
          const listener = AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
            listener.remove();
            resolve({ success: true, reward: 10 });
          });

          const failListener = AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
            failListener.remove();
            listener.remove();
            resolve({ success: false });
          });

          AdMob.showRewardVideoAd({
            adId: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
          }).catch(() => {
            listener.remove();
            failListener.remove();
            resolve({ success: false });
          });
        });
      } catch {
        return { success: false };
      }
    }

    // Web/PWA fallback: simulate a short "ad" delay
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true, reward: 10 }), 2000);
    });
  };

  const showInterstitialAd = async (): Promise<boolean> => {
    if (isNativeApp()) {
      try {
        const admob = await (Function('return import("@capacitor-community/admob")')() as Promise<any>);
        await admob.AdMob.showInterstitial({
          adId: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ',
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  return { showRewardedAd, showInterstitialAd, isNative: isNativeApp() };
}

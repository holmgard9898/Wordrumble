/**
 * Ads abstraction layer.
 * In native (Capacitor) context → uses AdMob.
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
        const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');
        
        return new Promise<AdResult>((resolve) => {
          const listener = AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
            listener.remove();
            resolve({ success: true, reward: 0.5 });
          });

          const failListener = AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
            failListener.remove();
            listener.remove();
            resolve({ success: false });
          });

          AdMob.showRewardVideoAd({
            adId: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY', // Replace with real ad unit ID
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
      setTimeout(() => {
        resolve({ success: true, reward: 0.5 });
      }, 2000);
    });
  };

  const showInterstitialAd = async (): Promise<boolean> => {
    if (isNativeApp()) {
      try {
        const { AdMob } = await import('@capacitor-community/admob');
        await AdMob.showInterstitial({
          adId: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ', // Replace with real ad unit ID
        });
        return true;
      } catch {
        return false;
      }
    }
    return false; // No web interstitials
  };

  return { showRewardedAd, showInterstitialAd, isNative: isNativeApp() };
}

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useSfx } from '@/hooks/useSfx';
import { useGameBackground } from '@/hooks/useGameBackground';
import { useMenuMusic } from '@/hooks/useMenuMusic';
import { BubbleTitle } from '@/components/BubbleTitle';
import { BackButton } from '@/components/MenuButton';

const PrivacyPage = () => {
  useMenuMusic();
  const navigate = useNavigate();
  const { playClick } = useSfx();
  const bg = useGameBackground();

  return (
    <div className={`min-h-screen flex flex-col items-center p-4 py-8 ${bg.className}`} style={bg.style}>
      <div className="mb-6"><BubbleTitle text="Privacy" size="md" /></div>

      <div className="w-full max-w-2xl rounded-2xl p-6 space-y-5 text-white/90 text-sm leading-relaxed" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <p>
          Wordrumble is a free-to-play mobile application. This Privacy Policy explains
          how information is collected and used within the app.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">1. Data Collection</h2>
          <p>We do not collect any personal information (such as your name, email, or phone number) directly.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">2. Third-Party Services (Advertising)</h2>
          <p>This app uses Google AdMob to show advertisements. To provide relevant ads and analyze performance, AdMob may collect and use certain data, including:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Advertising ID (e.g., Android Advertising ID)</li>
            <li>Device information (model, OS version)</li>
            <li>General location data (IP-based)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">3. Data Usage</h2>
          <p>The data collected by third-party services is used solely for:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Displaying advertisements within the app.</li>
            <li>Measuring ad performance and providing rewards (coins) for watched videos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">4. Consent</h2>
          <p>By using Wordrumble, you consent to the collection and use of information as outlined in this policy and by Google's Privacy Policy.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">5. Contact</h2>
          <p>If you have any questions, please contact: <a href="mailto:wordrumble.support@gmail.com" className="text-purple-300 underline">wordrumble.support@gmail.com</a></p>
        </section>
      </div>

      <BackButton onClick={() => { playClick(); navigate(-1); }} icon={<ArrowLeft className="w-4 h-4" />} label="Back" className="mt-6" />
    </div>
  );
};

export default PrivacyPage;

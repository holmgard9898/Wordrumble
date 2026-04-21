import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/contexts/SettingsContext";
import MainMenu from "./pages/MainMenu";
import SingleplayerMenu from "./pages/SingleplayerMenu";
import MultiplayerMenu from "./pages/MultiplayerMenu";
import GamePage from "./pages/GamePage";
import MultiplayerGamePage from "./pages/MultiplayerGamePage";
import SettingsPage from "./pages/SettingsPage";
import Statistics from "./pages/Statistics";
import Shop from "./pages/Shop";
import AuthPage from "./pages/AuthPage";
import PrivacyPage from "./pages/PrivacyPage";
import NotFound from "./pages/NotFound";
import AdventureMap from "./pages/AdventureMap";
import AdventureGamePage from "./pages/AdventureGamePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SettingsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/play" element={<SingleplayerMenu />} />
            <Route path="/challenge" element={<MultiplayerMenu />} />
            <Route path="/match/:matchId" element={<MultiplayerGamePage />} />
            <Route path="/game/:mode" element={<GamePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/adventure" element={<AdventureMap />} />
            <Route path="/adventure/:levelId" element={<AdventureGamePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

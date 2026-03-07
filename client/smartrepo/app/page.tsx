"use client"
import { useState } from 'react';
import { Header } from '../components/homepage/Header';
import { Hero } from '../components/homepage/Hero';
import { FeaturesSection } from '../components/homepage/FeaturesSection';
import { StatsSection } from '../components/homepage/StatsSection';
import { HowItWorks } from '../components/homepage/HowItWorks';
import { CTASection } from '../components/homepage/CTASection';
import { Footer } from '../components/homepage/Footer';
import { AuthDialog } from '../components/homepage/AuthDialog';

export default function App() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogTab, setAuthDialogTab] = useState<'login' | 'register'>('login');

  const handleLogin = () => {
    setAuthDialogTab('login');
    setAuthDialogOpen(true);
  };

  const handleRegister = () => {
    setAuthDialogTab('register');
    setAuthDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <Header onLogin={handleLogin} onRegister={handleRegister}/>
      
      <main>
        <Hero onLogin={handleLogin} onRegister={handleRegister} />
        
        <div id="features">
          <FeaturesSection />
        </div>
        
        <StatsSection />
        
        <div id="how-it-works">
          <HowItWorks />
        </div>
        
        <CTASection onLogin={handleLogin} onRegister={handleRegister} />
      </main>
      
      <Footer />
      
      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        defaultTab={authDialogTab}
      />
    </div>
  );
}
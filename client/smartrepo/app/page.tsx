"use client"
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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

  const shouldReduceMotion = useReducedMotion();
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const revealProps = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.25 },
          transition: {
            duration: 0.6,
            ease,
            delay,
          },
        };

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
        <motion.div {...revealProps(0.02)}>
          <Hero onLogin={handleLogin} onRegister={handleRegister} />
        </motion.div>
        
        <motion.div id="features" {...revealProps(0.04)}>
          <FeaturesSection />
        </motion.div>
        
        <motion.div {...revealProps(0.06)}>
          <StatsSection />
        </motion.div>
        
        <motion.div id="how-it-works" {...revealProps(0.08)}>
          <HowItWorks />
        </motion.div>
        
        <motion.div {...revealProps(0.1)}>
          <CTASection onLogin={handleLogin} onRegister={handleRegister} />
        </motion.div>
      </main>
      
      <motion.div {...revealProps(0.12)}>
        <Footer />
      </motion.div>
      
      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        defaultTab={authDialogTab}
      />
    </div>
  );
}
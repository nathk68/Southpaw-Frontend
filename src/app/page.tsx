'use client';

import React from 'react';
import { Navbar, CustomCursor, Footer, Marquee } from '@/components/LandingUI';
import { Hero, Features, UpcomingFights, CallToAction } from '@/components/LandingSections';
import { ThreeBackground } from '@/components/ThreeBackground';
import { SmoothScroll } from '@/components/SmoothScroll';

export default function Home() {
  return (
    <SmoothScroll>
      <div className="antialiased text-brand-white bg-brand-black min-h-screen selection:bg-brand-lime selection:text-black font-sans relative">
        <CustomCursor />

        {/* Background layers - z-index 0-10 */}
        <div className="fixed inset-0 z-0">
          <ThreeBackground />
          <div className="noise-overlay"></div>
        </div>

        {/* Content layers - z-index 20+ */}
        <div className="relative z-20">
          <Navbar />

          <main>
            <Hero />
            <Marquee />
            <Features />
            <UpcomingFights />
            <CallToAction />
          </main>

          <Footer />
        </div>
      </div>
    </SmoothScroll>
  );
}
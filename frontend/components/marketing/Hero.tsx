'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HERO } from './copy';

export function Hero() {
  const [isGain, setIsGain] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  // Disable animations if user prefers reduced motion
  const shouldAnimate = !prefersReducedMotion;

  return (
    <section className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            {/* Eyebrow */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={shouldAnimate ? { duration: 0.6 } : {}}
            >
              <Badge variant="secondary" className="bg-[--pp-accent]/10 text-[--pp-accent] border-[--pp-accent]/20">
                Multi-asset trade journal
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={shouldAnimate ? { opacity: 0, y: 30 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={shouldAnimate ? { duration: 0.8, delay: 0.2 } : {}}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-[--pp-text] leading-tight"
            >
              {HERO.title}
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={shouldAnimate ? { duration: 0.8, delay: 0.4 } : {}}
              className="text-xl text-[--pp-muted] leading-relaxed max-w-lg"
            >
              {HERO.subtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={shouldAnimate ? { duration: 0.8, delay: 0.6 } : {}}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/login?intent=signup">
                <Button 
                  size="lg" 
                  className="rounded-2xl bg-[--pp-accent] hover:bg-[--pp-accent]/90 text-white px-8 py-3 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg]"
                >
                  {HERO.ctaPrimary}
                </Button>
              </Link>
              <Link href="#live-demo">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-2xl border-[--pp-border] text-[--pp-text] hover:bg-[--pp-card] px-8 py-3 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg]"
                >
                  {HERO.ctaSecondary}
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right: Mock Image */}
          <motion.div
            initial={shouldAnimate ? { opacity: 0, x: 30 } : false}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
            transition={shouldAnimate ? { duration: 1, delay: 0.3 } : {}}
            className="relative"
          >
            {/* Gain/Loss Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsGain(!isGain)}
                    className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-[--pp-card] border border-[--pp-border] flex items-center justify-center text-xs font-medium transition-colors hover:bg-[--pp-bg] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg]"
                    aria-label={`Switch to ${isGain ? 'loss' : 'gain'} theme`}
                  >
                    {isGain ? '📈' : '📉'}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle gain/loss theme</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div 
              className={`relative rounded-2xl border shadow-lg overflow-hidden bg-gradient-to-br from-[--pp-card] to-[--pp-bg] p-2 transition-colors duration-500 ${
                isGain ? 'border-[#22c55e]/30' : 'border-[#ef4444]/30'
              }`}
            >
              <div className="relative rounded-xl overflow-hidden">
                <Image
                  src="/marketing/hero-mock.png"
                  alt="ProfitPad trading dashboard showing portfolio analytics, trade history, and real-time P&L tracking"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority
                />
                {/* Glass overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            </div>
            
            {/* Floating elements for visual interest */}
            {shouldAnimate && (
              <>
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute -top-4 -right-4 w-8 h-8 rounded-full opacity-80 transition-colors duration-500 ${
                    isGain ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
                  }`}
                />
                <motion.div
                  animate={{ y: [5, -5, 5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className={`absolute -bottom-4 -left-4 w-6 h-6 rounded-full opacity-80 transition-colors duration-500 ${
                    isGain ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
                  }`}
                />
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

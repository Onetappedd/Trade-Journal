'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TESTIMONIALS } from './copy';

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(nextTestimonial, 6000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused]);

  const currentTestimonial = TESTIMONIALS[currentIndex];

  return (
    <section className="py-16 bg-[--pp-card] border-y border-[--pp-border]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[--pp-text] mb-4">
            Trusted by traders worldwide
          </h2>
          <p className="text-lg text-[--pp-muted]">
            See what our users are saying about ProfitPad
          </p>
        </div>

        <div 
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          role="region"
          aria-label="Customer testimonials"
          aria-live="polite"
        >
          {/* Navigation Arrows */}
          <Button
            variant="ghost"
            size="sm"
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 bg-[--pp-bg] border border-[--pp-border] hover:bg-[--pp-card] text-[--pp-text]"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 bg-[--pp-bg] border border-[--pp-border] hover:bg-[--pp-card] text-[--pp-text]"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Testimonial Content */}
          <div className="text-center px-8">
            <div className="mb-6">
              <Quote className="w-8 h-8 text-[--pp-accent] mx-auto mb-4 opacity-60" />
            </div>
            
            <blockquote className="text-xl text-[--pp-text] leading-relaxed mb-8 max-w-3xl mx-auto">
              "{currentTestimonial.quote}"
            </blockquote>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-12 h-12 bg-[--pp-accent]/10 rounded-full flex items-center justify-center">
                <span className="text-[--pp-accent] font-semibold text-lg">
                  {currentTestimonial.author.charAt(0)}
                </span>
              </div>
              <div className="text-left">
                <div className="font-semibold text-[--pp-text]">
                  {currentTestimonial.author}
                </div>
                <div className="text-sm text-[--pp-muted]">
                  {currentTestimonial.role}
                </div>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8" role="tablist" aria-label="Testimonial navigation">
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg] ${
                  index === currentIndex 
                    ? 'bg-[--pp-accent]' 
                    : 'bg-[--pp-border] hover:bg-[--pp-muted]'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
                role="tab"
                aria-selected={index === currentIndex}
                aria-controls={`testimonial-${index}`}
              />
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="w-full bg-[--pp-border] rounded-full h-1">
            <div 
              className="bg-[--pp-accent] h-1 rounded-full transition-all duration-300 ease-linear"
              style={{ 
                width: `${((currentIndex + 1) / TESTIMONIALS.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

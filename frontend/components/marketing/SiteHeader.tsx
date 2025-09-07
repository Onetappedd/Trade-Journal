'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

const navigation = [
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Docs', href: '/docs/importing' },
];

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'backdrop-blur-sm bg-black/30 border-b border-[--pp-border]'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" aria-label="ProfitPad Home">
            <div className="text-xl font-bold text-[--pp-text]">
              ProfitPad
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[--pp-muted] hover:text-[--pp-text] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg] rounded"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-[--pp-text] hover:text-[--pp-text]">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={handleSignOut}
                  className="text-[--pp-text] hover:text-[--pp-text]"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-[--pp-text] hover:text-[--pp-text]">
                    Login
                  </Button>
                </Link>
                <Link href="/login?intent=signup">
                  <Button className="bg-[--pp-accent] hover:bg-[--pp-accent]/90 text-white">
                    Start Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[--pp-text] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg]"
                  aria-label="Open mobile menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[--pp-card] border-[--pp-border]">
                <div className="flex flex-col space-y-6 mt-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-[--pp-muted] hover:text-[--pp-text] transition-colors text-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="pt-4 border-t border-[--pp-border] space-y-4">
                    {user ? (
                      <>
                        <Link href="/dashboard">
                          <Button variant="ghost" className="w-full text-[--pp-text] hover:text-[--pp-text]">
                            <User className="h-4 w-4 mr-2" />
                            Dashboard
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          onClick={handleSignOut}
                          className="w-full text-[--pp-text] hover:text-[--pp-text]"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/login">
                          <Button variant="ghost" className="w-full text-[--pp-text] hover:text-[--pp-text]">
                            Login
                          </Button>
                        </Link>
                        <Link href="/login?intent=signup">
                          <Button className="w-full bg-[--pp-accent] hover:bg-[--pp-accent]/90 text-white">
                            Start Free
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

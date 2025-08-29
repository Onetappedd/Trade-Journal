import Link from 'next/link';

const footerLinks = {
  Product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Import Data', href: '/docs/importing' },
    { name: 'API', href: '#api' },
  ],
  Company: [
    { name: 'About', href: '#about' },
    { name: 'Blog', href: '#blog' },
    { name: 'Careers', href: '#careers' },
    { name: 'Contact', href: '#contact' },
  ],
  Resources: [
    { name: 'Documentation', href: '/docs/importing' },
    { name: 'Demo', href: '/docs/demo' },
    { name: 'Support', href: '#support' },
    { name: 'Community', href: '#community' },
  ],
  Legal: [
    { name: 'Privacy Policy', href: '/legal/privacy' },
    { name: 'Terms of Service', href: '/legal/terms' },
    { name: 'Cookie Policy', href: '#cookies' },
    { name: 'GDPR', href: '#gdpr' },
  ],
};

export function SiteFooter() {
  return (
    <footer className="bg-[--pp-card] border-t border-[--pp-border] mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-[--pp-text] uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-[--pp-muted] hover:text-[--pp-text] transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg] rounded"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="mt-12 pt-8 border-t border-[--pp-border]">
                         <div className="flex flex-col md:flex-row justify-between items-center">
                 <div className="text-[--pp-muted] text-sm">
                   © {new Date().getFullYear()} ProfitPad. All rights reserved.
                 </div>
                 <div className="flex items-center space-x-6 mt-4 md:mt-0">
                   <Link 
                     href="mailto:support@profitpad.com" 
                     className="text-[--pp-muted] hover:text-[--pp-text] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg] rounded"
                   >
                     support@profitpad.com
                   </Link>
                   <Link href="#twitter" className="text-[--pp-muted] hover:text-[--pp-text] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg] rounded">
                     Twitter
                   </Link>
                   <Link href="#github" className="text-[--pp-muted] hover:text-[--pp-text] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg] rounded">
                     GitHub
                   </Link>
                   <Link href="#discord" className="text-[--pp-muted] hover:text-[--pp-text] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg] rounded">
                     Discord
                   </Link>
                 </div>
               </div>
        </div>
      </div>
    </footer>
  );
}

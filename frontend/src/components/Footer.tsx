import { Link } from 'react-router-dom';
import { BRAND } from '@shared/brand';
import { TRUST_BADGES } from './TrustBadges';

type FooterVariant = 'auth' | 'full';

interface FooterProps {
  variant?: FooterVariant;
  className?: string;
}

export function Footer({ variant = 'auth', className = '' }: FooterProps) {
  if (variant === 'auth') {
    return (
      <footer className={`border-t border-brand-100 bg-white/80 backdrop-blur-sm ${className}`}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt={BRAND.name} className="h-8 w-8" />
              <span className="font-display font-bold text-brand-800">{BRAND.name}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
              <Link to="/about-us" className="hover:text-brand-600">About</Link>
              <Link to="/contact-us" className="hover:text-brand-600">Contact</Link>
              <Link to="/faq" className="hover:text-brand-600">FAQ</Link>
              <Link to="/privacy-policy" className="hover:text-brand-600">Privacy</Link>
              <Link to="/terms-conditions" className="hover:text-brand-600">Terms</Link>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {TRUST_BADGES.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-brand-100 bg-white px-2 py-1 text-xs font-medium text-brand-700"
                  title={b.title}
                >
                  <span>{b.icon}</span>
                  <span className="hidden sm:inline">{b.label}</span>
                </span>
              ))}
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`border-t border-brand-100 bg-white ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt={BRAND.name} className="h-9 w-9" />
              <span className="font-display text-lg font-bold text-brand-800">{BRAND.name}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{BRAND.tagline}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">For You</h4>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link to="/for-parents" className="text-gray-600 hover:text-brand-600">For Parents</Link></li>
              <li><Link to="/for-students" className="text-gray-600 hover:text-brand-600">For Students</Link></li>
              <li><Link to="/for-teachers" className="text-gray-600 hover:text-brand-600">For Teachers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Company</h4>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link to="/about-us" className="text-gray-600 hover:text-brand-600">About Us</Link></li>
              <li><Link to="/how-it-works" className="text-gray-600 hover:text-brand-600">How It Works</Link></li>
              <li><Link to="/features" className="text-gray-600 hover:text-brand-600">Features</Link></li>
              <li><Link to="/faq" className="text-gray-600 hover:text-brand-600">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Legal</h4>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link to="/privacy-policy" className="text-gray-600 hover:text-brand-600">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="text-gray-600 hover:text-brand-600">Terms & Conditions</Link></li>
              <li><Link to="/contact-us" className="text-gray-600 hover:text-brand-600">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-4 border-t border-brand-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {TRUST_BADGES.map((b) => (
              <span key={b.id} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-100 bg-brand-50/50 px-2.5 py-1 text-xs font-medium text-brand-700" title={b.title}>
                <span>{b.icon}</span>
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

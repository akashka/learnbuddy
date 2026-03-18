import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import AboutUs from '@/pages/AboutUs';
import ContactUs from '@/pages/ContactUs';
import HowItWorks from '@/pages/HowItWorks';
import Features from '@/pages/Features';
import Careers from '@/pages/Careers';
import ForYou from '@/pages/ForYou';
import OurTeam from '@/pages/OurTeam';
import NotFoundPage from '@/pages/NotFoundPage';
import { CmsPageView } from '@/components/CmsPageView';
import { ForRolePage } from '@/components/ForRolePage';
import { LegalPageView } from '@/components/LegalPageView';
import { ScrollToTop } from '@/components/ScrollToTop';
import { RouteMeta } from '@/components/RouteMeta';
import { WebsiteLayout } from '@/components/WebsiteLayout';
import { WebsiteSettingsProvider } from '@/contexts/WebsiteSettingsContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
      <ScrollToTop />
      <RouteMeta />
      <WebsiteSettingsProvider>
      <Routes>
        <Route path="/" element={<WebsiteLayout><Home /></WebsiteLayout>} />
        <Route path="/for-you" element={<WebsiteLayout><ForYou /></WebsiteLayout>} />
        <Route path="/for-parents" element={<WebsiteLayout><ForRolePage slug="for-parents" links={[{ to: '/for-you', label: 'For You' }, { to: '/for-students', label: 'For Students' }, { to: '/for-teachers', label: 'For Teachers' }, { to: '/faq', label: 'FAQ' }]} /></WebsiteLayout>} />
        <Route path="/for-students" element={<WebsiteLayout><ForRolePage slug="for-students" links={[{ to: '/for-you', label: 'For You' }, { to: '/for-parents', label: 'For Parents' }, { to: '/for-teachers', label: 'For Teachers' }, { to: '/faq', label: 'FAQ' }]} /></WebsiteLayout>} />
        <Route path="/for-teachers" element={<WebsiteLayout><ForRolePage slug="for-teachers" links={[{ to: '/for-you', label: 'For You' }, { to: '/for-parents', label: 'For Parents' }, { to: '/for-students', label: 'For Students' }, { to: '/faq', label: 'FAQ' }]} /></WebsiteLayout>} />
        <Route path="/features" element={<WebsiteLayout><Features /></WebsiteLayout>} />
        <Route path="/how-it-works" element={<WebsiteLayout><HowItWorks /></WebsiteLayout>} />
        <Route path="/about-us" element={<WebsiteLayout><AboutUs /></WebsiteLayout>} />
        <Route path="/contact-us" element={<WebsiteLayout><ContactUs /></WebsiteLayout>} />
        <Route path="/faq" element={<WebsiteLayout><CmsPageView slug="faq" links={[{ to: '/about-us', label: 'About Us' }, { to: '/contact-us', label: 'Contact Us' }]} /></WebsiteLayout>} />
        <Route path="/careers" element={<WebsiteLayout><Careers /></WebsiteLayout>} />
        <Route path="/our-team" element={<WebsiteLayout><OurTeam /></WebsiteLayout>} />
        <Route path="/privacy-policy" element={<WebsiteLayout><LegalPageView slug="privacy-policy" links={[{ to: '/terms-conditions', label: 'Terms & Conditions' }, { to: '/faq', label: 'FAQ' }]} /></WebsiteLayout>} />
        <Route path="/terms-conditions" element={<WebsiteLayout><LegalPageView slug="terms-conditions" links={[{ to: '/privacy-policy', label: 'Privacy Policy' }, { to: '/faq', label: 'FAQ' }]} /></WebsiteLayout>} />
        <Route path="*" element={<WebsiteLayout><NotFoundPage /></WebsiteLayout>} />
      </Routes>
      </WebsiteSettingsProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

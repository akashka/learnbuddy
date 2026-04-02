import { WEBSITE_PAGE_CONTENT_SEED } from './website-page-content-seed';

export const LOCALES = ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa'] as const;
export type Locale = typeof LOCALES[number];

/**
 * These are manual overrides for the seed data where we have translations available 
 * from the website's translations.ts. For anything not here, we fall back to English.
 */
export const CMS_I18N_OVERRIDES: Partial<Record<Locale, any>> = {
  hi: {
    'landing-sections': {
      howItWorks: [
        { step: 1, title: 'चुनें', desc: 'हमारे सत्यापित मार्केटप्लेस से शिक्षक चुनें', icon: '👤' },
        { step: 2, title: 'जुड़ें', desc: 'स्लॉट बुक करें और घर से लाइव कक्षा में शामिल हों', icon: '📱' },
        { step: 3, title: 'सीखें', desc: 'सुरक्षा के लिए AI निगरानी के साथ एक-से-एक', icon: '📚' },
        { step: 4, title: 'बढ़ें', desc: 'प्रगति ट्रैक करें, AI सहायता लें, परीक्षा और फीडबैक', icon: '📈' },
      ],
      benefits: [
        { icon: '🏠', title: 'घर से सीखें', desc: 'कोई आवागमन नहीं। सुरक्षित, आरामदायक सीखना।' },
        { icon: '🛡️', title: 'AI निगरानी', desc: 'हर कक्षा सुरक्षित है। AI देखता है।' },
        { icon: '🤖', title: 'कभी भी AI से पूछें', desc: '24/7 संदेह सहायता। तत्काल उत्तर।' },
        { icon: '📊', title: 'प्रगति ट्रैक करें', desc: 'अभिभावक विकास देखते हैं। रीयल-टाइम रिपोर्ट।' },
      ],
      stats: [
        { value: '10,000+', label: 'सीख रहे छात्र', raw: 10000 },
        { value: '500+', label: 'विशेषज्ञ शिक्षक', raw: 500 },
        { value: '94%', label: 'प्रदर्शन में सुधार', raw: 94 },
        { value: '4.8/5', label: 'ऐप रेटिंग', raw: 4.8 },
      ]
    }
  },
  bn: {
    'landing-sections': {
      howItWorks: [
        { step: 1, title: 'বেছে নিন', desc: 'আমাদের যাচাইকৃত মার্কেটপ্লেস থেকে শিক্ষক বেছে নিন', icon: '👤' },
        { step: 2, title: 'সংযুক্ত হন', desc: 'স্লট বুক করুন এবং বাড়ি থেকে লাইভ ক্লাসে যোগ দিন', icon: '📱' },
        { step: 3, title: 'শিখুন', desc: 'নিরাপত্তার জন্য AI পর্যবেক্ষণ সহ এক-থেকে-এক', icon: '📚' },
        { step: 4, title: 'বাড়ান', desc: 'অগ্রগতি ট্র্যাক করুন, AI সহায়তা পান, পরীক্ষা এবং ফিডব্যাক', icon: '📈' },
      ],
      benefits: [
        { icon: '🏠', title: 'বাড়ি থেকে শিখুন', desc: 'কোনো যাতায়াত নেই। নিরাপদ, আরামদায়ক শেখা।' },
        { icon: '🛡️', title: 'AI পর্যবেক্ষিত', desc: 'প্রতিটি ক্লাস নিরাপদ। AI দেখাশোনা করে।' },
        { icon: '🤖', title: 'যেকোনো সময় AI জিজ্ঞাসা করুন', desc: '২৪/৭ সন্দেহ সহায়তা। তাৎক্ষণিক উত্তর।' },
        { icon: '📊', title: 'অগ্রগতি ট্র্যাক করুন', desc: 'পিতামাতা বৃদ্ধি দেখেন। রিয়েল-টাইম রিপোর্ট।' },
      ],
      stats: [
        { value: '10,000+', label: 'শিক্ষার্থী শিখছে', raw: 10000 },
        { value: '500+', label: 'বিশেষজ্ঞ শিক্ষক', raw: 500 },
        { value: '94%', label: 'কর্মক্ষমতা উন্নতি', raw: 94 },
        { value: '4.8/5', label: 'অ্যাপ রেটিং', raw: 4.8 },
      ]
    }
  }
  // We can add more locales here as needed, but for the initial seed,
  // the remaining will fall back to English as requested.
};

export function getCmsSeedDataForLocale(locale: Locale): Record<string, any> {
  const baseSeed = JSON.parse(JSON.stringify(WEBSITE_PAGE_CONTENT_SEED));
  const overrides = CMS_I18N_OVERRIDES[locale] || {};
  
  // Apply overrides
  Object.keys(overrides).forEach(pageType => {
    if (baseSeed[pageType]) {
      baseSeed[pageType] = { ...baseSeed[pageType], ...overrides[pageType] };
    }
  });

  return baseSeed;
}

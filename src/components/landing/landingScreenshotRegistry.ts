import aiStudioScreenshot from '@/assets/screenshots/dashboard-real-marketing.png';
import ambassadorScreenshot from '@/assets/screenshots/ambassador-real-tweaked.png';
import salesScreenshot from '@/assets/screenshots/sales-real-tweaked.png';
import storefrontScreenshot from '@/assets/screenshots/storefront-real.png';

export const landingScreenshots = {
  hero: {
    src: salesScreenshot,
    chromeLabel: 'Sales dashboard',
  },
  aiStudio: {
    src: aiStudioScreenshot,
    chromeLabel: 'Viral AI Studio',
  },
  ambassador: {
    src: ambassadorScreenshot,
    chromeLabel: 'Ambassador dashboard',
  },
  storefront: {
    src: storefrontScreenshot,
    chromeLabel: 'Marketplace storefront',
  },
  sales: {
    src: salesScreenshot,
    chromeLabel: 'Sales dashboard',
  },
} as const;
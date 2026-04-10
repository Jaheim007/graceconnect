import type { CapacitorConfig } from '@capacitor/cli';

const liveReloadUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'app.lovable.fdcfbb7e0039431a853389045b2dbc70',
  appName: 'SiteViral',
  webDir: 'dist',
  ...(liveReloadUrl
    ? {
        server: {
          url: liveReloadUrl,
          cleartext: true,
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: false,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'none',
      resizeOnFullScreen: false,
    },
    Camera: {
      // iOS: Permissions are declared in Info.plist (auto-added by Capacitor)
      // Android: Permissions auto-added to AndroidManifest.xml
    },
    Browser: {
      // In-app browser for external links
    },
  },
};

export default config;

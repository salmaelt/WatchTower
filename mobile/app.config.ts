// mobile/app.config.ts
// app.config.ts
import type { ExpoConfig } from 'expo/config';

export default ({ config }: { config: ExpoConfig }) => ({
  ...config,
  name: 'WatchTower Mobile',
  slug: 'watchtower-mobile',
  scheme: 'watchtower',
  owner: 'tomcorley', // ← add this
  extra: {
    ...(config.extra ?? {}),
    API_BASE_URL: 'https://watchtower-api-backend.onrender.com/',
    eas: {
      projectId: '965e2ae0-49a2-426f-934d-0be91c6cc94b',
    },
  },
  updates: {
    url: 'https://u.expo.dev/965e2ae0-49a2-426f-934d-0be91c6cc94b',
  },
  ios: {
    ...(config.ios ?? {}),
    bundleIdentifier: 'com.yourco.watchtower',
    buildNumber: '1',
  },
  android: {
    ...(config.android ?? {}),
    package: 'com.yourco.watchtower',
    versionCode: 1,
  },
});
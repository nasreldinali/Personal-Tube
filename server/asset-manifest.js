export const assetManifest = new Map([
  ['/', ['index.html', 'text/html']],
  ...['styles.css', 'assets/tokens/deeda.css'].map(file => [`/${file}`, [file, 'text/css']]),
  ...['app.js', 'ui/setup-panel.js', 'domain/panel-actions.js', 'config.js', 'core.js', 'locale.js', 'category-labels.js', 'domain/youtube-evidence.js', 'data/youtube-analysis.js', 'domain/community-evidence.js', 'ui/community-feed.js', 'services/community-discovery.js', 'services/community-quality.js', 'domain/community-batches.js', 'domain/recommendations.js', 'domain/community.js', 'domain/discovery.js', 'services/recommendations.js', 'ui/discovery-panel.js', 'domain/errors.js', 'domain/youtube-key.js', 'domain/feed.js', 'domain/library.js', 'domain/catalog.js', 'domain/preferences.js', 'data/browser-state.js', 'data/browser-store.js', 'data/youtube.js', 'data/youtube-usage.js', 'services/refresh.js', 'services/refresh-result.js', 'ui/dom.js', 'ui/feed-view.js'].map(file => [`/${file}`, [file, 'text/javascript']]),
  ...['Inter-Regular', 'Inter-Bold', 'Montserrat-Bold', 'Montserrat-ExtraBold', 'NotoKufiArabic-Variable'].map(name => [`/assets/fonts/${name}.ttf`, [`assets/fonts/${name}.ttf`, 'font/ttf']]),
  ...['deeda-mark-96', 'deeda-mark-256', 'apple-touch-icon'].map(name => [`/assets/logo/${name}.png`, [`assets/logo/${name}.png`, 'image/png']]),
  ['/assets/logo/favicon.ico', ['assets/logo/favicon.ico', 'image/x-icon']],
]);

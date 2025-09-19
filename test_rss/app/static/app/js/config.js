/**
 * Configuration globale de l'application RSS
 */
const Config = {
  // Configuration API
  apiBase: '/api',
  
  // Pagination
  articlesPerPage: 10,
  
  // Actualisation automatique (en millisecondes)
  refreshInterval: 300000, // 5 minutes
  
  // Stockage local
  localStorageKeys: {
    favorites: 'rss-favorites',
    readArticles: 'rss-read',
    theme: 'rss-theme',
    viewPreference: 'rss-view-preference'
  },
  
  // Délais et timeouts
  debounceDelay: 300, // ms pour la recherche
  notificationDuration: 3000, // ms pour les notifications
  
  // Pagination des API
  maxArticlesPerRequest: 50,
  
  // Cache
  cacheExpiration: 3600000, // 1 heure en millisecondes
  
  // Messages
  messages: {
    loading: 'Chargement en cours...',
    noFeeds: 'Aucun flux disponible',
    noArticles: 'Aucun article trouvé',
    selectFeed: 'Sélectionnez un flux pour voir les articles',
    error: 'Une erreur est survenue',
    favoriteAdded: 'Article ajouté aux favoris !',
    favoriteRemoved: 'Article retiré des favoris',
    linkCopied: 'Lien copié dans le presse-papiers !',
    articleMarkedRead: 'Article marqué comme lu'
  },
  
  // Debug
  debug: false // Mettre à true pour les logs de debug
};

// Export pour utilisation dans d'autres modules
window.Config = Config;
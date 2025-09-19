/**
 * Service pour toutes les interactions avec l'API
 */
class ApiService {
  constructor() {
    this.baseUrl = Config.apiBase;
    this.cache = new Map();
    this.requestCache = new Map(); // Cache des requêtes en cours
  }

  /**
   * Méthode générique pour les appels API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    
    Utils.debug(`API Request: ${url}`, options);

    // Vérifier le cache pour les requêtes GET
    if (!options.method || options.method === 'GET') {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        Utils.debug(`Cache hit pour ${url}`);
        return cached;
      }
    }

    // Éviter les requêtes en double
    if (this.requestCache.has(cacheKey)) {
      Utils.debug(`Requête en cours pour ${url}, attente...`);
      return await this.requestCache.get(cacheKey);
    }

    // Créer la promesse de requête
    const requestPromise = this.executeRequest(url, options);
    this.requestCache.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Mettre en cache les requêtes GET réussies
      if ((!options.method || options.method === 'GET') && result.success) {
        this.setCache(cacheKey, result);
      }
      
      return result;
    } finally {
      this.requestCache.delete(cacheKey);
    }
  }

  /**
   * Exécute la requête HTTP
   */
  async executeRequest(url, options) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      Utils.debug(`API Response:`, data);

      return {
        success: true,
        data,
        status: response.status
      };
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        status: error.status || 500
      };
      
      Utils.debug(`API Error:`, errorResult);
      return errorResult;
    }
  }

  /**
   * Gestion du cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > Config.cacheExpiration) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache() {
    this.cache.clear();
    Utils.debug('Cache API vidé');
  }

  /**
   * Méthodes spécifiques à l'API RSS
   */

  async fetchFeeds() {
    const result = await this.request('/feeds/');
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  }

  async fetchFeedItems(feedId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/feeds/${feedId}/items/${queryString ? `?${queryString}` : ''}`;
    
    const result = await this.request(endpoint);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  }

  async fetchAllArticles(feeds, maxConcurrent = 5) {
    Utils.debug(`Récupération de tous les articles pour ${feeds.length} flux`);
    
    const allArticles = [];
    const errors = [];

    // Traitement par lots pour éviter de surcharger l'API
    for (let i = 0; i < feeds.length; i += maxConcurrent) {
      const batch = feeds.slice(i, i + maxConcurrent);
      
      const promises = batch.map(async feed => {
        try {
          const items = await this.fetchFeedItems(feed.id);
          return items.map(item => ({
            ...item,
            source: feed.title || feed.url,
            feedId: feed.id
          }));
        } catch (error) {
          errors.push({ feedId: feed.id, error: error.message });
          Utils.debug(`Erreur pour le flux ${feed.id}:`, error);
          return [];
        }
      });

      const batchResults = await Promise.all(promises);
      batchResults.forEach(articles => {
        allArticles.push(...articles);
      });
    }

    if (errors.length > 0) {
      Utils.debug(`${errors.length} flux ont échoué:`, errors);
    }

    Utils.debug(`${allArticles.length} articles récupérés au total`);
    return allArticles;
  }

  async addFeed(feedUrl) {
    const result = await this.request('/feeds/add_feed/', {
      method: 'POST',
      body: JSON.stringify({ url: feedUrl })
    });

    if (result.success) {
      this.clearCache(); // Invalider le cache après ajout
      return result.data;
    }
    throw new Error(result.error);
  }

  async refreshFeed(feedId) {
    const result = await this.request(`/feeds/${feedId}/refresh/`, {
      method: 'POST'
    });

    if (result.success) {
      // Invalider le cache pour ce flux
      const cacheKeys = [...this.cache.keys()];
      cacheKeys.forEach(key => {
        if (key.includes(`/feeds/${feedId}/`)) {
          this.cache.delete(key);
        }
      });
      
      return result.data;
    }
    throw new Error(result.error);
  }

  async searchArticles(query, params = {}) {
    const queryParams = new URLSearchParams({
      q: query,
      ...params
    });

    const result = await this.request(`/search/?${queryParams}`);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  }

  async getStats() {
    const result = await this.request('/feeds/stats/');
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  }

  async getTrendingArticles() {
    const result = await this.request('/trending/');
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  }

  /**
   * Méthodes utilitaires
   */
  isOnline() {
    return navigator.onLine;
  }

  async checkApiHealth() {
    try {
      const result = await this.request('/feeds/', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      return result.success;
    } catch {
      return false;
    }
  }

  getRequestStats() {
    return {
      cacheSize: this.cache.size,
      activeRequests: this.requestCache.size,
      cacheKeys: [...this.cache.keys()]
    };
  }
}

// Instance singleton
const apiService = new ApiService();

// Export global
window.ApiService = apiService;
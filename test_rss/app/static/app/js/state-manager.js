/**
 * Gestionnaire d'état global de l'application
 */
class StateManager {
  constructor() {
    this.state = {
      // Données
      feeds: [],
      currentFeed: null,
      allArticles: [],
      filteredArticles: [],
      
      // Interface utilisateur
      currentPage: 1,
      isCompactView: false,
      activeView: 'detailed',
      
      // États de l'application
      loading: false,
      error: null,
      
      // Filtres et recherche
      searchQuery: '',
      sortBy: 'date-desc',
      periodFilter: 'all',
      
      // Statistiques
      stats: {
        totalFeeds: 0,
        totalArticles: 0,
        favoritesCount: 0,
        readCount: 0
      }
    };
    
    this.listeners = {};
    this.history = []; // Historique des états pour debug
    
    Utils.debug('StateManager initialisé', this.state);
  }

  /**
   * Met à jour l'état global
   */
  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Ajouter à l'historique en mode debug
    if (Config.debug) {
      this.history.push({
        timestamp: new Date(),
        updates,
        prevState: prevState,
        newState: { ...this.state }
      });
    }
    
    Utils.debug('État mis à jour:', updates);
    this.notifyListeners(prevState);
  }

  /**
   * Récupère l'état actuel
   */
  getState() {
    return this.state;
  }

  /**
   * S'abonne aux changements d'une propriété d'état
   */
  subscribe(key, callback) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);
    
    Utils.debug(`Nouvel abonnement pour "${key}"`);
    
    // Retourner une fonction de désabonnement
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  }

  /**
   * Notifie tous les listeners des changements
   */
  notifyListeners(prevState) {
    Object.keys(this.listeners).forEach(key => {
      if (this.state[key] !== prevState[key]) {
        Utils.debug(`Notification pour "${key}":`, this.state[key]);
        this.listeners[key].forEach(callback => {
          try {
            callback(this.state[key], prevState[key]);
          } catch (error) {
            console.error(`Erreur dans le listener "${key}":`, error);
          }
        });
      }
    });
  }

  /**
   * Méthodes utilitaires pour gérer l'état
   */
  
  setLoading(isLoading, error = null) {
    this.setState({ loading: isLoading, error });
  }

  setError(error) {
    this.setState({ error: error, loading: false });
  }

  clearError() {
    this.setState({ error: null });
  }

  updateStats() {
    const stats = {
      totalFeeds: this.state.feeds.length,
      totalArticles: this.state.filteredArticles.length,
      favoritesCount: Utils.getFromLocalStorage(Config.localStorageKeys.favorites, []).length,
      readCount: Utils.getFromLocalStorage(Config.localStorageKeys.readArticles, []).length
    };
    
    this.setState({ stats });
  }

  /**
   * Méthodes spécifiques aux flux
   */
  setFeeds(feeds) {
    this.setState({ feeds });
    this.updateStats();
  }

  setCurrentFeed(feed) {
    this.setState({ currentFeed: feed });
  }

  setArticles(articles) {
    this.setState({ allArticles: articles });
  }

  setFilteredArticles(articles) {
    this.setState({ filteredArticles: articles });
    this.updateStats();
  }

  /**
   * Méthodes pour la pagination
   */
  setCurrentPage(page) {
    this.setState({ currentPage: page });
  }

  nextPage() {
    const totalPages = Math.ceil(this.state.filteredArticles.length / Config.articlesPerPage);
    if (this.state.currentPage < totalPages) {
      this.setState({ currentPage: this.state.currentPage + 1 });
    }
  }

  prevPage() {
    if (this.state.currentPage > 1) {
      this.setState({ currentPage: this.state.currentPage - 1 });
    }
  }

  /**
   * Méthodes pour les filtres
   */
  setSearchQuery(query) {
    this.setState({ searchQuery: query, currentPage: 1 });
  }

  setSortBy(sortBy) {
    this.setState({ sortBy: sortBy, currentPage: 1 });
  }

  setPeriodFilter(period) {
    this.setState({ periodFilter: period, currentPage: 1 });
  }

  /**
   * Méthodes pour les vues
   */
  setView(isCompact) {
    this.setState({ 
      isCompactView: isCompact,
      activeView: isCompact ? 'compact' : 'detailed'
    });
    
    // Sauvegarder la préférence
    Utils.saveToLocalStorage(Config.localStorageKeys.viewPreference, isCompact);
  }

  /**
   * Réinitialise l'état à ses valeurs par défaut
   */
  reset() {
    const defaultState = {
      feeds: [],
      currentFeed: null,
      allArticles: [],
      filteredArticles: [],
      currentPage: 1,
      isCompactView: false,
      activeView: 'detailed',
      loading: false,
      error: null,
      searchQuery: '',
      sortBy: 'date-desc',
      periodFilter: 'all',
      stats: {
        totalFeeds: 0,
        totalArticles: 0,
        favoritesCount: 0,
        readCount: 0
      }
    };
    
    this.setState(defaultState);
    Utils.debug('État réinitialisé');
  }

  /**
   * Charge les préférences utilisateur sauvegardées
   */
  loadUserPreferences() {
    const viewPreference = Utils.getFromLocalStorage(Config.localStorageKeys.viewPreference, false);
    this.setState({ 
      isCompactView: viewPreference,
      activeView: viewPreference ? 'compact' : 'detailed'
    });
  }

  /**
   * Export des données pour debug
   */
  exportState() {
    return {
      currentState: this.state,
      history: this.history,
      listeners: Object.keys(this.listeners).map(key => ({
        key,
        listenersCount: this.listeners[key].length
      }))
    };
  }
}

// Export global
window.StateManager = StateManager;
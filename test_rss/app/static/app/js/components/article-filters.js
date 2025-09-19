/**
 * Composant de filtres et recherche d'articles
 */
class ArticleFiltersComponent {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.elements = {
      articleSearch: document.getElementById('article-search'),
      sortFilter: document.getElementById('sort-filter'),
      periodFilter: document.getElementById('period-filter')
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    
    // S'abonner aux changements d'articles
    this.stateManager.subscribe('allArticles', () => {
      this.applyFilters();
    });

    // Charger les filtres sauvegardés
    this.loadSavedFilters();
    
    Utils.debug('ArticleFiltersComponent initialisé');
  }

  setupEventListeners() {
    // Recherche d'articles
    if (this.elements.articleSearch) {
      this.elements.articleSearch.addEventListener('input', Utils.debounce(() => {
        const query = this.elements.articleSearch.value;
        this.stateManager.setSearchQuery(query);
        this.applyFilters();
        this.saveFilters();
      }, Config.debounceDelay));
    }

    // Filtre de tri
    if (this.elements.sortFilter) {
      this.elements.sortFilter.addEventListener('change', () => {
        const sortBy = this.elements.sortFilter.value;
        this.stateManager.setSortBy(sortBy);
        this.applyFilters();
        this.saveFilters();
      });
    }

    // Filtre de période
    if (this.elements.periodFilter) {
      this.elements.periodFilter.addEventListener('change', () => {
        const period = this.elements.periodFilter.value;
        this.stateManager.setPeriodFilter(period);
        this.applyFilters();
        this.saveFilters();
      });
    }
  }

  applyFilters() {
    const { allArticles, searchQuery, sortBy, periodFilter } = this.stateManager.getState();
    
    if (allArticles.length === 0) {
      this.stateManager.setFilteredArticles([]);
      return;
    }

    let filtered = [...allArticles];

    // Appliquer la recherche
    filtered = this.applySearch(filtered, searchQuery);

    // Appliquer le filtre de période
    filtered = this.applyPeriodFilter(filtered, periodFilter);

    // Appliquer le tri
    filtered = this.applySorting(filtered, sortBy);

    this.stateManager.setFilteredArticles(filtered);
    
    Utils.debug(`Filtres appliqués: ${filtered.length} articles sur ${allArticles.length}`);
  }

  applySearch(articles, query) {
    if (!query || !query.trim()) return articles;
    
    const searchTerm = query.toLowerCase().trim();
    return articles.filter(article => 
      article.title.toLowerCase().includes(searchTerm) ||
      (article.description && article.description.toLowerCase().includes(searchTerm)) ||
      (article.source && article.source.toLowerCase().includes(searchTerm))
    );
  }

  applyPeriodFilter(articles, period) {
    if (period === 'all') return articles;

    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      default:
        return articles;
    }

    return articles.filter(article => {
      if (!article.published_date) return false;
      const articleDate = new Date(article.published_date);
      return articleDate >= startDate;
    });
  }

  applySorting(articles, sortBy) {
    return [...articles].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.published_date || 0) - new Date(a.published_date || 0);
        case 'date-asc':
          return new Date(a.published_date || 0) - new Date(b.published_date || 0);
        case 'title-asc':
          return a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
        case 'title-desc':
          return b.title.localeCompare(a.title, 'fr', { sensitivity: 'base' });
        default:
          return 0;
      }
    });
  }

  // Sauvegarde et chargement des filtres
  saveFilters() {
    const filters = {
      searchQuery: this.elements.articleSearch?.value || '',
      sortBy: this.elements.sortFilter?.value || 'date-desc',
      periodFilter: this.elements.periodFilter?.value || 'all'
    };
    
    Utils.saveToLocalStorage('rss-filters', filters);
  }

  loadSavedFilters() {
    const savedFilters = Utils.getFromLocalStorage('rss-filters', {});
    
    if (savedFilters.searchQuery && this.elements.articleSearch) {
      this.elements.articleSearch.value = savedFilters.searchQuery;
      this.stateManager.setSearchQuery(savedFilters.searchQuery);
    }
    
    if (savedFilters.sortBy && this.elements.sortFilter) {
      this.elements.sortFilter.value = savedFilters.sortBy;
      this.stateManager.setSortBy(savedFilters.sortBy);
    }
    
    if (savedFilters.periodFilter && this.elements.periodFilter) {
      this.elements.periodFilter.value = savedFilters.periodFilter;
      this.stateManager.setPeriodFilter(savedFilters.periodFilter);
    }
  }

  // Méthodes publiques
  clearSearch() {
    if (this.elements.articleSearch) {
      this.elements.articleSearch.value = '';
      this.stateManager.setSearchQuery('');
      this.applyFilters();
      this.saveFilters();
    }
  }

  resetFilters() {
    if (this.elements.articleSearch) {
      this.elements.articleSearch.value = '';
    }
    
    if (this.elements.sortFilter) {
      this.elements.sortFilter.value = 'date-desc';
    }
    
    if (this.elements.periodFilter) {
      this.elements.periodFilter.value = 'all';
    }
    
    this.stateManager.setState({
      searchQuery: '',
      sortBy: 'date-desc',
      periodFilter: 'all'
    });
    
    this.applyFilters();
    this.saveFilters();
  }

  getActiveFilters() {
    const { searchQuery, sortBy, periodFilter } = this.stateManager.getState();
    return {
      hasSearch: Boolean(searchQuery && searchQuery.trim()),
      hasPeriodFilter: periodFilter !== 'all',
      sortBy,
      periodFilter,
      searchQuery
    };
  }

  setSearch(query) {
    if (this.elements.articleSearch) {
      this.elements.articleSearch.value = query;
      this.stateManager.setSearchQuery(query);
      this.applyFilters();
      this.saveFilters();
    }
  }
}

window.ArticleFiltersComponent = ArticleFiltersComponent;
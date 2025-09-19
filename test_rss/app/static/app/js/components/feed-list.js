/**
 * Composant de liste des flux RSS
 */
class FeedListComponent {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.feedsList = document.getElementById('feeds-list');
    this.searchInput = document.getElementById('feed-search');
    this.originalFeeds = [];
    
    this.init();
  }

  init() {
    // S'abonner aux changements d'état
    this.stateManager.subscribe('feeds', (feeds) => {
      this.originalFeeds = feeds;
      this.renderFeeds(feeds);
    });

    this.stateManager.subscribe('loading', (loading) => {
      if (loading) {
        this.showLoading();
      }
    });

    this.stateManager.subscribe('error', (error) => {
      if (error) {
        this.showError(error);
      }
    });

    // Configurer la recherche
    this.setupSearch();
    
    Utils.debug('FeedListComponent initialisé');
  }

  setupSearch() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', Utils.debounce((e) => {
        this.filterFeeds(e.target.value);
      }, Config.debounceDelay));
    }
  }

  renderFeeds(feeds) {
    if (!this.feedsList) return;

    if (feeds.length === 0) {
      this.showEmptyState();
      return;
    }

    this.feedsList.innerHTML = '';

    // Ajouter l'option "Tous les flux"
    const allFeedsItem = this.createAllFeedsItem();
    this.feedsList.appendChild(allFeedsItem);

    // Ajouter chaque flux
    feeds.forEach(feed => {
      const feedItem = this.createFeedItem(feed);
      this.feedsList.appendChild(feedItem);
    });
  }

  createAllFeedsItem() {
    const li = document.createElement('li');
    li.className = 'feed-item';
    li.innerHTML = `
      <div class="feed-title">🌐 Tous les flux</div>
      <div class="feed-count">Voir tous les articles</div>
    `;
    
    li.onclick = () => {
      this.setActiveState(li);
      this.loadAllArticles();
    };
    
    return li;
  }

  createFeedItem(feed) {
    const li = document.createElement('li');
    li.className = 'feed-item';
    li.dataset.feedId = feed.id;
    
    li.innerHTML = `
      <div class="feed-title">${Utils.escapeHtml(feed.title || feed.url)}</div>
      <div class="feed-count">Cliquer pour charger</div>
    `;
    
    li.onclick = () => {
      this.setActiveState(li);
      this.loadFeedArticles(feed);
    };
    
    return li;
  }

  setActiveState(element) {
    // Retirer l'état actif de tous les éléments
    document.querySelectorAll('.feed-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Ajouter l'état actif à l'élément sélectionné
    element.classList.add('active');
  }

  filterFeeds(query) {
    const feeds = document.querySelectorAll('.feed-item');
    
    feeds.forEach((feed, index) => {
      // Skip "Tous les flux" (premier élément)
      if (index === 0) return;
      
      const title = feed.querySelector('.feed-title').textContent.toLowerCase();
      const matches = title.includes(query.toLowerCase());
      feed.style.display = matches ? 'block' : 'none';
    });
  }

  async loadAllArticles() {
    const { feeds } = this.stateManager.getState();
    
    this.stateManager.setLoading(true);
    this.stateManager.setCurrentFeed(null);
    
    // Mettre à jour le titre
    const titleElement = document.getElementById('articles-title');
    if (titleElement) {
      titleElement.textContent = '🌐 Tous les flux';
    }

    try {
      const articles = await ApiService.fetchAllArticles(feeds);
      this.stateManager.setArticles(articles);
      this.stateManager.setLoading(false);
      
      Utils.debug(`${articles.length} articles chargés depuis tous les flux`);
    } catch (error) {
      this.stateManager.setError(Utils.handleError(error, 'FeedList').error);
    }
  }

  async loadFeedArticles(feed) {
    this.stateManager.setLoading(true);
    this.stateManager.setCurrentFeed(feed);
    
    // Mettre à jour le titre
    const titleElement = document.getElementById('articles-title');
    if (titleElement) {
      titleElement.textContent = Utils.escapeHtml(feed.title || feed.url);
    }

    try {
      const articles = await ApiService.fetchFeedItems(feed.id);
      const articlesWithSource = articles.map(article => ({
        ...article,
        source: feed.title || feed.url,
        feedId: feed.id
      }));

      this.stateManager.setArticles(articlesWithSource);
      this.stateManager.setLoading(false);
      
      // Mettre à jour le compteur d'articles pour ce flux
      this.updateFeedItemCount(feed.id, articles.length);
      
      Utils.debug(`${articles.length} articles chargés pour le flux "${feed.title}"`);
    } catch (error) {
      this.stateManager.setError(Utils.handleError(error, 'FeedList').error);
    }
  }

  updateFeedItemCount(feedId, count) {
    const feedItem = document.querySelector(`[data-feed-id="${feedId}"]`);
    if (feedItem) {
      const countElement = feedItem.querySelector('.feed-count');
      if (countElement) {
        countElement.textContent = `${count} article${count > 1 ? 's' : ''}`;
      }
    }
  }

  showLoading() {
    if (this.feedsList) {
      this.feedsList.innerHTML = '<li class="loading-component">Chargement des flux...</li>';
    }
  }

  showError(error) {
    if (this.feedsList) {
      this.feedsList.innerHTML = `<li class="error-component">Erreur: ${Utils.escapeHtml(error)}</li>`;
    }
  }

  showEmptyState() {
    if (this.feedsList) {
      this.feedsList.innerHTML = `
        <li class="empty-state-component">
          <h3>📭 Aucun flux disponible</h3>
          <p>Ajoutez des flux via l'administration Django</p>
        </li>
      `;
    }
  }

  // Méthodes publiques
  refreshFeeds() {
    const { currentFeed } = this.stateManager.getState();
    if (currentFeed) {
      this.loadFeedArticles(currentFeed);
    } else {
      this.loadAllArticles();
    }
  }

  selectFeedById(feedId) {
    const { feeds } = this.stateManager.getState();
    const feed = feeds.find(f => f.id == feedId);
    if (feed) {
      const feedElement = document.querySelector(`[data-feed-id="${feedId}"]`);
      if (feedElement) {
        this.setActiveState(feedElement);
        this.loadFeedArticles(feed);
      }
    }
  }

  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
      this.filterFeeds('');
    }
  }
}

window.FeedListComponent = FeedListComponent;
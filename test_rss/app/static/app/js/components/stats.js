/**
 * Composant des statistiques
 */
class StatsComponent {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.elements = {
      feedsCount: document.getElementById('feeds-count'),
      articlesCount: document.getElementById('articles-count')
    };
    
    this.init();
  }

  init() {
    // S'abonner aux changements d'état
    this.stateManager.subscribe('feeds', (feeds) => {
      this.updateFeedsCount(feeds.length);
    });

    this.stateManager.subscribe('filteredArticles', (articles) => {
      this.updateArticlesCount(articles.length);
    });

    this.stateManager.subscribe('stats', (stats) => {
      this.updateAllStats(stats);
    });

    Utils.debug('StatsComponent initialisé');
  }

  updateFeedsCount(count) {
    if (this.elements.feedsCount) {
      this.animateNumber(this.elements.feedsCount, count);
    }
  }

  updateArticlesCount(count) {
    if (this.elements.articlesCount) {
      this.animateNumber(this.elements.articlesCount, count);
    }
  }

  updateAllStats(stats) {
    this.updateFeedsCount(stats.totalFeeds);
    this.updateArticlesCount(stats.totalArticles);
    
    // Mettre à jour d'autres stats si les éléments existent
    const favoritesElement = document.getElementById('favorites-count');
    if (favoritesElement) {
      this.animateNumber(favoritesElement, stats.favoritesCount);
    }

    const readElement = document.getElementById('read-count');
    if (readElement) {
      this.animateNumber(readElement, stats.readCount);
    }
  }

  animateNumber(element, targetValue, duration = 1000) {
    const startValue = parseInt(element.textContent) || 0;
    const startTime = performance.now();

    const updateValue = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Fonction d'easing (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = Math.floor(startValue + (targetValue - startValue) * easedProgress);
      element.textContent = currentValue;

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      } else {
        element.textContent = targetValue;
      }
    };

    requestAnimationFrame(updateValue);
  }

  // Méthodes publiques pour interaction externe
  refresh() {
    this.stateManager.updateStats();
  }

  getStats() {
    return this.stateManager.getState().stats;
  }
}

window.StatsComponent = StatsComponent;
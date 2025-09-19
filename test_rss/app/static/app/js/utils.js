/**
 * Utilitaires globaux
 */
const Utils = {
  /**
   * Formate une date en français
   */
  formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Tronque un texte à une longueur donnée
   */
  truncateText(text, length = 200) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  },

  /**
   * Debounce pour limiter les appels de fonction
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Vérifie si un élément est visible dans le viewport
   */
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Génère un ID unique
   */
  generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  /**
   * Sauvegarde des données dans localStorage avec gestion d'erreur
   */
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return false;
    }
  },

  /**
   * Récupère des données du localStorage
   */
  getFromLocalStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      return defaultValue;
    }
  },

  /**
   * Nettoie et valide une URL
   */
  validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Échappe les caractères HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Filtre les données selon une requête de recherche
   */
  filterBySearch(items, query, searchFields = ['title']) {
    if (!query || !query.trim()) return items;
    
    const searchTerm = query.toLowerCase().trim();
    return items.filter(item => 
      searchFields.some(field => 
        item[field] && item[field].toLowerCase().includes(searchTerm)
      )
    );
  },

  /**
   * Trie un tableau d'objets
   */
  sortItems(items, sortBy, order = 'asc') {
    return [...items].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      // Gestion des dates
      if (sortBy.includes('date') || sortBy.includes('Date')) {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }
      
      // Gestion des strings
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (order === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });
  },

  /**
   * Copie du texte dans le presse-papiers
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback pour les anciens navigateurs
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (fallbackError) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  },

  /**
   * Log de debug conditionnel
   */
  debug(...args) {
    if (Config.debug) {
      console.log('[RSS Debug]:', ...args);
    }
  },

  /**
   * Gestion des erreurs avec log
   */
  handleError(error, context = 'Application') {
    console.error(`[${context}] Erreur:`, error);
    return {
      success: false,
      error: error.message || 'Une erreur inconnue est survenue'
    };
  }
};

// Export global
window.Utils = Utils;
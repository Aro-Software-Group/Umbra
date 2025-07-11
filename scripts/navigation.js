// Umbra Browser - Navigation Management
class NavigationManager {
    constructor() {
        this.bookmarks = [];
        this.favorites = [];
        this.navigationHistory = [];
        this.maxHistorySize = 1000;
        
        this.init();
    }

    init() {
        this.loadBookmarks();
        this.loadFavorites();
        this.setupNavigationHandlers();
        console.log('Navigation Manager initialized');
    }

    setupNavigationHandlers() {
        // Handle address bar suggestions
        const addressBar = document.getElementById('address-bar');
        addressBar.addEventListener('input', (e) => {
            this.showSuggestions(e.target.value);
        });

        // Handle focus events for suggestions
        addressBar.addEventListener('focus', () => {
            this.showRecentSites();
        });

        addressBar.addEventListener('blur', () => {
            // Hide suggestions after a short delay to allow clicking
            setTimeout(() => this.hideSuggestions(), 200);
        });

        // Keyboard navigation in address bar
        addressBar.addEventListener('keydown', (e) => {
            this.handleAddressBarKeydown(e);
        });
    }

    showSuggestions(query) {
        if (!query || query.length < 2) {
            this.hideSuggestions();
            return;
        }

        const suggestions = this.generateSuggestions(query);
        this.displaySuggestions(suggestions);
    }

    generateSuggestions(query) {
        const suggestions = [];
        const lowerQuery = query.toLowerCase();

        // Search suggestions
        suggestions.push({
            type: 'search',
            text: `"${query}" を検索`,
            action: () => window.umbraBrowser.search(query),
            icon: '🔍'
        });

        // URL suggestions
        if (this.isValidUrl(query)) {
            suggestions.push({
                type: 'url',
                text: query,
                action: () => window.umbraBrowser.navigate(query),
                icon: '🌐'
            });
        }

        // Bookmark suggestions
        const bookmarkSuggestions = this.bookmarks.filter(bookmark => 
            bookmark.title.toLowerCase().includes(lowerQuery) ||
            bookmark.url.toLowerCase().includes(lowerQuery)
        ).slice(0, 3);

        bookmarkSuggestions.forEach(bookmark => {
            suggestions.push({
                type: 'bookmark',
                text: bookmark.title,
                url: bookmark.url,
                action: () => window.umbraBrowser.navigate(bookmark.url),
                icon: '⭐'
            });
        });

        // History suggestions
        const historySuggestions = this.navigationHistory.filter(item => 
            item.title.toLowerCase().includes(lowerQuery) ||
            item.url.toLowerCase().includes(lowerQuery)
        ).slice(0, 3);

        historySuggestions.forEach(item => {
            suggestions.push({
                type: 'history',
                text: item.title,
                url: item.url,
                action: () => window.umbraBrowser.navigate(item.url),
                icon: '🕒'
            });
        });

        // Popular sites suggestions
        const popularSites = [
            { title: 'Google', url: 'https://www.google.com' },
            { title: 'YouTube', url: 'https://www.youtube.com' },
            { title: 'Bing', url: 'https://www.bing.com' },
            { title: 'Wikipedia', url: 'https://www.wikipedia.org' },
            { title: 'GitHub', url: 'https://www.github.com' }
        ];

        const popularSuggestions = popularSites.filter(site => 
            site.title.toLowerCase().includes(lowerQuery) ||
            site.url.toLowerCase().includes(lowerQuery)
        ).slice(0, 2);

        popularSuggestions.forEach(site => {
            suggestions.push({
                type: 'popular',
                text: site.title,
                url: site.url,
                action: () => window.umbraBrowser.navigate(site.url),
                icon: '🌟'
            });
        });

        return suggestions.slice(0, 8); // Limit to 8 suggestions
    }

    displaySuggestions(suggestions) {
        // Remove existing suggestions
        this.hideSuggestions();

        if (suggestions.length === 0) return;

        const suggestionBox = document.createElement('div');
        suggestionBox.id = 'suggestion-box';
        suggestionBox.className = 'suggestion-box';

        suggestions.forEach((suggestion, index) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.innerHTML = `
                <span class="suggestion-icon">${suggestion.icon}</span>
                <div class="suggestion-content">
                    <div class="suggestion-text">${suggestion.text}</div>
                    ${suggestion.url ? `<div class="suggestion-url">${suggestion.url}</div>` : ''}
                </div>
            `;

            suggestionItem.addEventListener('click', () => {
                suggestion.action();
                this.hideSuggestions();
            });

            suggestionItem.addEventListener('mouseenter', () => {
                this.highlightSuggestion(index);
            });

            suggestionBox.appendChild(suggestionItem);
        });

        // Position and add the suggestion box
        const addressBarContainer = document.querySelector('.address-bar-container');
        addressBarContainer.appendChild(suggestionBox);

        // Store suggestions for keyboard navigation
        this.currentSuggestions = suggestions;
        this.selectedSuggestionIndex = -1;
    }

    hideSuggestions() {
        const suggestionBox = document.getElementById('suggestion-box');
        if (suggestionBox) {
            suggestionBox.remove();
        }
        this.currentSuggestions = [];
        this.selectedSuggestionIndex = -1;
    }

    showRecentSites() {
        if (this.navigationHistory.length === 0) return;

        const recentSites = this.navigationHistory.slice(-5).reverse();
        const suggestions = recentSites.map(site => ({
            type: 'recent',
            text: site.title,
            url: site.url,
            action: () => window.umbraBrowser.navigate(site.url),
            icon: '🕒'
        }));

        this.displaySuggestions(suggestions);
    }

    highlightSuggestion(index) {
        const suggestionItems = document.querySelectorAll('.suggestion-item');
        suggestionItems.forEach((item, i) => {
            if (i === index) {
                item.classList.add('highlighted');
            } else {
                item.classList.remove('highlighted');
            }
        });
        this.selectedSuggestionIndex = index;
    }

    handleAddressBarKeydown(e) {
        if (!this.currentSuggestions || this.currentSuggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedSuggestionIndex = Math.min(
                    this.selectedSuggestionIndex + 1,
                    this.currentSuggestions.length - 1
                );
                this.highlightSuggestion(this.selectedSuggestionIndex);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedSuggestionIndex = Math.max(
                    this.selectedSuggestionIndex - 1,
                    -1
                );
                if (this.selectedSuggestionIndex === -1) {
                    const suggestionItems = document.querySelectorAll('.suggestion-item');
                    suggestionItems.forEach(item => item.classList.remove('highlighted'));
                } else {
                    this.highlightSuggestion(this.selectedSuggestionIndex);
                }
                break;

            case 'Enter':
                if (this.selectedSuggestionIndex >= 0) {
                    e.preventDefault();
                    this.currentSuggestions[this.selectedSuggestionIndex].action();
                    this.hideSuggestions();
                }
                break;

            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }

    addToHistory(url, title) {
        if (window.umbraBrowser && window.umbraBrowser.isPrivateMode) {
            return; // Don't save history in private mode
        }

        const historyItem = {
            url,
            title: title || url,
            timestamp: Date.now(),
            visitCount: 1
        };

        // Check if URL already exists in history
        const existingIndex = this.navigationHistory.findIndex(item => item.url === url);
        if (existingIndex !== -1) {
            this.navigationHistory[existingIndex].visitCount++;
            this.navigationHistory[existingIndex].timestamp = Date.now();
        } else {
            this.navigationHistory.push(historyItem);
        }

        // Limit history size
        if (this.navigationHistory.length > this.maxHistorySize) {
            this.navigationHistory = this.navigationHistory.slice(-this.maxHistorySize);
        }

        this.saveHistory();
    }

    addBookmark(url, title) {
        const bookmark = {
            id: Date.now().toString(),
            url,
            title: title || url,
            timestamp: Date.now(),
            folder: 'default'
        };

        this.bookmarks.push(bookmark);
        this.saveBookmarks();
        return bookmark;
    }

    removeBookmark(id) {
        this.bookmarks = this.bookmarks.filter(bookmark => bookmark.id !== id);
        this.saveBookmarks();
    }

    isBookmarked(url) {
        return this.bookmarks.some(bookmark => bookmark.url === url);
    }

    getBookmarks(folder = null) {
        if (folder) {
            return this.bookmarks.filter(bookmark => bookmark.folder === folder);
        }
        return this.bookmarks;
    }

    getHistory(limit = 50) {
        return this.navigationHistory
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    clearHistory() {
        this.navigationHistory = [];
        this.saveHistory();
    }

    clearBookmarks() {
        this.bookmarks = [];
        this.saveBookmarks();
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            // Check if it's a domain-like string
            return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/.test(string);
        }
    }

    saveHistory() {
        if (window.umbraBrowser && !window.umbraBrowser.isPrivateMode) {
            try {
                localStorage.setItem('umbraHistory', JSON.stringify(this.navigationHistory));
            } catch (e) {
                console.log('Could not save history:', e);
            }
        }
    }

    loadHistory() {
        try {
            const history = localStorage.getItem('umbraHistory');
            if (history) {
                this.navigationHistory = JSON.parse(history);
            }
        } catch (e) {
            console.log('Could not load history:', e);
            this.navigationHistory = [];
        }
    }

    saveBookmarks() {
        if (window.umbraBrowser && !window.umbraBrowser.isPrivateMode) {
            try {
                localStorage.setItem('umbraBookmarks', JSON.stringify(this.bookmarks));
            } catch (e) {
                console.log('Could not save bookmarks:', e);
            }
        }
    }

    loadBookmarks() {
        try {
            const bookmarks = localStorage.getItem('umbraBookmarks');
            if (bookmarks) {
                this.bookmarks = JSON.parse(bookmarks);
            }
        } catch (e) {
            console.log('Could not load bookmarks:', e);
            this.bookmarks = [];
        }
    }

    loadFavorites() {
        // Initialize with some popular sites
        this.favorites = [
            { title: 'Google', url: 'https://www.google.com', icon: 'G' },
            { title: 'YouTube', url: 'https://www.youtube.com', icon: 'Y' },
            { title: 'Bing', url: 'https://www.bing.com', icon: 'B' },
            { title: 'Wikipedia', url: 'https://www.wikipedia.org', icon: 'W' },
            { title: 'GitHub', url: 'https://www.github.com', icon: 'G' }
        ];
    }

    exportHistory() {
        const dataStr = JSON.stringify(this.navigationHistory, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'umbra-history.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    exportBookmarks() {
        const dataStr = JSON.stringify(this.bookmarks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'umbra-bookmarks.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

// Add suggestion box styles
const suggestionStyles = `
.suggestion-box {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-top: none;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 4px 12px var(--shadow-color);
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
}

.suggestion-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid var(--border-color);
    transition: background-color 0.2s ease;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
    background: var(--button-hover-bg);
}

.suggestion-item:last-child {
    border-bottom: none;
}

.suggestion-icon {
    margin-right: 12px;
    font-size: 16px;
    width: 20px;
    text-align: center;
}

.suggestion-content {
    flex: 1;
    min-width: 0;
}

.suggestion-text {
    font-size: 14px;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.suggestion-url {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
}

.address-bar-container {
    position: relative;
}
`;

// Add styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = suggestionStyles;
document.head.appendChild(styleSheet);

// Initialize navigation manager
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});
/**
 * Umbra Browser - Browser Core
 * Handles basic browser operations and page management
 */

class Browser {
    constructor(umbra) {
        this.umbra = umbra;
        this.currentUrl = '';
        this.history = [];
        this.historyIndex = -1;
        this.canGoBack = false;
        this.canGoForward = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateNavigationButtons();
    }

    setupEventListeners() {
        // Address bar events
        const addressBar = document.getElementById('addressBar');
        const goBtn = document.getElementById('goBtn');
        const mainSearch = document.getElementById('mainSearch');
        const searchBtn = document.getElementById('searchBtn');

        if (addressBar) {
            addressBar.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.navigate(addressBar.value);
                }
            });

            addressBar.addEventListener('focus', () => {
                addressBar.select();
            });
        }

        if (goBtn) {
            goBtn.addEventListener('click', () => {
                if (addressBar) {
                    this.navigate(addressBar.value);
                }
            });
        }

        if (mainSearch) {
            mainSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.navigate(mainSearch.value);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                if (mainSearch) {
                    this.navigate(mainSearch.value);
                }
            });
        }

        // Navigation buttons
        const backBtn = document.getElementById('backBtn');
        const forwardBtn = document.getElementById('forwardBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const homeBtn = document.getElementById('homeBtn');

        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }

        if (forwardBtn) {
            forwardBtn.addEventListener('click', () => this.goForward());
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }

        if (homeBtn) {
            homeBtn.addEventListener('click', () => this.goHome());
        }

        // Quick links
        const quickLinks = document.querySelectorAll('.quick-link-card');
        quickLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = link.getAttribute('data-url');
                if (url) {
                    this.navigate(url);
                }
            });
        });

        // Retry button
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.refresh();
            });
        }

        // Listen to Umbra events
        this.umbra.on('navigate', this.handleNavigation.bind(this));
    }

    /**
     * Navigate to a URL
     */
    navigate(input) {
        if (!input || input.trim() === '') return;

        const url = this.normalizeUrl(input.trim());
        
        // Add to history
        this.addToHistory(url);
        
        // Update current URL
        this.currentUrl = url;
        
        // Update address bar
        this.updateAddressBar(url);
        
        // Update security indicator
        this.updateSecurityIndicator(url);
        
        // Let Umbra handle the actual navigation
        this.umbra.navigate(url);
    }

    /**
     * Normalize URL input
     */
    normalizeUrl(input) {
        // Check if it's already a complete URL
        if (input.startsWith('http://') || input.startsWith('https://')) {
            return input;
        }
        
        // Check if it looks like a domain
        if (input.includes('.') && !input.includes(' ') && input.indexOf('.') > 0) {
            return 'https://' + input;
        }
        
        // Treat as search query
        const searchEngine = this.umbra.settings.defaultSearchEngine;
        switch (searchEngine) {
            case 'bing':
                return `https://www.bing.com/search?q=${encodeURIComponent(input)}`;
            case 'duckduckgo':
                return `https://duckduckgo.com/?q=${encodeURIComponent(input)}`;
            default:
                return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        }
    }

    /**
     * Add URL to history
     */
    addToHistory(url) {
        // Remove forward history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Add new URL
        this.history.push(url);
        this.historyIndex = this.history.length - 1;
        
        // Limit history size
        if (this.history.length > 100) {
            this.history.shift();
            this.historyIndex--;
        }
        
        this.updateNavigationButtons();
    }

    /**
     * Go back in history
     */
    goBack() {
        if (this.canGoBack && this.historyIndex > 0) {
            this.historyIndex--;
            const url = this.history[this.historyIndex];
            this.currentUrl = url;
            this.updateAddressBar(url);
            this.updateSecurityIndicator(url);
            this.umbra.navigate(url);
            this.updateNavigationButtons();
        } else {
            this.goHome();
        }
    }

    /**
     * Go forward in history
     */
    goForward() {
        if (this.canGoForward && this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const url = this.history[this.historyIndex];
            this.currentUrl = url;
            this.updateAddressBar(url);
            this.updateSecurityIndicator(url);
            this.umbra.navigate(url);
            this.updateNavigationButtons();
        }
    }

    /**
     * Refresh current page
     */
    refresh() {
        if (this.currentUrl) {
            this.umbra.navigate(this.currentUrl);
        } else {
            this.umbra.refresh();
        }
    }

    /**
     * Go to home page
     */
    goHome() {
        this.currentUrl = '';
        this.updateAddressBar('');
        this.umbra.goHome();
        this.updateNavigationButtons();
    }

    /**
     * Update address bar
     */
    updateAddressBar(url) {
        const addressBar = document.getElementById('addressBar');
        if (addressBar) {
            addressBar.value = url;
        }
    }

    /**
     * Update security indicator
     */
    updateSecurityIndicator(url) {
        const securityIndicator = document.getElementById('securityIndicator');
        if (!securityIndicator) return;

        if (!url) {
            securityIndicator.textContent = '🔍';
            securityIndicator.className = 'security-indicator';
            securityIndicator.title = '検索またはURLを入力';
            return;
        }

        if (url.startsWith('https://')) {
            securityIndicator.textContent = '🔒';
            securityIndicator.className = 'security-indicator secure';
            securityIndicator.title = '安全な接続';
        } else if (url.startsWith('http://')) {
            securityIndicator.textContent = '⚠️';
            securityIndicator.className = 'security-indicator insecure';
            securityIndicator.title = '安全でない接続';
        } else {
            securityIndicator.textContent = 'ℹ️';
            securityIndicator.className = 'security-indicator';
            securityIndicator.title = '情報';
        }
    }

    /**
     * Update navigation buttons state
     */
    updateNavigationButtons() {
        this.canGoBack = this.historyIndex > 0;
        this.canGoForward = this.historyIndex < this.history.length - 1;

        const backBtn = document.getElementById('backBtn');
        const forwardBtn = document.getElementById('forwardBtn');

        if (backBtn) {
            backBtn.disabled = !this.canGoBack;
            backBtn.style.opacity = this.canGoBack ? '1' : '0.5';
        }

        if (forwardBtn) {
            forwardBtn.disabled = !this.canGoForward;
            forwardBtn.style.opacity = this.canGoForward ? '1' : '0.5';
        }
    }

    /**
     * Handle navigation events from Umbra
     */
    handleNavigation(data) {
        const { url } = data;
        this.currentUrl = url;
        this.updateAddressBar(url);
        this.updateSecurityIndicator(url);
    }

    /**
     * Get current URL
     */
    getCurrentUrl() {
        return this.currentUrl;
    }

    /**
     * Get navigation history
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
        this.updateNavigationButtons();
    }

    /**
     * Check if URL is valid
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Extract domain from URL
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return '';
        }
    }

    /**
     * Check if URL is secure
     */
    isSecureUrl(url) {
        return url.startsWith('https://');
    }

    /**
     * Get page title (placeholder - would need iframe communication)
     */
    getPageTitle() {
        // In a real implementation, this would communicate with the iframe
        // For now, return the domain or a default title
        if (this.currentUrl) {
            const domain = this.extractDomain(this.currentUrl);
            return domain || 'ページ';
        }
        return '新しいタブ';
    }

    /**
     * Check if current page can be bookmarked
     */
    canBookmark() {
        return this.currentUrl && this.isValidUrl(this.currentUrl);
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + L - Focus address bar
        if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
            event.preventDefault();
            const addressBar = document.getElementById('addressBar');
            if (addressBar) {
                addressBar.focus();
                addressBar.select();
            }
        }

        // Ctrl/Cmd + R - Refresh
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            this.refresh();
        }

        // Alt + Left - Go back
        if (event.altKey && event.key === 'ArrowLeft') {
            event.preventDefault();
            this.goBack();
        }

        // Alt + Right - Go forward
        if (event.altKey && event.key === 'ArrowRight') {
            event.preventDefault();
            this.goForward();
        }

        // Ctrl/Cmd + Shift + Delete - Clear history
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Delete') {
            event.preventDefault();
            this.clearHistory();
            this.umbra.notificationManager.show('履歴をクリアしました', 'success');
        }
    }

    /**
     * Initialize keyboard shortcuts
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    /**
     * Destroy browser instance
     */
    destroy() {
        // Clean up event listeners
        document.removeEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Clear references
        this.umbra = null;
        this.history = [];
    }
}

// Export for use by Umbra
window.Browser = Browser;
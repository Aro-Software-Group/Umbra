/**
 * Umbra Browser - Core System
 * Aro Software Group
 * 
 * Main browser core that manages all components and features
 */

class UmbraBrowser {
    constructor() {
        this.version = '1.0.0';
        this.isPrivacyMode = true;
        this.currentTab = null;
        this.tabs = new Map();
        this.history = [];
        this.settings = {
            theme: 'light',
            adBlockEnabled: true,
            securityEnabled: true,
            privacyMode: true,
            defaultSearchEngine: 'google'
        };
        
        // Component instances
        this.tabManager = null;
        this.privacyManager = null;
        this.securityManager = null;
        this.adBlocker = null;
        this.themeManager = null;
        this.notificationManager = null;
        this.storageManager = null;
        this.proxyManager = null;
        
        // Event handlers
        this.eventListeners = new Map();
        
        this.init();
    }

    /**
     * Initialize the browser
     */
    init() {
        console.log(`Umbra Browser v${this.version} - Initializing...`);
        
        // Load settings from storage
        this.loadSettings();
        
        // Initialize managers
        this.initializeManagers();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Apply initial theme
        this.applyTheme();
        
        // Show privacy mode indicator
        this.showPrivacyIndicator();
        
        console.log('Umbra Browser initialized successfully');
    }

    /**
     * Load settings from storage
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('umbra-settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
    }

    /**
     * Save settings to storage
     */
    saveSettings() {
        try {
            localStorage.setItem('umbra-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    /**
     * Initialize all managers
     */
    initializeManagers() {
        // Initialize in dependency order
        this.storageManager = new StorageManager(this);
        this.notificationManager = new NotificationManager();
        this.themeManager = new ThemeManager(this);
        this.privacyManager = new PrivacyManager(this);
        this.securityManager = new SecurityManager(this);
        this.adBlocker = new AdBlocker(this);
        this.proxyManager = new ProxyManager(this);
        this.tabManager = new TabManager(this);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation events
        this.on('navigate', this.handleNavigation.bind(this));
        this.on('beforeNavigate', this.handleBeforeNavigation.bind(this));
        
        // Tab events
        this.on('tabCreated', this.handleTabCreated.bind(this));
        this.on('tabClosed', this.handleTabClosed.bind(this));
        this.on('tabChanged', this.handleTabChanged.bind(this));
        
        // Privacy events
        this.on('privacyModeToggle', this.handlePrivacyModeToggle.bind(this));
        
        // Security events
        this.on('securityThreat', this.handleSecurityThreat.bind(this));
        this.on('siteBlocked', this.handleSiteBlocked.bind(this));
        
        // Theme events
        this.on('themeChanged', this.handleThemeChanged.bind(this));
        
        // Window events
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    /**
     * Event system - Add event listener
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Event system - Remove event listener
     */
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Event system - Emit event
     */
    emit(event, data = null) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Handle navigation
     */
    handleNavigation(data) {
        const { url, tabId } = data;
        console.log(`Navigating to ${url} in tab ${tabId}`);
        
        // Update address bar
        const addressBar = document.getElementById('addressBar');
        if (addressBar) {
            addressBar.value = url;
        }
    }

    /**
     * Handle before navigation
     */
    handleBeforeNavigation(data) {
        const { url, tabId } = data;
        
        // Security check
        if (this.settings.securityEnabled && this.securityManager) {
            const threat = this.securityManager.checkUrl(url);
            if (threat) {
                this.emit('securityThreat', { url, threat, tabId });
                return false;
            }
        }
        
        return true;
    }

    /**
     * Handle tab creation
     */
    handleTabCreated(tab) {
        console.log(`Tab created: ${tab.id}`);
        this.notificationManager.show('タブが作成されました', 'success');
    }

    /**
     * Handle tab closure
     */
    handleTabClosed(tab) {
        console.log(`Tab closed: ${tab.id}`);
        
        // Clear tab data if in privacy mode
        if (this.isPrivacyMode && this.privacyManager) {
            this.privacyManager.clearTabData(tab.id);
        }
    }

    /**
     * Handle tab change
     */
    handleTabChanged(tab) {
        this.currentTab = tab;
        console.log(`Active tab changed to: ${tab.id}`);
    }

    /**
     * Handle privacy mode toggle
     */
    handlePrivacyModeToggle(enabled) {
        this.isPrivacyMode = enabled;
        this.settings.privacyMode = enabled;
        this.saveSettings();
        
        if (enabled) {
            this.showPrivacyIndicator();
            this.notificationManager.show('プライバシーモードが有効になりました', 'success');
        } else {
            this.hidePrivacyIndicator();
            this.notificationManager.show('プライバシーモードが無効になりました', 'warning');
        }
    }

    /**
     * Handle security threats
     */
    handleSecurityThreat(data) {
        const { url, threat, tabId } = data;
        console.warn(`Security threat detected: ${threat.type} for ${url}`);
        
        this.notificationManager.show(
            `セキュリティ脅威を検出しました: ${threat.description}`,
            'error'
        );
        
        // Block the navigation
        this.emit('siteBlocked', { url, reason: threat.description, tabId });
    }

    /**
     * Handle site blocking
     */
    handleSiteBlocked(data) {
        const { url, reason, tabId } = data;
        console.log(`Site blocked: ${url} - ${reason}`);
        
        // Show blocked page
        this.showBlockedPage(url, reason, tabId);
    }

    /**
     * Handle theme changes
     */
    handleThemeChanged(theme) {
        this.settings.theme = theme;
        this.saveSettings();
        console.log(`Theme changed to: ${theme}`);
    }

    /**
     * Handle before window unload
     */
    handleBeforeUnload(event) {
        if (this.isPrivacyMode && this.privacyManager) {
            // Clear all privacy data
            this.privacyManager.clearAllData();
        }
        
        // Save settings
        this.saveSettings();
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Responsive adjustments if needed
        this.emit('windowResize', {
            width: window.innerWidth,
            height: window.innerHeight
        });
    }

    /**
     * Apply theme
     */
    applyTheme() {
        if (this.themeManager) {
            this.themeManager.setTheme(this.settings.theme);
        }
    }

    /**
     * Show privacy mode indicator
     */
    showPrivacyIndicator() {
        let indicator = document.querySelector('.privacy-mode-active');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'privacy-mode-active';
            indicator.innerHTML = `
                <span class="icon">🛡️</span>
                <span class="text">プライバシーモード</span>
            `;
            document.body.appendChild(indicator);
        }
    }

    /**
     * Hide privacy mode indicator
     */
    hidePrivacyIndicator() {
        const indicator = document.querySelector('.privacy-mode-active');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Show blocked page
     */
    showBlockedPage(url, reason, tabId) {
        const viewport = document.getElementById('browserViewport');
        const startPage = document.getElementById('startPage');
        const siteFrame = document.getElementById('siteFrame');
        
        if (viewport) {
            // Hide other content
            if (startPage) startPage.classList.add('hidden');
            if (siteFrame) siteFrame.classList.add('hidden');
            
            // Create blocked overlay
            let blockedOverlay = viewport.querySelector('.blocked-overlay');
            if (!blockedOverlay) {
                blockedOverlay = document.createElement('div');
                blockedOverlay.className = 'blocked-overlay';
                viewport.appendChild(blockedOverlay);
            }
            
            blockedOverlay.innerHTML = `
                <div class="blocked-icon">🚫</div>
                <h2 class="blocked-title">サイトがブロックされました</h2>
                <p class="blocked-message">
                    セキュリティ上の理由により、このサイトへのアクセスがブロックされました。<br>
                    理由: ${reason}
                </p>
                <div class="blocked-actions">
                    <button class="blocked-btn secondary" onclick="umbra.goBack()">戻る</button>
                    <button class="blocked-btn primary" onclick="umbra.goHome()">ホームに戻る</button>
                </div>
            `;
            
            blockedOverlay.classList.remove('hidden');
        }
    }

    /**
     * Navigate to URL
     */
    navigate(url) {
        if (!url) return;
        
        // Normalize URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                // Search query
                url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
            }
        }
        
        const tabId = this.currentTab ? this.currentTab.id : 1;
        
        // Emit before navigate event
        const canNavigate = this.emit('beforeNavigate', { url, tabId });
        if (canNavigate === false) return;
        
        // Show loading
        this.showLoading();
        
        // Navigate
        setTimeout(() => {
            this.loadUrl(url, tabId);
        }, 500);
    }

    /**
     * Load URL in iframe
     */
    loadUrl(url, tabId) {
        const siteFrame = document.getElementById('siteFrame');
        const startPage = document.getElementById('startPage');
        const blockedOverlay = document.querySelector('.blocked-overlay');
        
        if (siteFrame) {
            try {
                siteFrame.src = url;
                siteFrame.classList.remove('hidden');
                
                if (startPage) startPage.classList.add('hidden');
                if (blockedOverlay) blockedOverlay.classList.add('hidden');
                
                // Hide loading after delay
                setTimeout(() => {
                    this.hideLoading();
                }, 2000);
                
                // Emit navigation event
                this.emit('navigate', { url, tabId });
                
            } catch (error) {
                console.error('Failed to load URL:', error);
                this.showError('ページの読み込みに失敗しました');
            }
        }
    }

    /**
     * Show loading overlay
     */
    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Show error page
     */
    showError(message) {
        this.hideLoading();
        
        const errorPage = document.getElementById('errorPage');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorPage && errorMessage) {
            errorMessage.textContent = message;
            errorPage.classList.remove('hidden');
        }
    }

    /**
     * Go back
     */
    goBack() {
        if (this.history.length > 1) {
            this.history.pop(); // Remove current
            const previousUrl = this.history.pop(); // Get previous
            this.navigate(previousUrl);
        } else {
            this.goHome();
        }
    }

    /**
     * Go forward
     */
    goForward() {
        // Implementation for forward navigation
        console.log('Forward navigation not implemented yet');
    }

    /**
     * Go to home page
     */
    goHome() {
        const startPage = document.getElementById('startPage');
        const siteFrame = document.getElementById('siteFrame');
        const blockedOverlay = document.querySelector('.blocked-overlay');
        const addressBar = document.getElementById('addressBar');
        
        if (startPage) startPage.classList.remove('hidden');
        if (siteFrame) siteFrame.classList.add('hidden');
        if (blockedOverlay) blockedOverlay.classList.add('hidden');
        if (addressBar) addressBar.value = '';
        
        this.hideLoading();
    }

    /**
     * Refresh current page
     */
    refresh() {
        const siteFrame = document.getElementById('siteFrame');
        if (siteFrame && siteFrame.src) {
            this.showLoading();
            siteFrame.src = siteFrame.src;
            setTimeout(() => this.hideLoading(), 2000);
        }
    }

    /**
     * Get current URL
     */
    getCurrentUrl() {
        const siteFrame = document.getElementById('siteFrame');
        return siteFrame ? siteFrame.src : '';
    }

    /**
     * Get settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        
        // Apply changes
        if (newSettings.theme !== undefined) {
            this.applyTheme();
        }
        
        if (newSettings.privacyMode !== undefined) {
            this.emit('privacyModeToggle', newSettings.privacyMode);
        }
    }
}

// Global instance
window.UmbraBrowser = UmbraBrowser;
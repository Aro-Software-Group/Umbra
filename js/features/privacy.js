/**
 * Umbra Browser - Privacy Manager
 * Handles privacy protection, anonymous browsing, and data management
 */

class PrivacyManager {
    constructor(umbra) {
        this.umbra = umbra;
        this.isPrivacyMode = true;
        this.sessionData = new Map();
        this.blockedTrackers = new Set();
        this.privacySettings = {
            blockTrackers: true,
            clearOnExit: true,
            doNotTrack: true,
            blockThirdPartyCookies: true,
            clearHistory: true,
            clearCookies: true,
            clearLocalStorage: true,
            clearSessionStorage: true
        };
        
        this.init();
    }

    init() {
        this.loadPrivacySettings();
        this.setupEventListeners();
        this.enablePrivacyMode();
        this.setupDataClearingInterval();
    }

    setupEventListeners() {
        // Privacy mode toggle
        const privacyBtn = document.getElementById('privacyMode');
        if (privacyBtn) {
            privacyBtn.addEventListener('click', () => {
                this.togglePrivacyMode();
            });
        }

        // Listen to navigation events for tracking protection
        this.umbra.on('beforeNavigate', this.handleBeforeNavigation.bind(this));
        this.umbra.on('navigate', this.handleNavigation.bind(this));

        // Window events for cleanup
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        window.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    /**
     * Enable privacy mode
     */
    enablePrivacyMode() {
        this.isPrivacyMode = true;
        this.updatePrivacyUI();
        this.enableTrackingProtection();
        this.clearExistingData();
        
        console.log('Privacy mode enabled');
    }

    /**
     * Disable privacy mode
     */
    disablePrivacyMode() {
        this.isPrivacyMode = false;
        this.updatePrivacyUI();
        
        console.log('Privacy mode disabled');
    }

    /**
     * Toggle privacy mode
     */
    togglePrivacyMode() {
        if (this.isPrivacyMode) {
            this.disablePrivacyMode();
        } else {
            this.enablePrivacyMode();
        }
        
        this.umbra.emit('privacyModeToggle', this.isPrivacyMode);
    }

    /**
     * Update privacy UI indicators
     */
    updatePrivacyUI() {
        const privacyBtn = document.getElementById('privacyMode');
        if (privacyBtn) {
            if (this.isPrivacyMode) {
                privacyBtn.classList.add('active');
                privacyBtn.title = 'プライバシーモード: 有効';
            } else {
                privacyBtn.classList.remove('active');
                privacyBtn.title = 'プライバシーモード: 無効';
            }
        }
    }

    /**
     * Handle before navigation for privacy checks
     */
    handleBeforeNavigation(data) {
        const { url } = data;
        
        if (this.isPrivacyMode && this.privacySettings.blockTrackers) {
            // Check for known trackers
            if (this.isTracker(url)) {
                this.blockedTrackers.add(url);
                this.umbra.notificationManager.show(
                    'トラッカーをブロックしました',
                    'success'
                );
                return false;
            }
        }
        
        return true;
    }

    /**
     * Handle navigation for privacy tracking
     */
    handleNavigation(data) {
        const { url, tabId } = data;
        
        if (this.isPrivacyMode) {
            // Store session data temporarily
            this.sessionData.set(tabId, {
                url: url,
                timestamp: Date.now(),
                referrer: document.referrer
            });
            
            // Set Do Not Track header (conceptual - actual implementation would need server support)
            this.setDoNotTrackHeader();
        }
    }

    /**
     * Check if URL is a known tracker
     */
    isTracker(url) {
        const knownTrackers = [
            'doubleclick.net',
            'googletagmanager.com',
            'google-analytics.com',
            'facebook.com/tr',
            'twitter.com/i/adsct',
            'linkedin.com/px',
            'amazon-adsystem.com',
            'googlesyndication.com',
            'scorecardresearch.com',
            'quantserve.com',
            'outbrain.com',
            'taboola.com'
        ];
        
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            
            return knownTrackers.some(tracker => 
                hostname.includes(tracker) || hostname.endsWith(tracker)
            );
        } catch {
            return false;
        }
    }

    /**
     * Set Do Not Track header (conceptual)
     */
    setDoNotTrackHeader() {
        if (navigator.doNotTrack !== undefined) {
            // This is a browser setting, but we can indicate our preference
            console.log('Do Not Track preference set');
        }
    }

    /**
     * Enable tracking protection
     */
    enableTrackingProtection() {
        // Block tracking scripts and pixels
        this.blockTrackingScripts();
        this.blockTrackingPixels();
        this.blockSocialMediaTracking();
    }

    /**
     * Block tracking scripts
     */
    blockTrackingScripts() {
        // Monitor for tracking script injection
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'SCRIPT' && this.isTrackingScript(node)) {
                            node.remove();
                            this.blockedTrackers.add(node.src || 'inline script');
                        }
                    }
                });
            });
        });
        
        observer.observe(document, {
            childList: true,
            subtree: true
        });
        
        this.trackingScriptObserver = observer;
    }

    /**
     * Check if script is a tracking script
     */
    isTrackingScript(script) {
        if (script.src && this.isTracker(script.src)) {
            return true;
        }
        
        // Check script content for tracking patterns
        const trackingPatterns = [
            'google-analytics',
            'gtag',
            'fbq',
            '_gaq',
            'dataLayer',
            'ga.js',
            'analytics.js'
        ];
        
        const scriptContent = script.textContent || script.innerHTML;
        return trackingPatterns.some(pattern => 
            scriptContent.toLowerCase().includes(pattern)
        );
    }

    /**
     * Block tracking pixels
     */
    blockTrackingPixels() {
        // Block 1x1 tracking images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (this.isTrackingPixel(img)) {
                img.remove();
                this.blockedTrackers.add(img.src);
            }
        });
    }

    /**
     * Check if image is a tracking pixel
     */
    isTrackingPixel(img) {
        return (img.width === 1 && img.height === 1) || 
               (img.src && this.isTracker(img.src));
    }

    /**
     * Block social media tracking
     */
    blockSocialMediaTracking() {
        const socialTrackers = [
            'facebook.com/tr',
            'twitter.com/i/adsct',
            'linkedin.com/px',
            'pinterest.com/ct'
        ];
        
        // Block social media buttons and widgets
        const socialElements = document.querySelectorAll('[src*="facebook"], [src*="twitter"], [src*="linkedin"]');
        socialElements.forEach(element => {
            if (socialTrackers.some(tracker => element.src && element.src.includes(tracker))) {
                element.remove();
                this.blockedTrackers.add(element.src);
            }
        });
    }

    /**
     * Clear all privacy data
     */
    clearAllData() {
        if (this.privacySettings.clearHistory) {
            this.clearHistory();
        }
        
        if (this.privacySettings.clearCookies) {
            this.clearCookies();
        }
        
        if (this.privacySettings.clearLocalStorage) {
            this.clearLocalStorage();
        }
        
        if (this.privacySettings.clearSessionStorage) {
            this.clearSessionStorage();
        }
        
        this.clearSessionData();
        this.clearCache();
        
        console.log('All privacy data cleared');
    }

    /**
     * Clear existing data when (re)entering privacy mode.
     * This is lighter than clearAllData() and targets volatile artefacts
     * from the previous browsing session while preserving essential
     * Umbra settings where appropriate.
     */
    clearExistingData() {
        try {
            // Always purge in-memory session artefacts first
            this.clearSessionData();

            // Session/local storage
            if (this.privacySettings.clearSessionStorage) {
                this.clearSessionStorage();
            }

            // Only clear localStorage when user explicitly opted-in via settings
            if (this.privacySettings.clearLocalStorage && this.privacySettings.clearOnExit) {
                this.clearLocalStorage();
            }

            // Cookies
            if (this.privacySettings.clearCookies) {
                this.clearCookies();
            }

            // Cache (service-workers / HTTP-cache)
            this.clearCache();

            console.log('Existing data cleared for fresh privacy session');
        } catch (error) {
            console.warn('Failed to clear existing data:', error);
        }
    }

    /**
     * Clear browsing history
     */
    clearHistory() {
        // Clear Umbra's internal history
        if (this.umbra.tabManager) {
            this.umbra.tabManager.getAllTabs().forEach(tab => {
                tab.history = [];
                tab.historyIndex = -1;
            });
        }
        
        // Clear browser history (limited capability in web context)
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, null, window.location.pathname);
        }
    }

    /**
     * Clear cookies (limited in web context)
     */
    clearCookies() {
        // Get all cookies and attempt to clear them
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            // Clear cookie by setting expiry date in the past
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        });
    }

    /**
     * Clear local storage
     */
    clearLocalStorage() {
        try {
            // Preserve Umbra settings
            const umbraSettings = localStorage.getItem('umbra-settings');
            localStorage.clear();
            
            // Restore Umbra settings if privacy mode allows
            if (umbraSettings && !this.privacySettings.clearOnExit) {
                localStorage.setItem('umbra-settings', umbraSettings);
            }
        } catch (error) {
            console.warn('Could not clear localStorage:', error);
        }
    }

    /**
     * Clear session storage
     */
    clearSessionStorage() {
        try {
            sessionStorage.clear();
        } catch (error) {
            console.warn('Could not clear sessionStorage:', error);
        }
    }

    /**
     * Clear session data
     */
    clearSessionData() {
        this.sessionData.clear();
        this.blockedTrackers.clear();
    }

    /**
     * Clear tab data
     */
    clearTabData(tabId) {
        this.sessionData.delete(tabId);
    }

    /**
     * Clear cache (limited capability)
     */
    clearCache() {
        // Clear service worker cache if available
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
    }

    /**
     * Setup automatic data clearing interval
     */
    setupDataClearingInterval() {
        // Clear data every 30 minutes in privacy mode
        setInterval(() => {
            if (this.isPrivacyMode) {
                this.clearTemporaryData();
            }
        }, 30 * 60 * 1000); // 30 minutes
    }

    /**
     * Clear temporary data
     */
    clearTemporaryData() {
        // Clear old session data (older than 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        for (const [tabId, data] of this.sessionData.entries()) {
            if (data.timestamp < oneHourAgo) {
                this.sessionData.delete(tabId);
            }
        }
    }

    /**
     * Handle before window unload
     */
    handleBeforeUnload() {
        if (this.isPrivacyMode && this.privacySettings.clearOnExit) {
            this.clearAllData();
        }
    }

    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden && this.isPrivacyMode) {
            // Clear some data when browser becomes hidden
            this.clearTemporaryData();
        }
    }

    /**
     * Get privacy statistics
     */
    getPrivacyStats() {
        return {
            trackersBlocked: this.blockedTrackers.size,
            blockedTrackers: Array.from(this.blockedTrackers),
            isPrivacyMode: this.isPrivacyMode,
            sessionDataCount: this.sessionData.size,
            settings: this.privacySettings
        };
    }

    /**
     * Load privacy settings
     */
    loadPrivacySettings() {
        try {
            const saved = localStorage.getItem('umbra-privacy-settings');
            if (saved) {
                this.privacySettings = { ...this.privacySettings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Failed to load privacy settings:', error);
        }
    }

    /**
     * Save privacy settings
     */
    savePrivacySettings() {
        try {
            localStorage.setItem('umbra-privacy-settings', JSON.stringify(this.privacySettings));
        } catch (error) {
            console.warn('Failed to save privacy settings:', error);
        }
    }

    /**
     * Update privacy settings
     */
    updatePrivacySettings(newSettings) {
        this.privacySettings = { ...this.privacySettings, ...newSettings };
        this.savePrivacySettings();
    }

    /**
     * Generate privacy report
     */
    generatePrivacyReport() {
        const stats = this.getPrivacyStats();
        return {
            timestamp: new Date().toISOString(),
            mode: stats.isPrivacyMode ? 'プライバシーモード' : '通常モード',
            trackersBlocked: stats.trackersBlocked,
            topBlockedDomains: this.getTopBlockedDomains(),
            dataCleared: this.isPrivacyMode,
            protectionLevel: this.getProtectionLevel()
        };
    }

    /**
     * Get top blocked domains
     */
    getTopBlockedDomains() {
        const domains = {};
        
        this.blockedTrackers.forEach(url => {
            try {
                const domain = new URL(url).hostname;
                domains[domain] = (domains[domain] || 0) + 1;
            } catch {
                // Ignore invalid URLs
            }
        });
        
        return Object.entries(domains)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([domain, count]) => ({ domain, count }));
    }

    /**
     * Get protection level
     */
    getProtectionLevel() {
        const enabledFeatures = Object.values(this.privacySettings).filter(Boolean).length;
        const totalFeatures = Object.keys(this.privacySettings).length;
        const percentage = (enabledFeatures / totalFeatures) * 100;
        
        if (percentage >= 80) return '高';
        if (percentage >= 60) return '中';
        if (percentage >= 40) return '低';
        return '最小';
    }

    /**
     * Destroy privacy manager
     */
    destroy() {
        // Clear all data
        this.clearAllData();
        
        // Stop tracking script observer
        if (this.trackingScriptObserver) {
            this.trackingScriptObserver.disconnect();
        }
        
        // Clear references
        this.umbra = null;
        this.sessionData.clear();
        this.blockedTrackers.clear();
    }
}

// Export for use by Umbra
window.PrivacyManager = PrivacyManager;
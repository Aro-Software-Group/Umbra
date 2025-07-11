// Umbra Browser - Privacy and Security Features
class PrivacyManager {
    constructor() {
        this.trackingProtection = true;
        this.fingerprintingProtection = true;
        this.cookieBlocking = true;
        this.httpsUpgrade = true;
        this.privateMode = false;
        this.sessionData = new Map();
        
        this.init();
    }

    init() {
        this.setupPrivacyFeatures();
        this.initializePrivacySettings();
        console.log('Privacy Manager initialized');
    }

    setupPrivacyFeatures() {
        // Intercept and filter network requests (limited in browser environment)
        this.setupRequestFiltering();
        
        // Set up privacy headers and settings
        this.setupPrivacyHeaders();
        
        // Initialize session management
        this.setupSessionManagement();
        
        // Set up automatic cleanup
        this.setupAutoCleanup();
    }

    initializePrivacySettings() {
        // Load privacy settings from storage (if not in private mode)
        if (!this.privateMode) {
            this.loadPrivacySettings();
        }
        
        // Update privacy status display
        this.updatePrivacyStatus();
    }

    setupRequestFiltering() {
        // In a real browser extension, this would use webRequest API
        // For now, we implement what we can in the browser environment
        
        // Monitor iframe loads and apply filtering
        this.monitorFrameLoads();
        
        // Block tracking scripts and pixels
        this.blockTrackingContent();
    }

    monitorFrameLoads() {
        // Observer for iframe creation
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'IFRAME') {
                        this.filterIframe(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    filterIframe(iframe) {
        const originalSrc = iframe.src;
        
        if (this.isTrackingUrl(originalSrc)) {
            console.log('Blocked tracking iframe:', originalSrc);
            iframe.src = 'about:blank';
            this.logBlockedRequest('tracking', originalSrc);
            return;
        }

        if (!originalSrc.startsWith('https://') && this.httpsUpgrade) {
            const httpsUrl = originalSrc.replace('http://', 'https://');
            iframe.src = httpsUrl;
            console.log('Upgraded to HTTPS:', httpsUrl);
        }

        // Add privacy sandbox attributes
        this.addPrivacySandbox(iframe);
    }

    addPrivacySandbox(iframe) {
        // Restrict iframe capabilities for privacy
        const sandboxRules = [
            'allow-scripts',
            'allow-same-origin',
            'allow-forms'
        ];

        // Remove potentially privacy-invasive permissions
        if (!iframe.sandbox || iframe.sandbox.value.includes('allow-popups')) {
            iframe.sandbox = sandboxRules.join(' ');
        }
    }

    blockTrackingContent() {
        // Block common tracking scripts and pixels
        const trackingSelectors = [
            'script[src*="google-analytics"]',
            'script[src*="googletagmanager"]',
            'script[src*="facebook.net"]',
            'script[src*="doubleclick"]',
            'img[src*="google-analytics"]',
            'img[width="1"][height="1"]' // Tracking pixels
        ];

        setInterval(() => {
            trackingSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.remove();
                    this.logBlockedRequest('tracking', element.src || element.textContent);
                });
            });
        }, 1000);
    }

    isTrackingUrl(url) {
        if (!url) return false;
        
        const trackingDomains = [
            'google-analytics.com',
            'googletagmanager.com',
            'doubleclick.net',
            'facebook.com/tr',
            'amazon-adsystem.com',
            'googlesyndication.com',
            'googleadservices.com',
            'adsystem.amazon.com'
        ];

        return trackingDomains.some(domain => url.includes(domain));
    }

    setupPrivacyHeaders() {
        // In a browser extension, this would set request headers
        // Here we document what headers would be set
        this.privacyHeaders = {
            'DNT': '1', // Do Not Track
            'Sec-GPC': '1', // Global Privacy Control
            'X-Requested-With': 'UmbraBrowser'
        };
    }

    setupSessionManagement() {
        if (this.privateMode) {
            // Clear existing session data
            this.clearAllSessionData();
            
            // Set up automatic cleanup on page unload
            window.addEventListener('beforeunload', () => {
                this.clearAllSessionData();
            });
        }

        // Monitor and manage session storage
        this.monitorSessionStorage();
    }

    monitorSessionStorage() {
        // Override sessionStorage methods to track and control data
        const originalSetItem = sessionStorage.setItem;
        const originalRemoveItem = sessionStorage.removeItem;
        const originalClear = sessionStorage.clear;

        sessionStorage.setItem = (key, value) => {
            if (this.privateMode) {
                this.sessionData.set(key, value);
                console.log('Private mode: Storing session data in memory only');
                return;
            }
            return originalSetItem.call(sessionStorage, key, value);
        };

        sessionStorage.getItem = (key) => {
            if (this.privateMode) {
                return this.sessionData.get(key) || null;
            }
            return sessionStorage.getItem(key);
        };

        sessionStorage.removeItem = (key) => {
            if (this.privateMode) {
                this.sessionData.delete(key);
                return;
            }
            return originalRemoveItem.call(sessionStorage, key);
        };

        sessionStorage.clear = () => {
            if (this.privateMode) {
                this.sessionData.clear();
                return;
            }
            return originalClear.call(sessionStorage);
        };
    }

    setupAutoCleanup() {
        // Clean up privacy data every 5 minutes
        setInterval(() => {
            this.performPrivacyCleanup();
        }, 5 * 60 * 1000);

        // Clean up on tab close/page unload
        window.addEventListener('beforeunload', () => {
            if (this.privateMode) {
                this.performPrivacyCleanup();
            }
        });
    }

    performPrivacyCleanup() {
        if (this.privateMode) {
            // Clear temporary data
            this.sessionData.clear();
            
            // Clear service worker caches if possible
            this.clearServiceWorkerCaches();
            
            // Clear IndexedDB data
            this.clearIndexedDBData();
        }

        // Always clean up tracking data
        this.removeTrackingCookies();
        this.clearTrackingStorage();
    }

    clearAllSessionData() {
        try {
            // Clear session storage
            sessionStorage.clear();
            
            // Clear our private session data
            this.sessionData.clear();
            
            // Clear any cached data
            this.clearCachedData();
            
            console.log('All session data cleared');
        } catch (e) {
            console.log('Could not clear all session data:', e);
        }
    }

    clearServiceWorkerCaches() {
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        return caches.delete(cacheName);
                    })
                );
            }).then(() => {
                console.log('Service worker caches cleared');
            }).catch(e => {
                console.log('Could not clear service worker caches:', e);
            });
        }
    }

    clearIndexedDBData() {
        if ('indexedDB' in window) {
            // This is a simplified approach - real implementation would be more thorough
            try {
                indexedDB.deleteDatabase('UmbraPrivateData');
                console.log('IndexedDB data cleared');
            } catch (e) {
                console.log('Could not clear IndexedDB data:', e);
            }
        }
    }

    removeTrackingCookies() {
        // Note: Due to browser security restrictions, we can only clear cookies for our domain
        // In a real browser extension, this would have broader access
        try {
            document.cookie.split(";").forEach(cookie => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            });
            console.log('Tracking cookies cleared');
        } catch (e) {
            console.log('Could not clear cookies:', e);
        }
    }

    clearTrackingStorage() {
        // Clear localStorage items that look like tracking data
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (this.isTrackingStorageKey(key)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            if (keysToRemove.length > 0) {
                console.log('Tracking storage cleared:', keysToRemove);
            }
        } catch (e) {
            console.log('Could not clear tracking storage:', e);
        }
    }

    isTrackingStorageKey(key) {
        const trackingKeyPatterns = [
            /_ga/,
            /_gid/,
            /_fbp/,
            /_fbc/,
            /analytics/,
            /tracking/,
            /advertisement/
        ];

        return trackingKeyPatterns.some(pattern => pattern.test(key));
    }

    clearCachedData() {
        // Clear any cached data specific to Umbra browser
        try {
            localStorage.removeItem('umbraCache');
            sessionStorage.removeItem('umbraCache');
            console.log('Cached data cleared');
        } catch (e) {
            console.log('Could not clear cached data:', e);
        }
    }

    enablePrivateMode() {
        this.privateMode = true;
        this.clearAllSessionData();
        this.updatePrivacyStatus();
        
        // Visual indicator
        document.body.classList.add('privacy-mode-active');
        
        // Update status
        this.updatePrivacyIndicator('プライベートモード: 有効');
        
        console.log('Private mode enabled');
    }

    disablePrivateMode() {
        this.privateMode = false;
        document.body.classList.remove('privacy-mode-active');
        this.updatePrivacyIndicator('プライベートモード: 無効');
        console.log('Private mode disabled');
    }

    toggleTrackingProtection() {
        this.trackingProtection = !this.trackingProtection;
        this.savePrivacySettings();
        this.updatePrivacyStatus();
        
        const status = this.trackingProtection ? '有効' : '無効';
        this.updateTrackingIndicator(`追跡防止: ${status}`);
        
        console.log('Tracking protection:', status);
    }

    toggleFingerprintingProtection() {
        this.fingerprintingProtection = !this.fingerprintingProtection;
        this.savePrivacySettings();
        
        if (this.fingerprintingProtection) {
            this.enableFingerprintingProtection();
        } else {
            this.disableFingerprintingProtection();
        }
    }

    enableFingerprintingProtection() {
        // Spoof common fingerprinting methods
        this.spoofUserAgent();
        this.spoofScreen();
        this.spoofTimezone();
        this.spoofLanguages();
        
        console.log('Fingerprinting protection enabled');
    }

    disableFingerprintingProtection() {
        // Note: Once spoofed, some fingerprinting data cannot be restored
        console.log('Fingerprinting protection disabled');
    }

    spoofUserAgent() {
        // Override navigator.userAgent (limited effectiveness in modern browsers)
        try {
            Object.defineProperty(navigator, 'userAgent', {
                get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 UmbraBrowser/1.0',
                configurable: true
            });
        } catch (e) {
            console.log('Could not spoof user agent:', e);
        }
    }

    spoofScreen() {
        // Spoof screen dimensions
        try {
            Object.defineProperty(screen, 'width', { get: () => 1920 });
            Object.defineProperty(screen, 'height', { get: () => 1080 });
        } catch (e) {
            console.log('Could not spoof screen dimensions:', e);
        }
    }

    spoofTimezone() {
        // Spoof timezone (limited effectiveness)
        try {
            const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
            Date.prototype.getTimezoneOffset = function() {
                return 0; // UTC
            };
        } catch (e) {
            console.log('Could not spoof timezone:', e);
        }
    }

    spoofLanguages() {
        // Spoof languages
        try {
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
                configurable: true
            });
        } catch (e) {
            console.log('Could not spoof languages:', e);
        }
    }

    logBlockedRequest(type, url) {
        const blockedRequests = JSON.parse(localStorage.getItem('umbraBlockedRequests') || '[]');
        blockedRequests.push({
            type,
            url,
            timestamp: Date.now()
        });
        
        // Keep only last 100 blocked requests
        if (blockedRequests.length > 100) {
            blockedRequests.splice(0, blockedRequests.length - 100);
        }
        
        if (!this.privateMode) {
            localStorage.setItem('umbraBlockedRequests', JSON.stringify(blockedRequests));
        }
    }

    getBlockedRequestsStats() {
        const blockedRequests = JSON.parse(localStorage.getItem('umbraBlockedRequests') || '[]');
        const stats = {
            total: blockedRequests.length,
            tracking: blockedRequests.filter(r => r.type === 'tracking').length,
            ads: blockedRequests.filter(r => r.type === 'ads').length,
            malware: blockedRequests.filter(r => r.type === 'malware').length
        };
        return stats;
    }

    updatePrivacyStatus() {
        // Update various privacy status indicators
        this.updatePrivacyIndicator(
            this.privateMode ? 'プライベートモード: 有効' : 'プライベートモード: 無効'
        );
        
        this.updateTrackingIndicator(
            this.trackingProtection ? '追跡防止: 有効' : '追跡防止: 無効'
        );
    }

    updatePrivacyIndicator(text) {
        const indicators = document.querySelectorAll('.privacy-status .status-item');
        indicators.forEach(indicator => {
            if (indicator.textContent.includes('プライベートモード')) {
                indicator.querySelector('.status-text').textContent = text;
            }
        });
    }

    updateTrackingIndicator(text) {
        const indicators = document.querySelectorAll('.privacy-status .status-item');
        indicators.forEach(indicator => {
            if (indicator.textContent.includes('追跡防止')) {
                indicator.querySelector('.status-text').textContent = text;
            }
        });
    }

    savePrivacySettings() {
        if (!this.privateMode) {
            try {
                const settings = {
                    trackingProtection: this.trackingProtection,
                    fingerprintingProtection: this.fingerprintingProtection,
                    cookieBlocking: this.cookieBlocking,
                    httpsUpgrade: this.httpsUpgrade
                };
                localStorage.setItem('umbraPrivacySettings', JSON.stringify(settings));
            } catch (e) {
                console.log('Could not save privacy settings:', e);
            }
        }
    }

    loadPrivacySettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('umbraPrivacySettings'));
            if (settings) {
                this.trackingProtection = settings.trackingProtection !== false;
                this.fingerprintingProtection = settings.fingerprintingProtection !== false;
                this.cookieBlocking = settings.cookieBlocking !== false;
                this.httpsUpgrade = settings.httpsUpgrade !== false;
            }
        } catch (e) {
            console.log('Could not load privacy settings:', e);
        }
    }

    exportPrivacyData() {
        const data = {
            settings: {
                trackingProtection: this.trackingProtection,
                fingerprintingProtection: this.fingerprintingProtection,
                cookieBlocking: this.cookieBlocking,
                httpsUpgrade: this.httpsUpgrade
            },
            blockedRequests: this.getBlockedRequestsStats()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'umbra-privacy-data.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

// Initialize privacy manager
document.addEventListener('DOMContentLoaded', () => {
    window.privacyManager = new PrivacyManager();
});
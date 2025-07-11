// Umbra Browser - Core Browser Functionality
class UmbraBrowser {
    constructor() {
        this.currentTheme = 'light-theme';
        this.isPrivateMode = false;
        this.adBlockerEnabled = true;
        this.trackingProtection = true;
        this.currentUrl = '';
        this.history = [];
        this.historyIndex = -1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.updateStatus();
        console.log('Umbra Browser initialized');
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => this.toggleTheme());

        // Privacy mode toggle
        const privacyMode = document.getElementById('privacy-mode');
        privacyMode.addEventListener('click', () => this.togglePrivacyMode());

        // Ad blocker toggle
        const adBlocker = document.getElementById('ad-blocker');
        adBlocker.addEventListener('click', () => this.toggleAdBlocker());

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        settingsBtn.addEventListener('click', () => this.openSettings());

        // Address bar
        const addressBar = document.getElementById('address-bar');
        addressBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigate(addressBar.value);
            }
        });

        // Go button
        const goBtn = document.getElementById('go-btn');
        goBtn.addEventListener('click', () => {
            const addressBar = document.getElementById('address-bar');
            this.navigate(addressBar.value);
        });

        // Navigation buttons
        document.getElementById('back-btn').addEventListener('click', () => this.goBack());
        document.getElementById('forward-btn').addEventListener('click', () => this.goForward());
        document.getElementById('refresh-btn').addEventListener('click', () => this.refresh());
        document.getElementById('home-btn').addEventListener('click', () => this.goHome());

        // Home search
        const homeSearch = document.getElementById('home-search');
        homeSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.search(homeSearch.value);
            }
        });

        // Search engines
        const searchEngines = document.querySelectorAll('.search-engine');
        searchEngines.forEach(engine => {
            engine.addEventListener('click', () => {
                const query = document.getElementById('home-search').value;
                if (query) {
                    this.searchWithEngine(query, engine.dataset.engine);
                }
            });
        });

        // Quick links
        const quickLinks = document.querySelectorAll('.quick-link');
        quickLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(link.dataset.url);
            });
        });
    }

    toggleTheme() {
        const body = document.body;
        const themeToggle = document.getElementById('theme-toggle');
        
        if (this.currentTheme === 'light-theme') {
            this.currentTheme = 'dark-theme';
            themeToggle.textContent = '☀️';
            themeToggle.title = 'ライトモード';
        } else {
            this.currentTheme = 'light-theme';
            themeToggle.textContent = '🌙';
            themeToggle.title = 'ダークモード';
        }
        
        body.className = this.currentTheme + (this.isPrivateMode ? ' privacy-mode-active' : '');
        this.saveSettings();
    }

    togglePrivacyMode() {
        this.isPrivateMode = !this.isPrivateMode;
        const privacyBtn = document.getElementById('privacy-mode');
        const body = document.body;
        
        if (this.isPrivateMode) {
            privacyBtn.classList.add('active');
            body.classList.add('privacy-mode-active');
            this.clearSessionData();
            this.updatePrivacyStatus('プライベートモード: 有効');
        } else {
            privacyBtn.classList.remove('active');
            body.classList.remove('privacy-mode-active');
            this.updatePrivacyStatus('プライベートモード: 無効');
        }
        
        this.updateStatus();
    }

    toggleAdBlocker() {
        this.adBlockerEnabled = !this.adBlockerEnabled;
        const adBlockerBtn = document.getElementById('ad-blocker');
        
        if (this.adBlockerEnabled) {
            adBlockerBtn.classList.add('active');
            this.updateAdBlockStatus('広告ブロック: 有効');
        } else {
            adBlockerBtn.classList.remove('active');
            this.updateAdBlockStatus('広告ブロック: 無効');
        }
        
        this.saveSettings();
    }

    navigate(url) {
        if (!url) return;
        
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                // Treat as search query
                this.search(url);
                return;
            }
        }

        this.currentUrl = url;
        this.addToHistory(url);
        this.loadUrl(url);
        this.updateAddressBar(url);
        this.updateNavigationButtons();
    }

    search(query) {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        this.navigate(searchUrl);
    }

    searchWithEngine(query, engine) {
        let searchUrl;
        switch (engine) {
            case 'google':
                searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                break;
            case 'bing':
                searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
                break;
            case 'duckduckgo':
                searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
                break;
            default:
                searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
        this.navigate(searchUrl);
    }

    loadUrl(url) {
        const startPage = document.getElementById('start-page');
        const webView = document.getElementById('web-view');
        const contentFrame = document.getElementById('content-frame');
        
        startPage.style.display = 'none';
        webView.style.display = 'block';
        
        // Add loading indicator
        webView.classList.add('loading');
        this.updatePageStatus('読み込み中...');
        
        // Security check before loading
        if (this.isSecureUrl(url)) {
            contentFrame.src = url;
            
            contentFrame.onload = () => {
                webView.classList.remove('loading');
                this.updatePageStatus('完了');
                this.updateSecurityStatus(url);
            };
            
            contentFrame.onerror = () => {
                webView.classList.remove('loading');
                this.updatePageStatus('エラー: ページを読み込めませんでした');
            };
        } else {
            webView.classList.remove('loading');
            this.showSecurityWarning(url);
        }
    }

    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const url = this.history[this.historyIndex];
            this.currentUrl = url;
            this.loadUrl(url);
            this.updateAddressBar(url);
            this.updateNavigationButtons();
        }
    }

    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const url = this.history[this.historyIndex];
            this.currentUrl = url;
            this.loadUrl(url);
            this.updateAddressBar(url);
            this.updateNavigationButtons();
        }
    }

    refresh() {
        if (this.currentUrl) {
            this.loadUrl(this.currentUrl);
        }
    }

    goHome() {
        const startPage = document.getElementById('start-page');
        const webView = document.getElementById('web-view');
        
        startPage.style.display = 'block';
        webView.style.display = 'none';
        
        this.currentUrl = '';
        this.updateAddressBar('');
        this.updatePageStatus('準備完了');
        this.updateNavigationButtons();
    }

    addToHistory(url) {
        if (!this.isPrivateMode) {
            // Remove any forward history when navigating to a new page
            this.history = this.history.slice(0, this.historyIndex + 1);
            this.history.push(url);
            this.historyIndex = this.history.length - 1;
        }
    }

    updateAddressBar(url) {
        const addressBar = document.getElementById('address-bar');
        addressBar.value = url;
    }

    updateNavigationButtons() {
        const backBtn = document.getElementById('back-btn');
        const forwardBtn = document.getElementById('forward-btn');
        
        backBtn.disabled = this.historyIndex <= 0;
        forwardBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    updatePageStatus(status) {
        const pageStatus = document.getElementById('page-status');
        pageStatus.textContent = status;
    }

    updateSecurityStatus(url) {
        const securityStatus = document.getElementById('security-status');
        const securityIndicator = document.getElementById('security-indicator');
        
        if (url && url.startsWith('https://')) {
            securityStatus.textContent = 'セキュア';
            securityIndicator.textContent = '🔒';
            securityIndicator.className = 'security-indicator status-secure';
        } else if (url && url.startsWith('http://')) {
            securityStatus.textContent = '非セキュア';
            securityIndicator.textContent = '⚠️';
            securityIndicator.className = 'security-indicator status-warning';
        } else {
            securityStatus.textContent = 'セキュア';
            securityIndicator.textContent = '🔒';
            securityIndicator.className = 'security-indicator status-secure';
        }
    }

    updatePrivacyStatus(status) {
        const privacyStatusElements = document.querySelectorAll('.privacy-status .status-item');
        privacyStatusElements.forEach(item => {
            if (item.textContent.includes('プライベートモード')) {
                item.querySelector('.status-text').textContent = status;
            }
        });
    }

    updateAdBlockStatus(status) {
        const privacyStatusElements = document.querySelectorAll('.privacy-status .status-item');
        privacyStatusElements.forEach(item => {
            if (item.textContent.includes('広告ブロック')) {
                item.querySelector('.status-text').textContent = status;
            }
        });
    }

    updateStatus() {
        this.updateSecurityStatus(this.currentUrl);
        this.updatePageStatus(this.currentUrl ? '準備完了' : '準備完了');
        
        const privacyStatus = document.getElementById('privacy-status');
        privacyStatus.textContent = this.isPrivateMode ? 'プライベート' : '標準';
    }

    isSecureUrl(url) {
        // Basic security check - in a real implementation, this would be more comprehensive
        const dangerousPatterns = [
            /malware/i,
            /virus/i,
            /phishing/i,
            /suspicious/i
        ];
        
        return !dangerousPatterns.some(pattern => pattern.test(url));
    }

    showSecurityWarning(url) {
        const webView = document.getElementById('web-view');
        webView.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--text-color);">
                <h2 style="color: #d33b13; margin-bottom: 20px;">⚠️ セキュリティ警告</h2>
                <p style="margin-bottom: 20px;">このサイトは安全でない可能性があります:</p>
                <code style="background: var(--input-bg); padding: 8px; border-radius: 4px;">${url}</code>
                <div style="margin-top: 30px;">
                    <button onclick="window.umbraBrowser.goHome()" style="background: var(--accent-color); color: white; border: none; padding: 10px 20px; border-radius: 4px; margin: 0 10px; cursor: pointer;">安全なページに戻る</button>
                    <button onclick="window.umbraBrowser.proceedAnyway('${url}')" style="background: #d33b13; color: white; border: none; padding: 10px 20px; border-radius: 4px; margin: 0 10px; cursor: pointer;">リスクを承知で続行</button>
                </div>
            </div>
        `;
        this.updatePageStatus('セキュリティ警告');
    }

    proceedAnyway(url) {
        const webView = document.getElementById('web-view');
        const contentFrame = document.createElement('iframe');
        contentFrame.id = 'content-frame';
        contentFrame.src = url;
        contentFrame.style.width = '100%';
        contentFrame.style.height = '100%';
        contentFrame.style.border = 'none';
        contentFrame.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation';
        
        webView.innerHTML = '';
        webView.appendChild(contentFrame);
        
        this.updatePageStatus('警告を無視して読み込み完了');
        this.updateSecurityStatus(url);
    }

    clearSessionData() {
        // Clear session storage, cookies, etc. in private mode
        try {
            sessionStorage.clear();
            // Note: We can't clear all cookies due to browser security restrictions
            console.log('Session data cleared for private mode');
        } catch (e) {
            console.log('Could not clear some session data:', e);
        }
    }

    saveSettings() {
        if (!this.isPrivateMode) {
            const settings = {
                theme: this.currentTheme,
                adBlockerEnabled: this.adBlockerEnabled,
                trackingProtection: this.trackingProtection
            };
            localStorage.setItem('umbraSettings', JSON.stringify(settings));
        }
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('umbraSettings'));
            if (settings) {
                this.currentTheme = settings.theme || 'light-theme';
                this.adBlockerEnabled = settings.adBlockerEnabled !== false;
                this.trackingProtection = settings.trackingProtection !== false;
                
                // Apply loaded settings
                document.body.className = this.currentTheme;
                const themeToggle = document.getElementById('theme-toggle');
                themeToggle.textContent = this.currentTheme === 'dark-theme' ? '☀️' : '🌙';
                
                const adBlockerBtn = document.getElementById('ad-blocker');
                if (this.adBlockerEnabled) {
                    adBlockerBtn.classList.add('active');
                }
            }
        } catch (e) {
            console.log('Could not load settings:', e);
        }
    }

    openSettings() {
        // This would open a settings modal/page in a full implementation
        alert('設定機能は開発中です。テーマ切替、プライベートモード、広告ブロック機能をお試しください。');
    }
}

// Initialize the browser when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.umbraBrowser = new UmbraBrowser();
});
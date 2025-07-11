// Umbra Browser - Tab Management
class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.nextTabId = 1;
        this.maxTabs = 20;
        
        this.init();
    }

    init() {
        this.setupTabHandlers();
        this.createDefaultTab();
        console.log('Tab Manager initialized');
    }

    setupTabHandlers() {
        // New tab button
        const newTabBtn = document.getElementById('new-tab-btn');
        newTabBtn.addEventListener('click', () => this.createNewTab());

        // Tab container click delegation
        const tabsContainer = document.getElementById('tabs-container');
        tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            const closeBtn = e.target.closest('.tab-close');
            
            if (closeBtn && tab) {
                e.stopPropagation();
                this.closeTab(tab.dataset.tabId);
            } else if (tab) {
                this.switchToTab(tab.dataset.tabId);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 't':
                        e.preventDefault();
                        this.createNewTab();
                        break;
                    case 'w':
                        e.preventDefault();
                        this.closeCurrentTab();
                        break;
                    case 'Tab':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.switchToPreviousTab();
                        } else {
                            this.switchToNextTab();
                        }
                        break;
                }
                
                // Number keys (1-9) for tab switching
                const num = parseInt(e.key);
                if (num >= 1 && num <= 9) {
                    e.preventDefault();
                    this.switchToTabByIndex(num - 1);
                }
            }
        });

        // Middle click for new tab
        document.addEventListener('auxclick', (e) => {
            if (e.button === 1) { // Middle mouse button
                const link = e.target.closest('a[href], .quick-link');
                if (link) {
                    e.preventDefault();
                    const url = link.href || link.dataset.url;
                    if (url) {
                        this.createNewTab(url);
                    }
                }
            }
        });
    }

    createDefaultTab() {
        const tabData = {
            id: this.nextTabId++,
            title: '新しいタブ',
            url: '',
            isLoading: false,
            history: [],
            historyIndex: -1,
            isActive: true
        };

        this.tabs.push(tabData);
        this.activeTabId = tabData.id;
        this.renderTab(tabData);
        this.createTabContent(tabData);
    }

    createNewTab(url = '') {
        if (this.tabs.length >= this.maxTabs) {
            this.showTabLimitWarning();
            return null;
        }

        const tabData = {
            id: this.nextTabId++,
            title: url ? this.extractDomain(url) : '新しいタブ',
            url: url,
            isLoading: false,
            history: [],
            historyIndex: -1,
            isActive: false
        };

        this.tabs.push(tabData);
        this.renderTab(tabData);
        this.createTabContent(tabData);
        this.switchToTab(tabData.id);

        // Navigate to URL if provided
        if (url) {
            this.navigateTab(tabData.id, url);
        }

        return tabData;
    }

    closeTab(tabId) {
        const tabIndex = this.tabs.findIndex(tab => tab.id == tabId);
        if (tabIndex === -1) return;

        // Don't close the last tab
        if (this.tabs.length <= 1) {
            this.createNewTab();
        }

        const tab = this.tabs[tabIndex];
        const wasActive = tab.id == this.activeTabId;

        // Remove tab from array
        this.tabs.splice(tabIndex, 1);

        // Remove tab from DOM
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.remove();
        }

        // Remove tab content
        const contentElement = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
        if (contentElement) {
            contentElement.remove();
        }

        // Switch to another tab if this was active
        if (wasActive && this.tabs.length > 0) {
            const newActiveIndex = Math.min(tabIndex, this.tabs.length - 1);
            this.switchToTab(this.tabs[newActiveIndex].id);
        }
    }

    closeCurrentTab() {
        if (this.activeTabId) {
            this.closeTab(this.activeTabId);
        }
    }

    switchToTab(tabId) {
        // Deactivate current tab
        if (this.activeTabId) {
            const currentTab = this.getTab(this.activeTabId);
            if (currentTab) {
                currentTab.isActive = false;
                this.updateTabVisual(currentTab);
                this.hideTabContent(this.activeTabId);
            }
        }

        // Activate new tab
        const newTab = this.getTab(tabId);
        if (newTab) {
            newTab.isActive = true;
            this.activeTabId = tabId;
            this.updateTabVisual(newTab);
            this.showTabContent(tabId);
            this.updateBrowserState(newTab);
        }
    }

    switchToNextTab() {
        const currentIndex = this.tabs.findIndex(tab => tab.id == this.activeTabId);
        const nextIndex = (currentIndex + 1) % this.tabs.length;
        this.switchToTab(this.tabs[nextIndex].id);
    }

    switchToPreviousTab() {
        const currentIndex = this.tabs.findIndex(tab => tab.id == this.activeTabId);
        const prevIndex = currentIndex === 0 ? this.tabs.length - 1 : currentIndex - 1;
        this.switchToTab(this.tabs[prevIndex].id);
    }

    switchToTabByIndex(index) {
        if (index >= 0 && index < this.tabs.length) {
            this.switchToTab(this.tabs[index].id);
        }
    }

    renderTab(tabData) {
        const tabsContainer = document.getElementById('tabs-container');
        
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.dataset.tabId = tabData.id;
        
        this.updateTabContent(tabElement, tabData);
        
        tabsContainer.appendChild(tabElement);
    }

    updateTabContent(tabElement, tabData) {
        const loadingIndicator = tabData.isLoading ? '<span class="loading-indicator">⟳</span>' : '';
        
        tabElement.innerHTML = `
            ${loadingIndicator}
            <span class="tab-title">${this.escapeHtml(tabData.title)}</span>
            <button class="tab-close" title="タブを閉じる">×</button>
        `;
        
        tabElement.className = `tab ${tabData.isActive ? 'active' : ''}`;
    }

    updateTabVisual(tabData) {
        const tabElement = document.querySelector(`[data-tab-id="${tabData.id}"]`);
        if (tabElement) {
            this.updateTabContent(tabElement, tabData);
        }
    }

    createTabContent(tabData) {
        const contentArea = document.querySelector('.content-area');
        
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        tabContent.dataset.tabId = tabData.id;
        
        if (tabData.url) {
            // Create web view for URL
            tabContent.innerHTML = `
                <div class="web-view">
                    <iframe src="" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"></iframe>
                </div>
            `;
        } else {
            // Create start page
            tabContent.innerHTML = this.getStartPageHTML();
        }
        
        contentArea.appendChild(tabContent);
    }

    showTabContent(tabId) {
        const contentElement = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
        if (contentElement) {
            contentElement.classList.add('active');
        }
    }

    hideTabContent(tabId) {
        const contentElement = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
        if (contentElement) {
            contentElement.classList.remove('active');
        }
    }

    navigateTab(tabId, url) {
        const tab = this.getTab(tabId);
        if (!tab) return;

        tab.url = url;
        tab.title = this.extractDomain(url);
        tab.isLoading = true;

        // Add to tab history
        this.addToTabHistory(tab, url);

        // Update tab visual
        this.updateTabVisual(tab);

        // Update content
        const contentElement = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
        if (contentElement) {
            this.loadUrlInTab(contentElement, url, tab);
        }
    }

    loadUrlInTab(contentElement, url, tabData) {
        // Create or update web view
        let webView = contentElement.querySelector('.web-view');
        if (!webView) {
            contentElement.innerHTML = `
                <div class="web-view">
                    <iframe src="" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"></iframe>
                </div>
            `;
            webView = contentElement.querySelector('.web-view');
        }

        const iframe = webView.querySelector('iframe');
        
        // Add loading state
        webView.classList.add('loading');

        iframe.onload = () => {
            tabData.isLoading = false;
            webView.classList.remove('loading');
            this.updateTabVisual(tabData);
            
            // Try to get page title
            try {
                const frameDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (frameDoc.title) {
                    tabData.title = frameDoc.title;
                    this.updateTabVisual(tabData);
                }
            } catch (e) {
                // Cross-origin restrictions prevent title access
                console.log('Cannot access iframe title due to CORS');
            }
        };

        iframe.onerror = () => {
            tabData.isLoading = false;
            tabData.title = 'エラー: ページを読み込めませんでした';
            webView.classList.remove('loading');
            this.updateTabVisual(tabData);
        };

        iframe.src = url;
    }

    addToTabHistory(tab, url) {
        // Remove any forward history
        tab.history = tab.history.slice(0, tab.historyIndex + 1);
        tab.history.push(url);
        tab.historyIndex = tab.history.length - 1;
    }

    goBackInTab(tabId) {
        const tab = this.getTab(tabId);
        if (!tab || tab.historyIndex <= 0) return false;

        tab.historyIndex--;
        const url = tab.history[tab.historyIndex];
        this.loadTabUrl(tabId, url, false);
        return true;
    }

    goForwardInTab(tabId) {
        const tab = this.getTab(tabId);
        if (!tab || tab.historyIndex >= tab.history.length - 1) return false;

        tab.historyIndex++;
        const url = tab.history[tab.historyIndex];
        this.loadTabUrl(tabId, url, false);
        return true;
    }

    loadTabUrl(tabId, url, addToHistory = true) {
        const tab = this.getTab(tabId);
        if (!tab) return;

        tab.url = url;
        tab.title = this.extractDomain(url);
        tab.isLoading = true;

        if (addToHistory) {
            this.addToTabHistory(tab, url);
        }

        this.updateTabVisual(tab);

        const contentElement = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
        if (contentElement) {
            this.loadUrlInTab(contentElement, url, tab);
        }
    }

    refreshTab(tabId) {
        const tab = this.getTab(tabId);
        if (!tab || !tab.url) return;

        this.loadTabUrl(tabId, tab.url, false);
    }

    getTab(tabId) {
        return this.tabs.find(tab => tab.id == tabId);
    }

    getActiveTab() {
        return this.getTab(this.activeTabId);
    }

    updateBrowserState(tab) {
        // Update address bar
        const addressBar = document.getElementById('address-bar');
        addressBar.value = tab.url || '';

        // Update navigation buttons
        const backBtn = document.getElementById('back-btn');
        const forwardBtn = document.getElementById('forward-btn');
        
        backBtn.disabled = !tab.history || tab.historyIndex <= 0;
        forwardBtn.disabled = !tab.history || tab.historyIndex >= tab.history.length - 1;

        // Update page status
        const pageStatus = document.getElementById('page-status');
        if (tab.isLoading) {
            pageStatus.textContent = '読み込み中...';
        } else if (tab.url) {
            pageStatus.textContent = '完了';
        } else {
            pageStatus.textContent = '準備完了';
        }
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (e) {
            return url.length > 30 ? url.substring(0, 30) + '...' : url;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getStartPageHTML() {
        return `
            <div class="start-page" id="start-page">
                <div class="start-page-header">
                    <h1>Umbra Browser</h1>
                    <p>プライバシーとセキュリティを重視したブラウザ</p>
                </div>
                
                <div class="search-section">
                    <input type="text" class="home-search" placeholder="ウェブを検索またはURLを入力...">
                    <div class="search-engines">
                        <button class="search-engine" data-engine="google">Google</button>
                        <button class="search-engine" data-engine="bing">Bing</button>
                        <button class="search-engine" data-engine="duckduckgo">DuckDuckGo</button>
                    </div>
                </div>
                
                <div class="quick-access">
                    <h3>クイックアクセス</h3>
                    <div class="quick-links">
                        <a href="#" class="quick-link" data-url="https://www.google.com">
                            <div class="quick-link-icon">G</div>
                            <span>Google</span>
                        </a>
                        <a href="#" class="quick-link" data-url="https://www.youtube.com">
                            <div class="quick-link-icon">Y</div>
                            <span>YouTube</span>
                        </a>
                        <a href="#" class="quick-link" data-url="https://www.bing.com">
                            <div class="quick-link-icon">B</div>
                            <span>Bing</span>
                        </a>
                    </div>
                </div>
                
                <div class="privacy-status">
                    <div class="status-item">
                        <span class="status-icon">🛡️</span>
                        <span class="status-text">広告ブロック: 有効</span>
                    </div>
                    <div class="status-item">
                        <span class="status-icon">🔒</span>
                        <span class="status-text">プライベートモード: 無効</span>
                    </div>
                    <div class="status-item">
                        <span class="status-icon">🚫</span>
                        <span class="status-text">追跡防止: 有効</span>
                    </div>
                </div>
            </div>
        `;
    }

    showTabLimitWarning() {
        const notification = document.createElement('div');
        notification.className = 'tab-limit-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span>タブの上限に達しました (最大 ${this.maxTabs} タブ)</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    // Tab state management for session restore
    saveTabState() {
        if (window.umbraBrowser && !window.umbraBrowser.isPrivateMode) {
            try {
                const tabState = {
                    tabs: this.tabs.map(tab => ({
                        id: tab.id,
                        title: tab.title,
                        url: tab.url,
                        isActive: tab.isActive
                    })),
                    activeTabId: this.activeTabId,
                    nextTabId: this.nextTabId
                };
                localStorage.setItem('umbraTabState', JSON.stringify(tabState));
            } catch (e) {
                console.log('Could not save tab state:', e);
            }
        }
    }

    restoreTabState() {
        try {
            const tabState = localStorage.getItem('umbraTabState');
            if (tabState) {
                const state = JSON.parse(tabState);
                // This would restore tabs in a full implementation
                console.log('Tab state available for restore:', state);
            }
        } catch (e) {
            console.log('Could not restore tab state:', e);
        }
    }
}

// Add tab notification styles
const tabStyles = `
.loading-indicator {
    animation: spin 1s linear infinite;
    margin-right: 8px;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.tab-limit-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--accent-color);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px var(--shadow-color);
    z-index: 10000;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.notification-content button {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0;
    font-size: 16px;
}
`;

// Add styles to document
const tabStyleSheet = document.createElement('style');
tabStyleSheet.textContent = tabStyles;
document.head.appendChild(tabStyleSheet);

// Initialize tab manager
document.addEventListener('DOMContentLoaded', () => {
    window.tabManager = new TabManager();
});
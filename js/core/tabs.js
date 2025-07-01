/**
 * Umbra Browser - Tab Manager
 * Handles tab creation, switching, and management
 */

class TabManager {
    constructor(umbra) {
        this.umbra = umbra;
        this.tabs = new Map();
        this.activeTabId = null;
        this.nextTabId = 1;
        this.maxTabs = 20; // Limit for performance
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createInitialTab();
    }

    setupEventListeners() {
        // New tab button
        const newTabBtn = document.getElementById('newTabBtn');
        if (newTabBtn) {
            newTabBtn.addEventListener('click', () => {
                this.createTab();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    /**
     * Create a new tab
     */
    createTab(url = null, title = '新しいタブ') {
        if (this.tabs.size >= this.maxTabs) {
            this.umbra.notificationManager.show(
                `最大${this.maxTabs}個までのタブを開くことができます`,
                'warning'
            );
            return null;
        }

        const tabId = this.nextTabId++;
        const tab = {
            id: tabId,
            title: title,
            url: url,
            favicon: null,
            isActive: false,
            isLoading: false,
            history: [],
            historyIndex: -1,
            createdAt: Date.now()
        };

        this.tabs.set(tabId, tab);
        this.createTabElement(tab);
        this.switchToTab(tabId);

        // Emit event
        this.umbra.emit('tabCreated', tab);

        return tab;
    }

    /**
     * Create tab DOM element
     */
    createTabElement(tab) {
        const tabContainer = document.getElementById('tabContainer');
        if (!tabContainer) return;

        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.setAttribute('data-tab-id', tab.id);
        
        tabElement.innerHTML = `
            <span class="tab-title">${this.escapeHtml(tab.title)}</span>
            <button class="tab-close" title="タブを閉じる">×</button>
        `;

        // Tab click handler
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchToTab(tab.id);
            }
        });

        // Close button handler
        const closeBtn = tabElement.querySelector('.tab-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });

        // Insert before the new tab button
        const newTabBtn = document.getElementById('newTabBtn');
        if (newTabBtn) {
            tabContainer.insertBefore(tabElement, newTabBtn);
        } else {
            tabContainer.appendChild(tabElement);
        }
    }

    /**
     * Switch to a specific tab
     */
    switchToTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        // Deactivate current tab
        if (this.activeTabId) {
            const currentTab = this.tabs.get(this.activeTabId);
            if (currentTab) {
                currentTab.isActive = false;
                this.updateTabElement(currentTab);
            }
        }

        // Activate new tab
        tab.isActive = true;
        this.activeTabId = tabId;
        this.updateTabElement(tab);

        // Update browser state
        this.umbra.currentTab = tab;

        // Update tab title in browser
        this.updatePageTitle(tab.title);

        // Emit event
        this.umbra.emit('tabChanged', tab);

        // If tab has a URL, navigate to it
        if (tab.url) {
            this.umbra.navigate(tab.url);
        } else {
            this.umbra.goHome();
        }
    }

    /**
     * Close a tab
     */
    closeTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        // Don't close if it's the only tab
        if (this.tabs.size === 1) {
            // Instead of closing, navigate to home
            this.updateTab(tabId, { title: '新しいタブ', url: null });
            this.umbra.goHome();
            return;
        }

        // Remove tab element
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.remove();
        }

        // If closing active tab, switch to another tab
        if (this.activeTabId === tabId) {
            const tabIds = Array.from(this.tabs.keys());
            const currentIndex = tabIds.indexOf(tabId);
            
            // Try to switch to the next tab, or previous if it's the last tab
            let newActiveTabId;
            if (currentIndex < tabIds.length - 1) {
                newActiveTabId = tabIds[currentIndex + 1];
            } else if (currentIndex > 0) {
                newActiveTabId = tabIds[currentIndex - 1];
            }

            if (newActiveTabId) {
                this.switchToTab(newActiveTabId);
            }
        }

        // Emit event before removing
        this.umbra.emit('tabClosed', tab);

        // Remove from tabs map
        this.tabs.delete(tabId);
    }

    /**
     * Update tab information
     */
    updateTab(tabId, updates) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        Object.assign(tab, updates);
        this.updateTabElement(tab);

        // If it's the active tab, update page title
        if (tab.isActive && updates.title) {
            this.updatePageTitle(updates.title);
        }
    }

    /**
     * Update tab DOM element
     */
    updateTabElement(tab) {
        const tabElement = document.querySelector(`[data-tab-id="${tab.id}"]`);
        if (!tabElement) return;

        // Update active state
        if (tab.isActive) {
            tabElement.classList.add('active');
        } else {
            tabElement.classList.remove('active');
        }

        // Update loading state
        if (tab.isLoading) {
            tabElement.classList.add('loading');
        } else {
            tabElement.classList.remove('loading');
        }

        // Update title
        const titleElement = tabElement.querySelector('.tab-title');
        if (titleElement) {
            titleElement.textContent = tab.title;
            titleElement.title = tab.title; // Full title on hover
        }

        // Update favicon (if implemented)
        if (tab.favicon) {
            // Implementation for favicon display
        }
    }

    /**
     * Update page title
     */
    updatePageTitle(title) {
        document.title = `${title} - Umbra Browser`;
    }

    /**
     * Get active tab
     */
    getActiveTab() {
        return this.tabs.get(this.activeTabId);
    }

    /**
     * Get all tabs
     */
    getAllTabs() {
        return Array.from(this.tabs.values());
    }

    /**
     * Get tab by ID
     */
    getTab(tabId) {
        return this.tabs.get(tabId);
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + T - New tab
        if ((event.ctrlKey || event.metaKey) && event.key === 't') {
            event.preventDefault();
            this.createTab();
        }

        // Ctrl/Cmd + W - Close tab
        if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
            event.preventDefault();
            if (this.activeTabId) {
                this.closeTab(this.activeTabId);
            }
        }

        // Ctrl/Cmd + Tab - Next tab
        if ((event.ctrlKey || event.metaKey) && event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();
            this.switchToNextTab();
        }

        // Ctrl/Cmd + Shift + Tab - Previous tab
        if ((event.ctrlKey || event.metaKey) && event.key === 'Tab' && event.shiftKey) {
            event.preventDefault();
            this.switchToPreviousTab();
        }

        // Ctrl/Cmd + 1-9 - Switch to specific tab
        if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '9') {
            event.preventDefault();
            const tabIndex = parseInt(event.key) - 1;
            const tabIds = Array.from(this.tabs.keys());
            if (tabIds[tabIndex]) {
                this.switchToTab(tabIds[tabIndex]);
            }
        }
    }

    /**
     * Switch to next tab
     */
    switchToNextTab() {
        const tabIds = Array.from(this.tabs.keys());
        const currentIndex = tabIds.indexOf(this.activeTabId);
        const nextIndex = (currentIndex + 1) % tabIds.length;
        this.switchToTab(tabIds[nextIndex]);
    }

    /**
     * Switch to previous tab
     */
    switchToPreviousTab() {
        const tabIds = Array.from(this.tabs.keys());
        const currentIndex = tabIds.indexOf(this.activeTabId);
        const prevIndex = currentIndex === 0 ? tabIds.length - 1 : currentIndex - 1;
        this.switchToTab(tabIds[prevIndex]);
    }

    /**
     * Close all tabs except active
     */
    closeOtherTabs() {
        const activeTab = this.getActiveTab();
        if (!activeTab) return;

        const tabsToClose = Array.from(this.tabs.keys()).filter(id => id !== activeTab.id);
        tabsToClose.forEach(tabId => this.closeTab(tabId));

        this.umbra.notificationManager.show('他のタブを閉じました', 'success');
    }

    /**
     * Close all tabs
     */
    closeAllTabs() {
        const tabIds = Array.from(this.tabs.keys());
        tabIds.forEach(tabId => this.closeTab(tabId));
    }

    /**
     * Duplicate current tab
     */
    duplicateTab(tabId = this.activeTabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        const newTab = this.createTab(tab.url, tab.title);
        return newTab;
    }

    /**
     * Pin/Unpin tab
     */
    togglePinTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        tab.isPinned = !tab.isPinned;
        this.updateTabElement(tab);

        // Move pinned tabs to the beginning
        this.reorderTabs();
    }

    /**
     * Reorder tabs (pinned first)
     */
    reorderTabs() {
        const tabContainer = document.getElementById('tabContainer');
        if (!tabContainer) return;

        const tabs = Array.from(this.tabs.values());
        const pinnedTabs = tabs.filter(tab => tab.isPinned);
        const unpinnedTabs = tabs.filter(tab => !tab.isPinned);

        // Clear container (except new tab button)
        const newTabBtn = document.getElementById('newTabBtn');
        const tabElements = tabContainer.querySelectorAll('.tab');
        tabElements.forEach(el => el.remove());

        // Re-add tabs in order
        [...pinnedTabs, ...unpinnedTabs].forEach(tab => {
            this.createTabElement(tab);
        });
    }

    /**
     * Get tab context menu options
     */
    getTabContextMenu(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return [];

        return [
            {
                label: '新しいタブ',
                action: () => this.createTab()
            },
            { separator: true },
            {
                label: 'タブを複製',
                action: () => this.duplicateTab(tabId)
            },
            {
                label: tab.isPinned ? 'タブの固定を解除' : 'タブを固定',
                action: () => this.togglePinTab(tabId)
            },
            { separator: true },
            {
                label: '他のタブを閉じる',
                action: () => this.closeOtherTabs(),
                disabled: this.tabs.size <= 1
            },
            {
                label: 'タブを閉じる',
                action: () => this.closeTab(tabId),
                disabled: this.tabs.size <= 1
            }
        ];
    }

    /**
     * Create initial tab
     */
    createInitialTab() {
        this.createTab(null, '新しいタブ');
    }

    /**
     * Escape HTML for security
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.closeAllTabs();
        this.tabs.clear();
        this.activeTabId = null;
    }
}

// Export for use by Umbra
window.TabManager = TabManager;
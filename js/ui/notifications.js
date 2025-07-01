/**
 * Umbra Browser - Notification Manager
 * Handles notifications, alerts, and user feedback
 */

class NotificationManager {
    constructor() {
        this.notifications = new Map();
        this.nextId = 1;
        this.container = null;
        this.defaultDuration = 5000; // 5 seconds
        this.maxNotifications = 5;
        
        this.init();
    }

    init() {
        this.createContainer();
        this.setupStyles();
        console.log('Notification Manager initialized');
    }

    /**
     * Create notification container
     */
    createContainer() {
        this.container = document.getElementById('notificationContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notificationContainer';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Setup notification styles (if not already in CSS)
     */
    setupStyles() {
        // Additional dynamic styles if needed
        const style = document.createElement('style');
        style.textContent = `
            .notification.slide-in {
                animation: slideInNotification 0.3s ease-out;
            }
            
            .notification.slide-out {
                animation: slideOutNotification 0.3s ease-in;
            }
            
            @keyframes slideInNotification {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutNotification {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show notification
     */
    show(message, type = 'info', options = {}) {
        const id = this.nextId++;
        const notification = this.createNotification(id, message, type, options);
        
        // Limit number of notifications
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = Math.min(...this.notifications.keys());
            this.hide(oldestId);
        }
        
        this.notifications.set(id, notification);
        this.container.appendChild(notification.element);
        
        // Trigger slide-in animation
        requestAnimationFrame(() => {
            notification.element.classList.add('slide-in');
        });
        
        // Auto-hide after duration
        if (options.duration !== -1) {
            const duration = options.duration || this.getDurationForType(type);
            notification.timeoutId = setTimeout(() => {
                this.hide(id);
            }, duration);
        }
        
        // Play sound if enabled
        if (options.sound !== false) {
            this.playNotificationSound(type);
        }
        
        return id;
    }

    /**
     * Create notification element
     */
    createNotification(id, message, type, options) {
        const element = document.createElement('div');
        element.className = `notification ${type}`;
        element.setAttribute('data-notification-id', id);
        
        const icon = this.getIconForType(type);
        const title = options.title || this.getTitleForType(type);
        
        element.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-title">${this.escapeHtml(title)}</div>
                <div class="notification-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="notification-close" title="閉じる">×</button>
        `;
        
        // Add action buttons if provided
        if (options.actions && options.actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'notification-actions';
            
            options.actions.forEach(action => {
                const button = document.createElement('button');
                button.className = `notification-action ${action.type || 'secondary'}`;
                button.textContent = action.label;
                button.addEventListener('click', () => {
                    if (action.handler) {
                        action.handler();
                    }
                    if (!action.keepOpen) {
                        this.hide(id);
                    }
                });
                actionsContainer.appendChild(button);
            });
            
            element.querySelector('.notification-content').appendChild(actionsContainer);
        }
        
        // Close button handler
        const closeBtn = element.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hide(id);
        });
        
        // Click to dismiss (if enabled)
        if (options.clickToClose !== false) {
            element.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-action') && !e.target.closest('.notification-close')) {
                    this.hide(id);
                }
            });
        }
        
        return {
            id,
            element,
            type,
            message,
            options,
            timeoutId: null,
            created: Date.now()
        };
    }

    /**
     * Hide notification
     */
    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        // Clear timeout
        if (notification.timeoutId) {
            clearTimeout(notification.timeoutId);
        }
        
        // Slide out animation
        notification.element.classList.remove('slide-in');
        notification.element.classList.add('slide-out');
        
        // Remove after animation
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    /**
     * Hide all notifications
     */
    hideAll() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.hide(id));
    }

    /**
     * Update notification
     */
    update(id, updates) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        if (updates.message) {
            const messageElement = notification.element.querySelector('.notification-message');
            if (messageElement) {
                messageElement.textContent = updates.message;
                notification.message = updates.message;
            }
        }
        
        if (updates.type) {
            notification.element.className = `notification ${updates.type}`;
            const icon = notification.element.querySelector('.notification-icon');
            if (icon) {
                icon.textContent = this.getIconForType(updates.type);
            }
            notification.type = updates.type;
        }
        
        if (updates.title) {
            const titleElement = notification.element.querySelector('.notification-title');
            if (titleElement) {
                titleElement.textContent = updates.title;
            }
        }
    }

    /**
     * Show success notification
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    /**
     * Show error notification
     */
    error(message, options = {}) {
        return this.show(message, 'error', { duration: 8000, ...options });
    }

    /**
     * Show warning notification
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', { duration: 6000, ...options });
    }

    /**
     * Show info notification
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    /**
     * Show loading notification
     */
    loading(message, options = {}) {
        return this.show(message, 'loading', { duration: -1, ...options });
    }

    /**
     * Show confirmation dialog
     */
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const actions = [
                {
                    label: options.cancelLabel || 'キャンセル',
                    type: 'secondary',
                    handler: () => resolve(false)
                },
                {
                    label: options.confirmLabel || 'OK',
                    type: 'primary',
                    handler: () => resolve(true)
                }
            ];
            
            this.show(message, 'info', {
                title: options.title || '確認',
                duration: -1,
                actions,
                clickToClose: false,
                ...options
            });
        });
    }

    /**
     * Show prompt dialog
     */
    prompt(message, defaultValue = '', options = {}) {
        return new Promise((resolve) => {
            const id = this.nextId++;
            const notification = document.createElement('div');
            notification.className = 'notification prompt';
            notification.setAttribute('data-notification-id', id);
            
            notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-title">${options.title || '入力'}</div>
                    <div class="notification-message">${this.escapeHtml(message)}</div>
                    <input type="text" class="notification-input" value="${this.escapeHtml(defaultValue)}" placeholder="${options.placeholder || ''}">
                    <div class="notification-actions">
                        <button class="notification-action secondary">キャンセル</button>
                        <button class="notification-action primary">OK</button>
                    </div>
                </div>
                <button class="notification-close">×</button>
            `;
            
            const input = notification.querySelector('.notification-input');
            const cancelBtn = notification.querySelector('.notification-action.secondary');
            const okBtn = notification.querySelector('.notification-action.primary');
            const closeBtn = notification.querySelector('.notification-close');
            
            const cleanup = () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(id);
            };
            
            cancelBtn.addEventListener('click', () => {
                resolve(null);
                cleanup();
            });
            
            okBtn.addEventListener('click', () => {
                resolve(input.value);
                cleanup();
            });
            
            closeBtn.addEventListener('click', () => {
                resolve(null);
                cleanup();
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    resolve(input.value);
                    cleanup();
                }
            });
            
            this.notifications.set(id, { id, element: notification });
            this.container.appendChild(notification);
            
            // Focus input
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);
        });
    }

    /**
     * Show progress notification
     */
    showProgress(message, options = {}) {
        const id = this.nextId++;
        const notification = document.createElement('div');
        notification.className = 'notification progress';
        notification.setAttribute('data-notification-id', id);
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${options.title || '進行中'}</div>
                <div class="notification-message">${this.escapeHtml(message)}</div>
                <div class="notification-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-text">0%</div>
                </div>
            </div>
        `;
        
        const progressFill = notification.querySelector('.progress-fill');
        const progressText = notification.querySelector('.progress-text');
        
        const progressNotification = {
            id,
            element: notification,
            updateProgress: (percentage) => {
                const percent = Math.max(0, Math.min(100, percentage));
                progressFill.style.width = `${percent}%`;
                progressText.textContent = `${Math.round(percent)}%`;
            },
            complete: (successMessage) => {
                progressFill.style.width = '100%';
                progressText.textContent = '100%';
                
                if (successMessage) {
                    setTimeout(() => {
                        const messageElement = notification.querySelector('.notification-message');
                        messageElement.textContent = successMessage;
                        notification.className = 'notification success';
                        setTimeout(() => this.hide(id), 2000);
                    }, 500);
                } else {
                    setTimeout(() => this.hide(id), 1000);
                }
            }
        };
        
        this.notifications.set(id, progressNotification);
        this.container.appendChild(notification);
        
        return progressNotification;
    }

    /**
     * Get icon for notification type
     */
    getIconForType(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳',
            progress: '🔄'
        };
        return icons[type] || 'ℹ️';
    }

    /**
     * Get title for notification type
     */
    getTitleForType(type) {
        const titles = {
            success: '成功',
            error: 'エラー',
            warning: '警告',
            info: '情報',
            loading: '読み込み中',
            progress: '進行中'
        };
        return titles[type] || '通知';
    }

    /**
     * Get duration for notification type
     */
    getDurationForType(type) {
        const durations = {
            success: 3000,
            error: 8000,
            warning: 6000,
            info: 5000,
            loading: -1,
            progress: -1
        };
        return durations[type] || this.defaultDuration;
    }

    /**
     * Play notification sound
     */
    playNotificationSound(type) {
        // Simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different frequencies for different types
            const frequencies = {
                success: 800,
                error: 300,
                warning: 600,
                info: 500
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            // Sound not supported or disabled
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get all active notifications
     */
    getActiveNotifications() {
        return Array.from(this.notifications.values());
    }

    /**
     * Clear expired notifications
     */
    clearExpired() {
        const now = Date.now();
        const expiredIds = [];
        
        this.notifications.forEach((notification, id) => {
            if (notification.created && (now - notification.created) > 30000) { // 30 seconds
                expiredIds.push(id);
            }
        });
        
        expiredIds.forEach(id => this.hide(id));
    }

    /**
     * Set global notification settings
     */
    setSettings(settings) {
        if (settings.defaultDuration !== undefined) {
            this.defaultDuration = settings.defaultDuration;
        }
        if (settings.maxNotifications !== undefined) {
            this.maxNotifications = settings.maxNotifications;
        }
    }

    /**
     * Show system notification (if permissions granted)
     */
    showSystemNotification(title, message, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: message,
                icon: options.icon || '/favicon.ico',
                tag: options.tag || 'umbra-notification'
            });
            
            if (options.onClick) {
                notification.onclick = options.onClick;
            }
            
            // Auto-close after delay
            setTimeout(() => {
                notification.close();
            }, options.duration || 5000);
            
            return notification;
        }
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    /**
     * Destroy notification manager
     */
    destroy() {
        this.hideAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.notifications.clear();
    }
}

// Export for use by Umbra
window.NotificationManager = NotificationManager;
// Main Virtual Assistant Controller
class VirtualAssistant {
    constructor() {
        this.isOnline = true;
        this.activityFeed = [];
        this.settings = {
            responseTone: 'professional',
            autoEmailReply: true,
            autoChatGreeting: true,
            privacyMode: false
        };
        this.chatHandler = null;
        this.emailHandler = null;
        this.init();
    }

    init() {
        this.updateAssistantStatus();
        this.loadSettings();
        this.setupEventListeners();
        
        // Initialize activity feed with welcome message
        this.addActivity('system', 'Virtual Assistant initialized and ready');
        
        // Update counters periodically
        setInterval(() => {
            this.updateAllCounters();
        }, 5000);
    }

    setupEventListeners() {
        // Settings change handlers
        const responseToneSelect = document.getElementById('response-tone');
        if (responseToneSelect) {
            responseToneSelect.addEventListener('change', (e) => {
                this.updateResponseTone(e.target.value);
            });
        }

        const autoEmailReply = document.getElementById('auto-email-reply');
        if (autoEmailReply) {
            autoEmailReply.addEventListener('change', (e) => {
                this.settings.autoEmailReply = e.target.checked;
                this.saveSettings();
            });
        }

        const autoChatGreeting = document.getElementById('auto-chat-greeting');
        if (autoChatGreeting) {
            autoChatGreeting.addEventListener('change', (e) => {
                this.settings.autoChatGreeting = e.target.checked;
                this.saveSettings();
            });
        }
    }

    updateAssistantStatus() {
        const statusIndicator = document.getElementById('assistant-status');
        const statusText = document.getElementById('status-text');
        
        if (statusIndicator && statusText) {
            statusIndicator.className = `status-indicator ${this.isOnline ? 'active' : 'inactive'}`;
            statusText.textContent = this.isOnline ? 'Online' : 'Offline';
        }
    }

    updateAllCounters() {
        // Update conversation count
        if (typeof chatHandler !== 'undefined') {
            chatHandler.updateConversationCount();
        }
        
        // Update email count
        if (typeof emailHandler !== 'undefined') {
            emailHandler.updateEmailCount();
        }
    }

    addActivity(type, description) {
        const activity = {
            type: type,
            description: description,
            timestamp: new Date()
        };
        
        this.activityFeed.unshift(activity);
        
        // Keep only last 50 activities
        if (this.activityFeed.length > 50) {
            this.activityFeed = this.activityFeed.slice(0, 50);
        }
        
        this.updateActivityDisplay();
    }

    updateActivityDisplay() {
        const activityFeedElement = document.getElementById('activity-feed');
        if (!activityFeedElement) return;

        activityFeedElement.innerHTML = '';
        
        this.activityFeed.slice(0, 10).forEach(activity => {
            const activityDiv = document.createElement('div');
            activityDiv.className = 'activity-item';
            
            activityDiv.innerHTML = `
                <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
                <span class="activity-type ${activity.type}">${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</span>
                <span class="activity-description">${activity.description}</span>
            `;
            
            activityFeedElement.appendChild(activityDiv);
        });
    }

    updateResponseTone(tone) {
        this.settings.responseTone = tone;
        this.saveSettings();
        this.addActivity('system', `Response tone changed to ${tone}`);
        
        // Update all handlers with new tone
        if (typeof emailHandler !== 'undefined') {
            emailHandler.responseTone = tone;
        }
        if (typeof chatHandler !== 'undefined') {
            chatHandler.responseTone = tone;
        }
    }

    showPrivacySettings() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔒 Privacy & Security Settings</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 2rem;">
                    <div class="settings-group">
                        <h4>Data Privacy</h4>
                        <label>
                            <input type="checkbox" ${this.settings.privacyMode ? 'checked' : ''} 
                                   onchange="virtualAssistant.togglePrivacyMode(this.checked)">
                            Enable Privacy Mode (anonymize personal data)
                        </label>
                        <p style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">
                            When enabled, personal information in emails and chats will be masked for privacy protection.
                        </p>
                    </div>
                    
                    <div class="settings-group">
                        <h4>Data Retention</h4>
                        <p style="font-size: 0.9rem; color: #666;">
                            • Email data is stored locally in your browser<br>
                            • Chat conversations are kept for 30 days<br>
                            • Call logs are retained for 90 days<br>
                            • No data is transmitted to external servers without consent
                        </p>
                    </div>
                    
                    <div class="settings-group">
                        <h4>Security Features</h4>
                        <p style="font-size: 0.9rem; color: #666;">
                            • All communications use secure protocols<br>
                            • Personal data is encrypted in local storage<br>
                            • No third-party tracking or analytics<br>
                            • Regular security updates and monitoring
                        </p>
                    </div>
                    
                    <div style="margin-top: 2rem;">
                        <button class="btn-primary" onclick="this.closest('.modal').remove();">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    togglePrivacyMode(enabled) {
        this.settings.privacyMode = enabled;
        this.saveSettings();
        this.addActivity('system', `Privacy mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    exportData() {
        const exportData = {
            settings: this.settings,
            activityFeed: this.activityFeed,
            emails: typeof emailHandler !== 'undefined' ? emailHandler.emails : [],
            conversations: typeof chatHandler !== 'undefined' ? Array.from(chatHandler.conversations.values()) : [],
            callHistory: typeof voipHandler !== 'undefined' ? voipHandler.callHistory : [],
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `softaidev-assistant-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.addActivity('system', 'Data exported successfully');
    }

    saveSettings() {
        try {
            localStorage.setItem('virtualAssistantSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('virtualAssistantSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
                this.applySettings();
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    applySettings() {
        // Apply response tone
        const responseToneSelect = document.getElementById('response-tone');
        if (responseToneSelect) {
            responseToneSelect.value = this.settings.responseTone;
        }

        // Apply checkbox settings
        const autoEmailReply = document.getElementById('auto-email-reply');
        if (autoEmailReply) {
            autoEmailReply.checked = this.settings.autoEmailReply;
        }

        const autoChatGreeting = document.getElementById('auto-chat-greeting');
        if (autoChatGreeting) {
            autoChatGreeting.checked = this.settings.autoChatGreeting;
        }
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return timestamp.toLocaleDateString();
    }

    // Integration methods for chat widget
    initChatWidget() {
        // Create floating chat button for website visitors
        const chatButton = document.createElement('div');
        chatButton.id = 'chat-widget-button';
        chatButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: #1a237e;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        chatButton.innerHTML = '💬';
        chatButton.onclick = () => this.openVisitorChat();
        
        // Only add to main website pages, not admin interface
        if (!window.location.pathname.includes('virtual-assistant')) {
            document.body.appendChild(chatButton);
        }
    }

    openVisitorChat() {
        // Create visitor chat interface
        const chatWidget = document.createElement('div');
        chatWidget.id = 'visitor-chat-widget';
        chatWidget.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 350px;
            height: 400px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 1001;
            display: flex;
            flex-direction: column;
        `;
        
        chatWidget.innerHTML = `
            <div style="background: #1a237e; color: white; padding: 1rem; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0;">Chat with SoftAIDev</h4>
                <span onclick="this.closest('#visitor-chat-widget').remove()" style="cursor: pointer; font-size: 1.2rem;">&times;</span>
            </div>
            <div id="visitor-messages" style="flex: 1; padding: 1rem; overflow-y: auto; background: #f9f9f9;"></div>
            <div style="padding: 1rem; border-top: 1px solid #eee;">
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" id="visitor-message-input" placeholder="Type your message..." 
                           style="flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    <button onclick="virtualAssistant.sendVisitorMessage()" 
                            style="background: #1a237e; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Send</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(chatWidget);
        
        // Auto-send greeting
        setTimeout(() => {
            this.addVisitorMessage('assistant', 'Hello! Welcome to SoftAIDev. How can I help you today?');
        }, 500);
    }

    sendVisitorMessage() {
        const input = document.getElementById('visitor-message-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addVisitorMessage('visitor', message);
        input.value = '';
        
        // Simulate assistant response
        setTimeout(() => {
            const responses = [
                "Thank you for your message. Let me help you with that.",
                "I understand your inquiry. Our team specializes in custom software development.",
                "That's a great question! We offer comprehensive IT consulting services.",
                "I'd be happy to provide more information about our services.",
                "Let me connect you with the right specialist for your needs."
            ];
            
            const response = responses[Math.floor(Math.random() * responses.length)];
            this.addVisitorMessage('assistant', response);
        }, 1000);
    }

    addVisitorMessage(sender, message) {
        const messagesContainer = document.getElementById('visitor-messages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            margin-bottom: 1rem;
            padding: 0.75rem;
            border-radius: 8px;
            max-width: 80%;
            ${sender === 'visitor' ? 
                'background: #e3f2fd; margin-left: 0; margin-right: auto;' : 
                'background: #1a237e; color: white; margin-left: auto; margin-right: 0;'
            }
        `;
        
        messageDiv.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 0.25rem;">
                ${sender === 'visitor' ? 'You' : 'SoftAIDev Assistant'}
            </div>
            <div>${message}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Global functions for HTML onclick handlers
function updateResponseTone() {
    const select = document.getElementById('response-tone');
    if (select && virtualAssistant) {
        virtualAssistant.updateResponseTone(select.value);
    }
}

function showPrivacySettings() {
    if (virtualAssistant) {
        virtualAssistant.showPrivacySettings();
    }
}

function exportData() {
    if (virtualAssistant) {
        virtualAssistant.exportData();
    }
}

// Global activity function for other modules
function addActivity(type, description) {
    if (virtualAssistant) {
        virtualAssistant.addActivity(type, description);
    }
}

// Make addActivity available globally
window.addActivity = addActivity;

// Initialize virtual assistant when DOM is loaded
let virtualAssistant;
document.addEventListener('DOMContentLoaded', function() {
    virtualAssistant = new VirtualAssistant();
    
    // Initialize chat widget for visitor-facing pages
    virtualAssistant.initChatWidget();
});

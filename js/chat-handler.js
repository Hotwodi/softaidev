// Chat Handler Module with Supabase Integration
import { assistantService } from './services/assistantService.js';

class ChatHandler {
    constructor() {
        this.conversations = new Map();
        this.isAvailable = true;
        this.supabaseEnabled = false;
        this.quickResponses = [
            "Hello! How can I help you today?",
            "Thank you for contacting SoftAIDev. I'm here to assist you.",
            "Let me look into that for you right away.",
            "I understand your concern. Let me help you resolve this.",
            "Is there anything else I can help you with?",
            "Thank you for your patience. I'm working on your request.",
            "I'd be happy to connect you with our technical team for this issue.",
            "Let me get you the information you need."
        ];
        this.callTemplates = {
            greeting: "Hello, thank you for calling SoftAIDev customer support. This is the Virtual Assistant, how may I assist you today?",
            understanding: "Thank you for sharing that with me. I understand you're [summarize issue or request]. Let me look into this for you.",
            investigating: "Could you please provide [any needed information]? I will check on that right away.",
            solution: "I have found the information you requested: [state solution or info]. Is there anything else I can help you with?",
            closing: "Thank you for contacting SoftAIDev. Have a great day!"
        };
        this.init();
    }

    async init() {
        // Check if Supabase is available
        try {
            if (typeof assistantService !== 'undefined') {
                this.supabaseEnabled = true;
                await this.loadConversationsFromSupabase();
            }
        } catch (error) {
            console.log('Supabase not available, using local storage');
            this.supabaseEnabled = false;
        }
        
        // Add sample conversation if no Supabase
        if (!this.supabaseEnabled) {
            this.addSampleConversation();
        }
        
        this.updateChatDisplay();
        this.updateChatStatus();
        
        // Simulate incoming chat requests
        setInterval(() => {
            if (this.isAvailable && Math.random() < 0.05) { // 5% chance every interval
                this.simulateIncomingChat();
            }
        }, 20000); // Check every 20 seconds
    }

    async loadConversationsFromSupabase() {
        try {
            const conversations = await assistantService.getChatHistory();
            
            // Group messages by conversation ID
            const conversationMap = new Map();
            
            conversations.forEach(msg => {
                if (!conversationMap.has(msg.conversation_id)) {
                    conversationMap.set(msg.conversation_id, {
                        id: msg.conversation_id,
                        visitorName: msg.visitor_name || `Visitor #${msg.conversation_id.slice(-4)}`,
                        visitorEmail: msg.visitor_email,
                        visitorPhone: msg.visitor_phone,
                        messages: [],
                        status: 'active',
                        lastActivity: new Date(msg.created_at)
                    });
                }
                
                const conversation = conversationMap.get(msg.conversation_id);
                conversation.messages.push({
                    sender: msg.sender,
                    message: msg.message,
                    timestamp: new Date(msg.created_at)
                });
                
                // Update last activity to most recent message
                if (new Date(msg.created_at) > conversation.lastActivity) {
                    conversation.lastActivity = new Date(msg.created_at);
                }
            });
            
            // Add conversations to local map
            conversationMap.forEach((conversation, id) => {
                // Sort messages by timestamp
                conversation.messages.sort((a, b) => a.timestamp - b.timestamp);
                this.conversations.set(id, conversation);
            });
            
        } catch (error) {
            console.error('Failed to load conversations from Supabase:', error);
            this.addSampleConversation();
        }
    }

    addSampleConversation() {
        const sampleConversation = {
            id: '1234',
            visitorName: 'John Smith',
            visitorEmail: 'john@example.com',
            messages: [
                {
                    sender: 'visitor',
                    message: 'Hi, I need help with your cloud services.',
                    timestamp: new Date(Date.now() - 300000)
                },
                {
                    sender: 'assistant',
                    message: 'Hello John! I\'d be happy to help you with our cloud services. What specific information are you looking for?',
                    timestamp: new Date(Date.now() - 240000)
                },
                {
                    sender: 'visitor',
                    message: 'I want to know about pricing for enterprise solutions.',
                    timestamp: new Date(Date.now() - 180000)
                }
            ],
            status: 'active',
            lastActivity: new Date(Date.now() - 180000)
        };
        
        this.conversations.set('1234', sampleConversation);
    }

    async simulateIncomingChat() {
        const visitorId = 'visitor_' + Date.now();
        const inquiries = [
            'Hi, I have a question about your services.',
            'Hello, can you help me with technical support?',
            'I\'m interested in your cloud solutions.',
            'Can you provide information about pricing?',
            'I need help with a project consultation.'
        ];

        const visitorMessage = inquiries[Math.floor(Math.random() * inquiries.length)];
        const newConversation = {
            id: visitorId,
            visitorName: `Visitor #${visitorId.slice(-4)}`,
            messages: [
                {
                    sender: 'visitor',
                    message: visitorMessage,
                    timestamp: new Date()
                }
            ],
            status: 'waiting',
            lastActivity: new Date()
        };

        // Save to Supabase if available
        if (this.supabaseEnabled) {
            try {
                await assistantService.saveChatMessage({
                    conversationId: visitorId,
                    sender: 'visitor',
                    message: visitorMessage,
                    visitorInfo: {
                        name: newConversation.visitorName
                    }
                });
            } catch (error) {
                console.error('Failed to save chat message to Supabase:', error);
            }
        }

        this.conversations.set(visitorId, newConversation);
        this.updateChatDisplay();
        this.updateConversationCount();
        
        // Auto-greet if enabled
        if (document.getElementById('auto-chat-greeting')?.checked) {
            setTimeout(async () => {
                await this.sendAutoGreeting(visitorId);
            }, 2000);
        }
        
        this.addActivity('chat', `New chat request from ${newConversation.visitorName}`);
    }

    async sendAutoGreeting(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return;

        const greeting = "Hello! Thank you for contacting SoftAIDev. I'm here to help you. How can I assist you today?";
        
        conversation.messages.push({
            sender: 'assistant',
            message: greeting,
            timestamp: new Date()
        });
        
        conversation.status = 'active';
        conversation.lastActivity = new Date();
        
        // Save to Supabase if available
        if (this.supabaseEnabled) {
            try {
                await assistantService.saveChatMessage({
                    conversationId: conversationId,
                    sender: 'assistant',
                    message: greeting,
                    visitorInfo: {
                        name: conversation.visitorName
                    }
                });
            } catch (error) {
                console.error('Failed to save auto-greeting to Supabase:', error);
            }
        }
        
        this.updateChatDisplay();
        this.addActivity('chat', `Auto-greeted ${conversation.visitorName}`);
        
        // Check if this is an order status query
        const isOrderQuery = await this.checkOrderStatus(conversation.messages[0].message, conversationId || 'default');
        
        // Only send default response if it's not an order query
        if (!isOrderQuery) {
            // Simulate bot response (in a real app, this would be an API call)
            setTimeout(() => {
                const botResponse = this.generateResponse(conversation.messages[0].message);
                this.addMessage(conversation.container, 'assistant', botResponse, 'SoftAIDev Assistant');
                
                // Add bot response to conversation history
                conversation.messages.push({
                    sender: 'assistant',
                    message: botResponse,
                    timestamp: new Date()
                });

                // Auto-scroll to bottom of chat
                conversation.container.scrollTop = conversation.container.scrollHeight;
            }, 1000);
        }
    }

    openChat(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return;

        conversation.status = 'active';
        this.showChatModal(conversation);
        this.updateChatDisplay();
    }

    showChatModal(conversation) {
        const modal = document.getElementById('chat-modal');
        if (!modal) return;

        // Update modal header
        const header = modal.querySelector('.modal-header h3');
        header.textContent = `Chat with ${conversation.visitorName}`;

        // Update messages
        const messagesContainer = modal.querySelector('#chat-messages');
        messagesContainer.innerHTML = '';
        
        conversation.messages.forEach(msg => {
            this.displayMessage(messagesContainer, msg, conversation.visitorName);
        });

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Set up input handler
        const chatInput = modal.querySelector('#chat-input');
        chatInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage(conversation.id);
            }
        };

        modal.style.display = 'block';
        chatInput.focus();
    }

    async sendChatMessage(conversationId = null) {
        const modal = document.getElementById('chat-modal');
        const input = modal.querySelector('#chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Get conversation ID from modal if not provided
        if (!conversationId) {
            const headerText = modal.querySelector('.modal-header h3').textContent;
            const visitorName = headerText.replace('Chat with ', '');
            conversationId = Array.from(this.conversations.keys()).find(id => 
                this.conversations.get(id).visitorName === visitorName
            );
        }

        const conversation = this.conversations.get(conversationId);
        if (!conversation) return;

        // Add message to conversation
        const newMessage = {
            sender: 'assistant',
            message: message,
            timestamp: new Date()
        };
        
        conversation.messages.push(newMessage);
        conversation.lastActivity = new Date();
        input.value = '';

        // Save to Supabase if available
        if (this.supabaseEnabled) {
            try {
                await assistantService.saveChatMessage({
                    conversationId: conversationId,
                    sender: 'assistant',
                    message: message,
                    visitorInfo: {
                        name: conversation.visitorName,
                        email: conversation.visitorEmail || null,
                        phone: conversation.visitorPhone || null
                    }
                });
            } catch (error) {
                console.error('Failed to save chat message to Supabase:', error);
            }
        }

        // Update display
        this.showChatModal(conversation);
        this.updateChatDisplay();
        
        this.addActivity('chat', `Sent message to ${conversation.visitorName}`);
    }

    suggestResponse() {
        const modal = document.getElementById('chat-modal');
        const input = modal.querySelector('#chat-input');
        
        // Get random quick response
        const suggestion = this.quickResponses[Math.floor(Math.random() * this.quickResponses.length)];
        input.value = suggestion;
        input.focus();
    }

    toggleChatAvailability() {
        this.isAvailable = !this.isAvailable;
        this.updateChatStatus();
        
        const button = document.querySelector('.chat-controls .btn-primary');
        button.textContent = this.isAvailable ? 'Set Unavailable' : 'Set Available';
        
        this.addActivity('chat', `Chat availability: ${this.isAvailable ? 'Available' : 'Unavailable'}`);
    }

    showChatTemplates() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Quick Response Templates</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 1rem;">
                    <div class="template-list">
                        ${this.quickResponses.map((response, index) => `
                            <div class="template-item" onclick="chatHandler.useQuickResponse('${response}'); this.closest('.modal').remove();">
                                <p>${response}</p>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 1rem;">
                        <h4>Call Response Templates</h4>
                        ${Object.entries(this.callTemplates).map(([key, template]) => `
                            <div class="template-item" onclick="chatHandler.useCallTemplate('${key}'); this.closest('.modal').remove();">
                                <h4>${key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                                <p>${template}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    useQuickResponse(response) {
        const modal = document.getElementById('chat-modal');
        if (modal && modal.style.display === 'block') {
            const input = modal.querySelector('#chat-input');
            input.value = response;
            input.focus();
        }
    }

    useCallTemplate(templateKey) {
        const template = this.callTemplates[templateKey];
        if (template) {
            // Copy to clipboard or show in a text area for VOIP use
            navigator.clipboard.writeText(template).then(() => {
                this.showNotification('Call template copied to clipboard!', 'success');
            });
        }
    }

    updateChatDisplay() {
        const conversationsContainer = document.getElementById('chat-conversations');
        if (!conversationsContainer) return;

        conversationsContainer.innerHTML = '';
        
        Array.from(this.conversations.values())
            .sort((a, b) => b.lastActivity - a.lastActivity)
            .forEach(conversation => {
                const conversationDiv = document.createElement('div');
                conversationDiv.className = 'conversation-item';
                
                const lastMessage = conversation.messages[conversation.messages.length - 1];
                const statusColor = conversation.status === 'active' ? '#4caf50' : 
                                  conversation.status === 'waiting' ? '#ff9800' : '#666';
                
                conversationDiv.innerHTML = `
                    <div class="conversation-header">
                        <strong>${conversation.visitorName}</strong>
                        <span class="conversation-time" style="color: ${statusColor};">
                            ${conversation.status === 'active' ? 'Active now' : this.formatTime(conversation.lastActivity)}
                        </span>
                    </div>
                    <div class="conversation-preview">${lastMessage.message.substring(0, 50)}...</div>
                    <button class="btn-small" onclick="chatHandler.openChat('${conversation.id}')">
                        ${conversation.status === 'waiting' ? 'Respond' : 'Open Chat'}
                    </button>
                `;
                
                conversationsContainer.appendChild(conversationDiv);
            });
    }

    updateChatStatus() {
        const statusElement = document.getElementById('chat-status');
        if (statusElement) {
            statusElement.textContent = this.isAvailable ? 'Available' : 'Unavailable';
            statusElement.style.background = this.isAvailable ? '#4caf50' : '#f44336';
        }
    }

    updateConversationCount() {
        const activeCount = Array.from(this.conversations.values())
            .filter(conv => conv.status === 'active' || conv.status === 'waiting').length;
        
        const countElement = document.getElementById('active-conversations');
        if (countElement) {
            countElement.textContent = activeCount;
        }
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return timestamp.toLocaleDateString();
    }

    addActivity(type, description) {
        if (typeof window.addActivity === 'function') {
            window.addActivity(type, description);
        }
    }

    displayMessage(container, msg, visitorName) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender}`;
        messageDiv.style.cssText = `
            margin-bottom: 1rem;
            padding: 0.75rem;
            border-radius: 8px;
            max-width: 80%;
            ${msg.sender === 'visitor' ? 
                'background: #e3f2fd; margin-left: 0; margin-right: auto;' : 
                'background: #1a237e; color: white; margin-left: auto; margin-right: 0;'
            }
        `;
        messageDiv.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 0.25rem;">
                ${msg.sender === 'visitor' ? visitorName : 'SoftAIDev Assistant'}
            </div>
            <div>${msg.message}</div>
            <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 0.25rem;">
                ${this.formatTime(msg.timestamp)}
            </div>
        `;
        container.appendChild(messageDiv);
        return messageDiv;
    }
    
    addMessage(container, sender, message, visitorName) {
        const msg = {
            sender: sender,
            message: message,
            timestamp: new Date()
        };
        return this.displayMessage(container, msg, visitorName);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : '#2196f3'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 3000;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
function openChat(conversationId) {
    chatHandler.openChat(conversationId);
}

function closeChatModal() {
    document.getElementById('chat-modal').style.display = 'none';
}

function sendChatMessage() {
    chatHandler.sendChatMessage();
}

function suggestResponse() {
    chatHandler.suggestResponse();
}

function toggleChatAvailability() {
    chatHandler.toggleChatAvailability();
}

function showChatTemplates() {
    chatHandler.showChatTemplates();
}

function displayMessage(container, message, sender, visitorName) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
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
            ${sender === 'visitor' ? visitorName : 'SoftAIDev Assistant'}
        </div>
        <div>${message}</div>
        <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 0.25rem;">
            ${new Date().toLocaleTimeString()}
        </div>
    `;
    container.appendChild(messageDiv);
    return messageDiv;
}

function addMessage(container, sender, message, visitorName) {
    return displayMessage(container, message, sender, visitorName);
}

// Initialize chat handler when DOM is loaded
let chatHandler;
document.addEventListener('DOMContentLoaded', function() {
    chatHandler = new ChatHandler();
    
    // Add click event listeners
    document.getElementById('send-chat')?.addEventListener('click', function() {
        sendChatMessage();
    });
    
    document.getElementById('chat-button')?.addEventListener('click', function() {
        document.getElementById('chat-modal').style.display = 'block';
    });
    
    document.getElementById('close-chat')?.addEventListener('click', function() {
        closeChatModal();
    });
});

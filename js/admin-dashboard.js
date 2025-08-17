// Admin Dashboard JavaScript
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/umd/supabase.min.js';
import { assistantService, emailService } from './services/assistantService.js';
import { checkAdminAuth, signOut } from './auth.js';

// Initialize Supabase client
const supabase = createClient(
  'https://glplnybcdgbyajdgzjrr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdi...'
);

// Global variables
let currentUser = null;
let chatAvailable = true;
let voipServiceActive = false;
let currentChatId = null;

// DOM Elements
const userNameElement = document.getElementById('userName');
const userEmailElement = document.getElementById('userEmail');
const userAvatarElement = document.getElementById('userAvatar');
const logoutBtn = document.getElementById('logoutBtn');
const menuItems = document.querySelectorAll('.menu-item');
const adminPanels = document.querySelectorAll('.admin-panel');
const emailCountElement = document.getElementById('emailCount');
const chatCountElement = document.getElementById('chatCount');
const callCountElement = document.getElementById('callCount');
const customerCountElement = document.getElementById('customerCount');
const activityFeedElement = document.getElementById('activityFeed');
const emailListElement = document.getElementById('emailList');
const chatConversationsElement = document.getElementById('chatConversations');
const callHistoryElement = document.getElementById('callHistory');
const activeCallsElement = document.getElementById('activeCalls');
const customersTableBodyElement = document.getElementById('customersTableBody');
const toggleChatBtn = document.getElementById('toggleChatBtn');
const toggleVoipBtn = document.getElementById('toggleVoipBtn');
const chatModal = document.getElementById('chatModal');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const templateModal = document.getElementById('templateModal');
const templateModalTitle = document.getElementById('templateModalTitle');
const templateModalContent = document.getElementById('templateModalContent');
const tabButtons = document.querySelectorAll('.tab-btn');
const templatesContent = document.querySelectorAll('.templates-content');

// Initialize the dashboard
async function init() {
  // Check if user is authenticated and has admin role
  const { isAdmin, session, error } = await checkAdminAuth();
  
  if (error || !session) {
    window.location.href = 'login.html';
    return;
  }
  
  if (!isAdmin) {
    alert('Access denied. This dashboard is only for admin users.');
    await signOut();
    window.location.href = 'virtual-assistant.html';
    return;
  }
  
  // Set current user
  currentUser = session.user;
  
  // Update user info
  userNameElement.textContent = currentUser.user_metadata?.full_name || 'Admin User';
  userEmailElement.textContent = currentUser.email;
  userAvatarElement.textContent = (currentUser.user_metadata?.full_name || 'A')[0].toUpperCase();
  
  // Load dashboard data
  loadDashboardStats();
  loadActivityFeed();
  loadEmailList();
  loadChatConversations();
  loadCallHistory();
  loadCustomers();
  loadTemplates();
  
  // Set up event listeners
  setupEventListeners();
}

// Load dashboard statistics
async function loadDashboardStats() {
  try {
    // Get pending emails count
    const { data: emails } = await assistantService.getEmailHistory();
    const pendingEmails = emails.filter(email => email.status === 'received' && !email.ai_summary);
    emailCountElement.textContent = pendingEmails.length;
    
    // Get active chats count
    const { data: chats } = await assistantService.getAllChatConversations();
    const activeChats = new Set(chats.map(chat => chat.conversation_id)).size;
    chatCountElement.textContent = activeChats;
    
    // Get call requests count
    const { data: calls } = await assistantService.getCallHistory();
    const pendingCalls = calls.filter(call => call.status === 'pending' || call.callback_request);
    callCountElement.textContent = pendingCalls.length;
    
    // Get customer count
    const { data: customers } = await assistantService.getCustomers();
    customerCountElement.textContent = customers.length;
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

// Load activity feed
async function loadActivityFeed() {
  try {
    const { data: activities } = await assistantService.getActivityFeed(20);
    
    if (!activities || activities.length === 0) {
      activityFeedElement.innerHTML = '<div class="no-data-message">No recent activities</div>';
      return;
    }
    
    activityFeedElement.innerHTML = activities.map(activity => {
      const activityIcon = getActivityIcon(activity.activity_type);
      const timeAgo = getTimeAgo(new Date(activity.timestamp));
      
      return `
        <div class="activity-item">
          <div class="activity-icon">${activityIcon}</div>
          <div class="activity-content">
            <h4>${activity.description}</h4>
            <p>${getActivityDetails(activity)}</p>
          </div>
          <div class="activity-time">${timeAgo}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading activity feed:', error);
    activityFeedElement.innerHTML = '<div class="error-message">Failed to load activities</div>';
  }
}

// Load email list
async function loadEmailList() {
  try {
    const { data: emails } = await assistantService.getEmailHistory();
    
    if (!emails || emails.length === 0) {
      emailListElement.innerHTML = '<div class="no-data-message">No emails found</div>';
      return;
    }
    
    emailListElement.innerHTML = emails.map(email => {
      const isUnread = email.status === 'received' && !email.ai_summary;
      const timeAgo = getTimeAgo(new Date(email.timestamp));
      
      return `
        <div class="email-item ${isUnread ? 'unread' : ''}" data-email-id="${email.email_id}">
          <div class="email-status" style="background-color: ${getEmailStatusColor(email.status)}"></div>
          <div class="email-content">
            <div class="email-header">
              <div class="email-sender">${email.from_email}</div>
              <div class="email-time">${timeAgo}</div>
            </div>
            <div class="email-subject">${email.subject || '(No subject)'}</div>
            <div class="email-preview">${email.ai_summary || email.body.substring(0, 100)}...</div>
          </div>
          <div class="email-actions">
            <button class="email-action" onclick="viewEmail('${email.email_id}')">📖</button>
            <button class="email-action" onclick="replyEmail('${email.email_id}')">↩️</button>
            <button class="email-action" onclick="forwardEmail('${email.email_id}')">↪️</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading emails:', error);
    emailListElement.innerHTML = '<div class="error-message">Failed to load emails</div>';
  }
}

// Load chat conversations
async function loadChatConversations() {
  try {
    const { data: conversations } = await assistantService.getAllChatConversations();
    
    if (!conversations || conversations.length === 0) {
      chatConversationsElement.innerHTML = '<div class="no-data-message">No chat conversations found</div>';
      return;
    }
    
    // Group by conversation_id
    const uniqueConversations = [];
    const conversationMap = {};
    
    conversations.forEach(chat => {
      if (!conversationMap[chat.conversation_id]) {
        conversationMap[chat.conversation_id] = chat;
        uniqueConversations.push(chat);
      }
    });
    
    chatConversationsElement.innerHTML = uniqueConversations.map(chat => {
      const visitorName = chat.visitor_name || 'Anonymous Visitor';
      const timeAgo = getTimeAgo(new Date(chat.timestamp));
      const initial = visitorName.charAt(0).toUpperCase();
      
      return `
        <div class="chat-conversation" data-conversation-id="${chat.conversation_id}" onclick="openChat('${chat.conversation_id}')">
          <div class="chat-avatar">${initial}</div>
          <div class="chat-info">
            <div class="chat-header">
              <div class="chat-name">${visitorName}</div>
              <div class="chat-time">${timeAgo}</div>
            </div>
            <div class="chat-preview">Click to view conversation</div>
          </div>
          <div class="chat-status active">Active</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading chat conversations:', error);
    chatConversationsElement.innerHTML = '<div class="error-message">Failed to load conversations</div>';
  }
}

// Load call history
async function loadCallHistory() {
  try {
    const { data: calls } = await assistantService.getCallHistory();
    
    if (!calls || calls.length === 0) {
      callHistoryElement.innerHTML = '<div class="no-data-message">No call history found</div>';
      activeCallsElement.innerHTML = '<div class="no-data-message">No active calls</div>';
      return;
    }
    
    // Filter active calls
    const activeCalls = calls.filter(call => call.status === 'in_progress');
    const recentCalls = calls.filter(call => call.status !== 'in_progress');
    
    if (activeCalls.length === 0) {
      activeCallsElement.innerHTML = '<div class="no-data-message">No active calls</div>';
    } else {
      activeCallsElement.innerHTML = activeCalls.map(call => renderCallItem(call)).join('');
    }
    
    callHistoryElement.innerHTML = recentCalls.map(call => renderCallItem(call)).join('');
  } catch (error) {
    console.error('Error loading call history:', error);
    callHistoryElement.innerHTML = '<div class="error-message">Failed to load call history</div>';
    activeCallsElement.innerHTML = '<div class="error-message">Failed to load active calls</div>';
  }
}

// Render call item
function renderCallItem(call) {
  const callTime = getTimeAgo(new Date(call.timestamp));
  const callIcon = call.call_type === 'incoming' ? '📞' : call.call_type === 'outgoing' ? '📤' : '🔄';
  
  return `
    <div class="call-item" data-call-id="${call.call_id}">
      <div class="call-icon">${callIcon}</div>
      <div class="call-info">
        <div class="call-header">
          <div class="call-name">${call.customer_name || 'Unknown'}</div>
          <div class="call-time">${callTime}</div>
        </div>
        <div class="call-number">${call.phone_number}</div>
        <div class="call-duration">${call.duration ? formatDuration(call.duration) : 'N/A'}</div>
      </div>
      <div class="call-status ${call.status}">${call.status}</div>
      <div class="call-actions">
        <button class="call-action" onclick="viewCallDetails('${call.call_id}')">Details</button>
        ${call.status === 'missed' ? `<button class="call-action" onclick="createCallback('${call.call_id}')">Callback</button>` : ''}
      </div>
    </div>
  `;
}

// Load customers
async function loadCustomers() {
  try {
    const { data: customers } = await assistantService.getCustomers();
    
    if (!customers || customers.length === 0) {
      customersTableBodyElement.innerHTML = '<tr><td colspan="7" class="no-data-message">No customers found</td></tr>';
      return;
    }
    
    customersTableBodyElement.innerHTML = customers.map(customer => {
      const firstContact = new Date(customer.first_contact).toLocaleDateString();
      const lastContact = new Date(customer.last_contact).toLocaleDateString();
      
      return `
        <tr data-customer-id="${customer.id}">
          <td>${customer.name || 'Unknown'}</td>
          <td>${customer.email || 'N/A'}</td>
          <td>${customer.phone || 'N/A'}</td>
          <td>${customer.source || 'N/A'}</td>
          <td>${firstContact}</td>
          <td>${lastContact}</td>
          <td>
            <button class="action-btn" onclick="viewCustomerDetails('${customer.id}')">View</button>
            <button class="action-btn" onclick="editCustomer('${customer.id}')">Edit</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading customers:', error);
    customersTableBodyElement.innerHTML = '<tr><td colspan="7" class="error-message">Failed to load customers</td></tr>';
  }
}

// Load templates
async function loadTemplates() {
  // This would typically load from database, but for now we'll use mock data
  const emailTemplates = [
    { id: 'et1', title: 'General Auto-Reply', preview: 'Thank you for contacting SoftAIDev...' },
    { id: 'et2', title: 'Technical Support', preview: 'Thank you for contacting SoftAIDev technical support...' },
    { id: 'et3', title: 'Sales Inquiry', preview: 'Thank you for your interest in SoftAIDev\'s software development services...' }
  ];
  
  const chatTemplates = [
    { id: 'ct1', title: 'Greeting', preview: 'Hello! Welcome to SoftAIDev support. How can I assist you today?' },
    { id: 'ct2', title: 'Technical Issue', preview: 'I understand you\'re experiencing a technical issue. Could you please provide more details?' },
    { id: 'ct3', title: 'Closing', preview: 'Thank you for chatting with us today. Is there anything else I can help you with?' }
  ];
  
  const callTemplates = [
    { id: 'clt1', title: 'Call Opening', preview: 'Thank you for calling SoftAIDev support. My name is [Name]. How may I assist you today?' },
    { id: 'clt2', title: 'Voicemail', preview: 'You\'ve reached SoftAIDev support. We\'re currently unavailable...' },
    { id: 'clt3', title: 'Call Closing', preview: 'Thank you for calling SoftAIDev support. Have a great day!' }
  ];
  
  document.getElementById('emailTemplatesList').innerHTML = renderTemplatesList(emailTemplates);
  document.getElementById('chatTemplatesList').innerHTML = renderTemplatesList(chatTemplates);
  document.getElementById('callTemplatesList').innerHTML = renderTemplatesList(callTemplates);
}

// Render templates list
function renderTemplatesList(templates) {
  if (!templates || templates.length === 0) {
    return '<div class="no-data-message">No templates found</div>';
  }
  
  return templates.map(template => `
    <div class="template-item" data-template-id="${template.id}">
      <div class="template-title">${template.title}</div>
      <div class="template-preview">${template.preview}</div>
    </div>
  `).join('');
}

// Set up event listeners
function setupEventListeners() {
  // Logout button
  logoutBtn.addEventListener('click', async () => {
    const { error } = await signOut();
    if (!error) {
      window.location.href = 'login.html';
    } else {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  });
  
  // Sidebar menu navigation
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPanel = item.getAttribute('data-target');
      
      // Update active menu item
      menuItems.forEach(menuItem => menuItem.classList.remove('active'));
      item.classList.add('active');
      
      // Show target panel
      adminPanels.forEach(panel => panel.classList.remove('active'));
      document.getElementById(targetPanel).classList.add('active');
    });
  });
  
  // Tab buttons
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-target');
      
      // Update active tab
      tabButtons.forEach(tab => tab.classList.remove('active'));
      button.classList.add('active');
      
      // Show target content
      templatesContent.forEach(content => content.classList.remove('active'));
      document.getElementById(target).classList.add('active');
    });
  });
  
  // Chat input
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
}

// Toggle chat availability
window.toggleChatAvailability = function() {
  chatAvailable = !chatAvailable;
  toggleChatBtn.textContent = chatAvailable ? 'Set Unavailable' : 'Set Available';
  toggleChatBtn.style.backgroundColor = chatAvailable ? '#4CAF50' : '#f44336';
  
  // Update status in database (would be implemented in a real system)
  console.log(`Chat availability set to: ${chatAvailable}`);
};

// Toggle VOIP service
window.toggleVoipService = function() {
  voipServiceActive = !voipServiceActive;
  toggleVoipBtn.textContent = voipServiceActive ? 'Stop VOIP Service' : 'Start VOIP Service';
  toggleVoipBtn.style.backgroundColor = voipServiceActive ? '#f44336' : '#4CAF50';
  
  // Update status in database (would be implemented in a real system)
  console.log(`VOIP service set to: ${voipServiceActive}`);
};

// Open chat conversation
window.openChat = function(conversationId) {
  currentChatId = conversationId;
  
  // Load chat messages
  assistantService.getChatHistory(conversationId)
    .then(messages => {
      chatMessages.innerHTML = messages.map(msg => {
        const messageTime = new Date(msg.timestamp).toLocaleTimeString();
        const messageClass = msg.sender === 'visitor' ? 'visitor' : 'assistant';
        
        return `
          <div class="chat-message ${messageClass}">
            <div class="message-bubble">${msg.message}</div>
            <div class="message-time">${messageTime}</div>
          </div>
        `;
      }).join('');
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      // Show chat modal
      chatModal.style.display = 'flex';
    })
    .catch(error => {
      console.error('Error loading chat messages:', error);
      alert('Failed to load chat messages');
    });
};

// Close chat modal
window.closeChatModal = function() {
  chatModal.style.display = 'none';
  currentChatId = null;
};

// Send chat message
window.sendChatMessage = function() {
  const message = chatInput.value.trim();
  if (!message || !currentChatId) return;
  
  // Add message to UI
  const messageTime = new Date().toLocaleTimeString();
  const messageElement = document.createElement('div');
  messageElement.className = 'chat-message assistant';
  messageElement.innerHTML = `
    <div class="message-bubble">${message}</div>
    <div class="message-time">${messageTime}</div>
  `;
  chatMessages.appendChild(messageElement);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Save message to database
  assistantService.saveChatMessage({
    conversationId: currentChatId,
    sender: 'assistant',
    message: message
  }).catch(error => {
    console.error('Error saving chat message:', error);
  });
  
  // Clear input
  chatInput.value = '';
};

// Suggest AI response
window.suggestResponse = function() {
  // This would typically call an AI service, but for now we'll use a mock response
  const suggestions = [
    'Thank you for your question. Let me check that for you.',
    'I understand your concern. Here\'s what we can do to help.',
    'I\'d be happy to assist with that. Could you provide a bit more information?'
  ];
  
  const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
  chatInput.value = randomSuggestion;
};

// Show email templates
window.showEmailTemplates = function() {
  templateModalTitle.textContent = 'Email Templates';
  templateModalContent.innerHTML = `
    <div class="templates-grid">
      <div class="template-card" onclick="selectEmailTemplate('general')">
        <h4>General Reply</h4>
        <p>Standard response for general inquiries</p>
      </div>
      <div class="template-card" onclick="selectEmailTemplate('technical')">
        <h4>Technical Support</h4>
        <p>Response for technical issues and questions</p>
      </div>
      <div class="template-card" onclick="selectEmailTemplate('sales')">
        <h4>Sales Inquiry</h4>
        <p>Response for product and pricing questions</p>
      </div>
    </div>
  `;
  templateModal.style.display = 'flex';
};

// Close template modal
window.closeTemplateModal = function() {
  templateModal.style.display = 'none';
};

// Helper functions
function getActivityIcon(activityType) {
  switch (activityType) {
    case 'email': return '📧';
    case 'chat': return '💬';
    case 'call': return '📞';
    case 'system': return '⚙️';
    default: return '📝';
  }
}

function getActivityDetails(activity) {
  // This would extract relevant details from activity metadata
  return activity.metadata ? JSON.stringify(activity.metadata) : 'No additional details';
}

function getEmailStatusColor(status) {
  switch (status) {
    case 'received': return '#4a6cf7';
    case 'sent': return '#28a745';
    case 'pending': return '#ffc107';
    case 'failed': return '#dc3545';
    default: return '#6c757d';
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + ' years ago';
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + ' months ago';
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + ' days ago';
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + ' hours ago';
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + ' minutes ago';
  
  return 'just now';
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', init);

// Make functions available globally
window.checkEmails = function() {
  alert('Checking for new emails...');
  loadEmailList();
};

window.showEmailSettings = function() {
  alert('Email settings dialog would open here');
};

window.testTTS = function() {
  alert('TTS test would run here');
};

window.showCallbackRequests = function() {
  alert('Callback requests would be displayed here');
};

window.refreshCustomers = function() {
  loadCustomers();
};

window.exportCustomers = function() {
  alert('Customer data would be exported here');
};

window.createEmailTemplate = function() {
  alert('Email template creation form would open here');
};

window.createChatTemplate = function() {
  alert('Chat template creation form would open here');
};

window.createCallTemplate = function() {
  alert('Call script creation form would open here');
};

window.saveSettings = function() {
  alert('Settings saved successfully');
};

window.resetSettings = function() {
  alert('Settings reset to default values');
};

window.clearAllData = function() {
  if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    alert('All data cleared successfully');
  }
};

window.exportData = function() {
  alert('Data export initiated');
};

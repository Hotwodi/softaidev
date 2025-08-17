// Virtual Assistant Admin JavaScript
// Handles admin-specific functionality for the virtual assistant

// Import required modules
import { checkAdminAuth, signOut } from './auth.js';
import { supabase } from './services/supabaseService.js';

// Global variables
let currentUser = null;
let assistantSettings = {
    responseTone: 'professional',
    autoEmailReply: true,
    autoChatGreeting: true,
    privacySettings: {
        storeConversations: true,
        anonymizeData: false,
        retentionDays: 30
    }
};

// Initialize the admin interface
async function initAdminInterface() {
    try {
        // Check admin authentication
        const { isAdmin, session, error } = await checkAdminAuth();
        
        if (!isAdmin || error) {
            window.location.href = 'admin-login.html?redirect=virtual-assistant-admin.html';
            return;
        }
        
        // Set current user
        currentUser = session.user;
        
        // Set up event listeners
        setupEventListeners();
        
        // Load assistant data
        loadAssistantData();
        
        // Update UI with current settings
        updateSettingsUI();
        
        console.log('Admin interface initialized successfully');
    } catch (error) {
        console.error('Error initializing admin interface:', error);
        showNotification('Error initializing interface. Please try again.', 'error');
    }
}

// Set up event listeners for the admin interface
function setupEventListeners() {
    // Response tone selector
    document.getElementById('response-tone').addEventListener('change', updateResponseTone);
    
    // Auto-reply checkboxes
    document.getElementById('auto-email-reply').addEventListener('change', updateAutoReplySettings);
    document.getElementById('auto-chat-greeting').addEventListener('change', updateAutoReplySettings);
    
    // Privacy and security buttons
    document.querySelector('button[onclick="showPrivacySettings()"]').addEventListener('click', showPrivacySettings);
    document.querySelector('button[onclick="exportData()"]').addEventListener('click', exportData);
    
    // Logout link
    document.getElementById('logout-link').addEventListener('click', async function(e) {
        e.preventDefault();
        await signOut();
        window.location.href = 'admin-login.html';
    });
}

// Load assistant data from the database
async function loadAssistantData() {
    try {
        // Get assistant settings
        const { data: settingsData, error: settingsError } = await supabase
            .from('assistant_settings')
            .select('*')
            .single();
        
        if (settingsError) throw settingsError;
        
        if (settingsData) {
            assistantSettings = {
                ...assistantSettings,
                ...settingsData
            };
        }
        
        // Get conversation statistics
        const { data: statsData, error: statsError } = await supabase
            .from('conversation_stats')
            .select('active_conversations, pending_emails')
            .single();
        
        if (statsError) throw statsError;
        
        if (statsData) {
            document.getElementById('active-conversations').textContent = statsData.active_conversations || 0;
            document.getElementById('pending-emails').textContent = statsData.pending_emails || 0;
        }
        
        // Get recent activity
        const { data: activityData, error: activityError } = await supabase
            .from('activity_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (activityError) throw activityError;
        
        if (activityData && activityData.length > 0) {
            updateActivityFeed(activityData);
        }
        
    } catch (error) {
        console.error('Error loading assistant data:', error);
        showNotification('Error loading data. Please refresh the page.', 'error');
    }
}

// Update the activity feed with recent activities
function updateActivityFeed(activities) {
    const activityFeed = document.getElementById('activity-feed');
    activityFeed.innerHTML = ''; // Clear existing activities
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'activity-time';
        timeSpan.textContent = formatActivityTime(activity.created_at);
        
        const typeSpan = document.createElement('span');
        typeSpan.className = `activity-type ${activity.type.toLowerCase()}`;
        typeSpan.textContent = capitalizeFirstLetter(activity.type);
        
        const descSpan = document.createElement('span');
        descSpan.className = 'activity-description';
        descSpan.textContent = activity.description;
        
        activityItem.appendChild(timeSpan);
        activityItem.appendChild(typeSpan);
        activityItem.appendChild(descSpan);
        
        activityFeed.appendChild(activityItem);
    });
}

// Update the UI with current settings
function updateSettingsUI() {
    // Set response tone
    document.getElementById('response-tone').value = assistantSettings.responseTone;
    
    // Set auto-reply checkboxes
    document.getElementById('auto-email-reply').checked = assistantSettings.autoEmailReply;
    document.getElementById('auto-chat-greeting').checked = assistantSettings.autoChatGreeting;
}

// Update response tone setting
async function updateResponseTone() {
    const tone = document.getElementById('response-tone').value;
    assistantSettings.responseTone = tone;
    
    try {
        const { error } = await supabase
            .from('assistant_settings')
            .update({ responseTone: tone })
            .eq('id', 1);
        
        if (error) throw error;
        
        showNotification('Response tone updated successfully', 'success');
    } catch (error) {
        console.error('Error updating response tone:', error);
        showNotification('Error updating response tone', 'error');
    }
}

// Update auto-reply settings
async function updateAutoReplySettings() {
    const autoEmailReply = document.getElementById('auto-email-reply').checked;
    const autoChatGreeting = document.getElementById('auto-chat-greeting').checked;
    
    assistantSettings.autoEmailReply = autoEmailReply;
    assistantSettings.autoChatGreeting = autoChatGreeting;
    
    try {
        const { error } = await supabase
            .from('assistant_settings')
            .update({
                autoEmailReply,
                autoChatGreeting
            })
            .eq('id', 1);
        
        if (error) throw error;
        
        showNotification('Auto-reply settings updated successfully', 'success');
    } catch (error) {
        console.error('Error updating auto-reply settings:', error);
        showNotification('Error updating auto-reply settings', 'error');
    }
}

// Show privacy settings modal
function showPrivacySettings() {
    // Implementation for privacy settings modal
    alert('Privacy settings functionality will be implemented here');
}

// Export conversation data
function exportData() {
    // Implementation for data export
    alert('Data export functionality will be implemented here');
}

// Helper function to format activity time
function formatActivityTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If within the last week, show day and time
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
        return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show date and time
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// Show notification
function showNotification(message, type = 'info') {
    // Implementation for showing notifications
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // You can implement a more sophisticated notification system here
    alert(`${message}`);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAdminInterface);

// Export functions for use in other modules
export {
    updateResponseTone,
    updateAutoReplySettings,
    showPrivacySettings,
    exportData
};

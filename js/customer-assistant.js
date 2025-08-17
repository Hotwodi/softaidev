// Customer Assistant JavaScript
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/umd/supabase.min.js';
import { assistantService, emailService } from './services/assistantService.js';

// Initialize Supabase client
const SUPABASE_URL = 'https://glplnybcdgbyajdgzjrr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdi...';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let conversationId = localStorage.getItem('softaidev_conversation_id') || 'visitor_' + Date.now();
let visitorInfo = JSON.parse(localStorage.getItem('softaidev_visitor_info')) || {
  name: '',
  email: '',
  phone: ''
};
let chatAvailable = true;
let callActive = false;
let callTimer = null;
let callDuration = 0;
let chatSubscription = null;
let isTyping = false;
let typingTimeout = null;

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const emailNameInput = document.getElementById('emailName');
const emailAddressInput = document.getElementById('emailAddress');
const emailSubjectInput = document.getElementById('emailSubject');
const emailMessageInput = document.getElementById('emailMessage');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const callbackNameInput = document.getElementById('callbackName');
const callbackPhoneInput = document.getElementById('callbackPhone');
const callbackReasonSelect = document.getElementById('callbackReason');
const requestCallbackBtn = document.getElementById('requestCallbackBtn');
const startVoipCallBtn = document.getElementById('startVoipCallBtn');
const chatStatusIndicator = document.getElementById('chatStatusIndicator');
const voipCallModal = document.getElementById('voipCallModal');
const closeVoipModal = document.getElementById('closeVoipModal');
const callStatus = document.getElementById('callStatus');
const callTimerElement = document.getElementById('callTimer');
const muteCallBtn = document.getElementById('muteCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const speakerCallBtn = document.getElementById('speakerCallBtn');
const successModal = document.getElementById('successModal');
const successTitle = document.getElementById('successTitle');
const successMessage = document.getElementById('successMessage');
const closeSuccessModal = document.getElementById('closeSuccessModal');
const successOkBtn = document.getElementById('successOkBtn');

// Initialize the assistant
async function init() {
  try {
    // Set up event listeners
    setupEventListeners();
    
    // Check chat availability
    await checkChatAvailability();
    
    // Load previous messages if they exist
    await loadPreviousMessages();
    
    // Subscribe to real-time updates
    setupRealtimeSubscription();
    
    // Send auto greeting after a short delay if this is a new conversation
    if (!localStorage.getItem('softaidev_conversation_started')) {
      setTimeout(() => {
        sendAutoGreeting();
        localStorage.setItem('softaidev_conversation_started', 'true');
      }, 1000);
    }
  } catch (error) {
    console.error('Error initializing assistant:', error);
    showErrorMessage('There was an error connecting to our support system. Please try refreshing the page.');
  }
}

// Set up event listeners
function setupEventListeners() {
  // Tab navigation
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show active tab content
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Chat input
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
  
  sendChatBtn.addEventListener('click', sendChatMessage);
  
  // Email form
  sendEmailBtn.addEventListener('click', sendEmail);
  
  // Call form
  requestCallbackBtn.addEventListener('click', requestCallback);
  startVoipCallBtn.addEventListener('click', startVoipCall);
  
  // VOIP call modal
  closeVoipModal.addEventListener('click', endVoipCall);
  endCallBtn.addEventListener('click', endVoipCall);
  muteCallBtn.addEventListener('click', toggleMute);
  speakerCallBtn.addEventListener('click', toggleSpeaker);
  
  // Success modal
  closeSuccessModal.addEventListener('click', closeSuccessModalHandler);
  successOkBtn.addEventListener('click', closeSuccessModalHandler);
}

// Check chat availability
async function checkChatAvailability() {
  try {
    // Check if support is available by querying Supabase
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'chat_available')
      .single();
    
    if (error) throw error;
    
    // Update chat availability based on server setting
    chatAvailable = data ? data.value === 'true' : true;
  } catch (error) {
    console.error('Error checking chat availability:', error);
    // Default to available if there's an error
    chatAvailable = true;
  }
  
  // Update status indicator
  updateChatStatus(chatAvailable);
}

// Update chat status indicator
function updateChatStatus(isAvailable) {
  const statusDot = chatStatusIndicator.querySelector('.status-dot');
  const statusText = chatStatusIndicator.querySelector('.status-text');
  
  if (isAvailable) {
    statusDot.className = 'status-dot online';
    statusText.textContent = 'Support Online';
  } else {
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'Support Offline';
  }
}

// Send auto greeting
async function sendAutoGreeting() {
  // Check if we already have messages
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages.children.length > 1) return;
  
  const greeting = "Hello! Welcome to SoftAIDev support. How can I assist you today?";
  
  try {
    // Save greeting to database
    await assistantService.saveChatMessage({
      conversationId,
      sender: 'assistant',
      message: greeting,
      visitorInfo
    });
  } catch (error) {
    console.error('Error sending auto greeting:', error);
    // Still show the greeting in UI even if saving fails
  }
}

// Send chat message
async function sendChatMessage() {
  const message = chatInput.value.trim();
  if (!message) return;
  
  // Disable input while sending
  chatInput.disabled = true;
  sendChatBtn.disabled = true;
  
  // Add message to UI
  addChatMessage('visitor', message);
  
  // Clear input
  chatInput.value = '';
  
  // Save visitor info to localStorage
  localStorage.setItem('softaidev_conversation_id', conversationId);
  localStorage.setItem('softaidev_visitor_info', JSON.stringify(visitorInfo));
  
  // Show typing indicator
  showTypingIndicator();
  
  // Save message to database
  try {
    await assistantService.saveChatMessage({
      conversationId,
      sender: 'visitor',
      message,
      visitorInfo
    });
    
    // If we're not using real-time updates, simulate response
    if (!chatSubscription) {
      // Simulate assistant response after a short delay
      setTimeout(() => {
        simulateAssistantResponse(message);
      }, 1000);
    }
    
    // The real response will come through the subscription
  } catch (error) {
    console.error('Error saving chat message:', error);
    hideTypingIndicator();
    addChatMessage('assistant', 'Sorry, there was an error sending your message. Please try again.');
  } finally {
    // Re-enable input
    chatInput.disabled = false;
    sendChatBtn.disabled = false;
    chatInput.focus();
  }
}

// Add chat message to UI
function addChatMessage(sender, message) {
  // Hide typing indicator if it's an assistant message
  if (sender === 'assistant') {
    hideTypingIndicator();
  }
  
  const messageElement = document.createElement('div');
  messageElement.className = `chat-message ${sender}`;
  
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Safely escape HTML to prevent XSS
  const safeMessage = escapeHtml(message);
  
  // Convert URLs to clickable links
  const messageWithLinks = convertLinksToAnchors(safeMessage);
  
  messageElement.innerHTML = `
    <div class="message-bubble">
      <p>${messageWithLinks}</p>
    </div>
    <div class="message-time">${timeString}</div>
  `;
  
  chatMessages.appendChild(messageElement);
  
  // Scroll to bottom
  scrollToBottom();
}

// Simulate assistant response
async function simulateAssistantResponse(userMessage) {
  let response;
  
  // Simple response logic based on user message
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    response = "Hello! How can I help you today?";
  } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
    response = "I'm here to help! Could you please tell me more about what you need assistance with?";
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
    response = "Our pricing depends on the specific services you're interested in. Would you like me to provide our standard pricing packages, or do you have a specific service in mind?";
  } else if (lowerMessage.includes('contact') || lowerMessage.includes('email') || lowerMessage.includes('phone')) {
    response = "You can reach our team via email at customer.support@softaidev.com or by phone at 360-972-1924. Is there something specific you'd like us to help you with?";
  } else if (lowerMessage.includes('thank')) {
    response = "You're welcome! Is there anything else I can help you with today?";
  } else {
    response = "Thank you for your message. One of our support representatives will review your question and get back to you shortly. Is there anything else you'd like to know in the meantime?";
  }
  
  // Add response to UI
  addChatMessage('assistant', response);
  
  // Save response to database
  try {
    await assistantService.saveChatMessage({
      conversationId,
      sender: 'assistant',
      message: response
    });
  } catch (error) {
    console.error('Error saving assistant response:', error);
    showErrorMessage('There was an error saving the response. Please refresh the page if the conversation seems incomplete.');
  }
}

// Send email
async function sendEmail() {
  const name = emailNameInput.value.trim();
  const email = emailAddressInput.value.trim();
  const subject = emailSubjectInput.value.trim();
  const message = emailMessageInput.value.trim();
  
  // Validate inputs
  if (!name || !email || !subject || !message) {
    alert('Please fill in all fields');
    return;
  }
  
  if (!isValidEmail(email)) {
    alert('Please enter a valid email address');
    return;
  }
  
  // Update visitor info
  visitorInfo.name = name;
  visitorInfo.email = email;
  
  // Send email
  try {
    await emailService.sendEmail({
      to: 'customer.support@softaidev.com',
      from: email,
      subject: `[Website Contact] ${subject}`,
      body: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      replyTo: email
    });
    
    // Show success message
    showSuccessModal('Email Sent', 'Your message has been sent successfully. We will get back to you as soon as possible.');
    
    // Clear form
    emailNameInput.value = '';
    emailAddressInput.value = '';
    emailSubjectInput.value = '';
    emailMessageInput.value = '';
    
    // Send auto-reply
    try {
      await emailService.sendAutoReply({
        originalEmail: email,
        customerName: name,
        emailType: 'general'
      });
    } catch (error) {
      console.error('Error sending auto-reply:', error);
    }
  } catch (error) {
    console.error('Error sending email:', error);
    alert('There was an error sending your message. Please try again later.');
  }
}

// Request callback
async function requestCallback() {
  const name = callbackNameInput.value.trim();
  const phone = callbackPhoneInput.value.trim();
  const reason = callbackReasonSelect.value;
  
  // Validate inputs
  if (!name || !phone) {
    alert('Please fill in all fields');
    return;
  }
  
  if (!isValidPhone(phone)) {
    alert('Please enter a valid phone number');
    return;
  }
  
  // Update visitor info
  visitorInfo.name = name;
  visitorInfo.phone = phone;
  
  // Save callback request
  try {
    await assistantService.saveCallRecord({
      callId: 'callback_' + Date.now(),
      phoneNumber: phone,
      customerName: name,
      callType: 'callback_request',
      status: 'pending',
      duration: 0,
      summary: `Callback requested for ${reason} inquiry`,
      callbackRequest: {
        reason,
        requestTime: new Date().toISOString()
      }
    });
    
    // Show success message
    showSuccessModal('Callback Requested', 'Your callback request has been submitted. One of our representatives will call you as soon as possible.');
    
    // Clear form
    callbackNameInput.value = '';
    callbackPhoneInput.value = '';
    callbackReasonSelect.value = 'general';
  } catch (error) {
    console.error('Error requesting callback:', error);
    alert('There was an error submitting your callback request. Please try again later.');
  }
}

// Start VOIP call
function startVoipCall() {
  // In a real implementation, this would initiate a WebRTC call
  // For now, we'll just simulate it
  callActive = true;
  callDuration = 0;
  
  // Show call modal
  voipCallModal.style.display = 'flex';
  
  // Update call status
  callStatus.textContent = 'Connecting...';
  
  // Simulate connecting
  setTimeout(() => {
    callStatus.textContent = 'Connected';
    
    // Start call timer
    startCallTimer();
    
    // Save call record
    assistantService.saveCallRecord({
      callId: 'voip_' + Date.now(),
      phoneNumber: 'VOIP',
      customerName: visitorInfo.name || 'Website Visitor',
      callType: 'incoming',
      status: 'in_progress',
      duration: 0,
      summary: 'VOIP call from website'
    }).catch(error => {
      console.error('Error saving call record:', error);
    });
  }, 2000);
}

// End VOIP call
function endVoipCall() {
  if (callActive) {
    // Stop call timer
    stopCallTimer();
    
    // Update call status
    callStatus.textContent = 'Call ended';
    
    // Update call record
    assistantService.updateCallStatus('voip_' + Date.now(), 'completed', 'VOIP call completed').catch(error => {
      console.error('Error updating call status:', error);
    });
    
    // Reset call state
    callActive = false;
  }
  
  // Hide call modal
  voipCallModal.style.display = 'none';
}

// Toggle mute
function toggleMute() {
  // In a real implementation, this would mute the call
  // For now, we'll just toggle the button state
  muteCallBtn.classList.toggle('active');
  
  const icon = muteCallBtn.querySelector('.control-icon');
  const label = muteCallBtn.querySelector('.control-label');
  
  if (muteCallBtn.classList.contains('active')) {
    icon.textContent = '🔊';
    label.textContent = 'Unmute';
  } else {
    icon.textContent = '🔇';
    label.textContent = 'Mute';
  }
}

// Toggle speaker
function toggleSpeaker() {
  // In a real implementation, this would toggle speaker mode
  // For now, we'll just toggle the button state
  speakerCallBtn.classList.toggle('active');
  
  const label = speakerCallBtn.querySelector('.control-label');
  
  if (speakerCallBtn.classList.contains('active')) {
    label.textContent = 'Headset';
  } else {
    label.textContent = 'Speaker';
  }
}

// Start call timer
function startCallTimer() {
  callTimer = setInterval(() => {
    callDuration++;
    updateCallTimerDisplay();
  }, 1000);
}

// Stop call timer
function stopCallTimer() {
  if (callTimer) {
    clearInterval(callTimer);
    callTimer = null;
  }
}

// Update call timer display
function updateCallTimerDisplay() {
  const minutes = Math.floor(callDuration / 60).toString().padStart(2, '0');
  const seconds = (callDuration % 60).toString().padStart(2, '0');
  callTimerElement.textContent = `${minutes}:${seconds}`;
}

// Show success modal
function showSuccessModal(title, message) {
  successTitle.textContent = title;
  successMessage.textContent = message;
  successModal.style.display = 'flex';
}

// Close success modal
function closeSuccessModalHandler() {
  successModal.style.display = 'none';
}

// Validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number
function isValidPhone(phone) {
  // Simple validation - at least 10 digits
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
}

// Load previous messages
async function loadPreviousMessages() {
  try {
    // Only load if we have a conversation ID
    if (!conversationId) return;
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      // Clear any existing messages
      chatMessages.innerHTML = '';
      
      // Add messages to UI
      data.forEach(msg => {
        addChatMessage(msg.sender, msg.message);
      });
    }
  } catch (error) {
    console.error('Error loading previous messages:', error);
    showErrorMessage('Could not load previous messages. Starting a new conversation.');
    // Reset conversation ID to start fresh
    conversationId = 'visitor_' + Date.now();
    localStorage.setItem('softaidev_conversation_id', conversationId);
  }
}

// Setup real-time subscription
function setupRealtimeSubscription() {
  try {
    // Unsubscribe from any existing subscription
    if (chatSubscription) {
      supabase.removeSubscription(chatSubscription);
    }
    
    // Subscribe to new messages for this conversation
    chatSubscription = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        payload => {
          // Only add message to UI if it's from the assistant (visitor messages are added manually)
          if (payload.new && payload.new.sender === 'assistant') {
            addChatMessage('assistant', payload.new.message);
          }
        }
      )
      .subscribe();
  } catch (error) {
    console.error('Error setting up real-time subscription:', error);
  }
}

// Show typing indicator
function showTypingIndicator() {
  if (isTyping) return;
  
  isTyping = true;
  
  const typingElement = document.createElement('div');
  typingElement.className = 'chat-message assistant typing';
  typingElement.innerHTML = `
    <div class="message-bubble">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  
  chatMessages.appendChild(typingElement);
  scrollToBottom();
  
  // Auto-hide after 30 seconds if no response
  typingTimeout = setTimeout(() => {
    hideTypingIndicator();
  }, 30000);
}

// Hide typing indicator
function hideTypingIndicator() {
  isTyping = false;
  clearTimeout(typingTimeout);
  
  const typingElement = document.querySelector('.chat-message.typing');
  if (typingElement) {
    typingElement.remove();
  }
}

// Scroll chat to bottom
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show error message
function showErrorMessage(message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  
  // Insert at top of chat container
  const chatContainer = document.querySelector('.chat-container');
  chatContainer.insertBefore(errorElement, chatContainer.firstChild);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    errorElement.remove();
  }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Convert URLs to clickable links
function convertLinksToAnchors(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
}

// Initialize the assistant when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

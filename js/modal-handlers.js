// Modal Control Functions for Virtual Assistant

// Chat Modal Functions
function openChatWindow() {
    const modal = document.getElementById('chat-modal');
    if (modal) {
        modal.style.display = 'block';
        
        // Focus on input field
        setTimeout(() => {
            const input = document.getElementById('chat-input');
            if (input) input.focus();
        }, 100);
        
        // Add initial greeting if chat is empty
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages && chatMessages.children.length === 0) {
            const greeting = document.createElement('div');
            greeting.className = 'chat-message assistant';
            greeting.innerHTML = `
                <div class="message-sender">Assistant</div>
                <div class="message-content">Hello! How can I help you today?</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            `;
            chatMessages.appendChild(greeting);
        }
        
        // Log activity
        if (window.addActivity) {
            window.addActivity('chat', 'Chat window opened');
        }
    }
}

function closeChatModal() {
    const modal = document.getElementById('chat-modal');
    if (modal) {
        modal.style.display = 'none';
        
        // Log activity
        if (window.addActivity) {
            window.addActivity('chat', 'Chat window closed');
        }
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    const chatMessages = document.getElementById('chat-messages');
    
    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user';
    userMessage.innerHTML = `
        <div class="message-sender">You</div>
        <div class="message-content">${message}</div>
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;
    chatMessages.appendChild(userMessage);
    
    // Clear input
    input.value = '';
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Try to use the actual chat service if available
    if (window.assistantService && typeof window.assistantService.saveChatMessage === 'function') {
        // Generate a unique conversation ID if not exists
        if (!window.currentConversationId) {
            window.currentConversationId = `conv-${Date.now()}`;
        }
        
        const chatData = {
            conversationId: window.currentConversationId,
            sender: 'visitor',
            message: message,
            visitorName: 'Website Visitor',
            visitorEmail: 'visitor@example.com'
        };
        
        window.assistantService.saveChatMessage(chatData)
            .then(() => {
                console.log('Chat message saved to database');
                
                // Log activity
                if (window.addActivity) {
                    window.addActivity('chat', 'User sent a message');
                }
            })
            .catch(error => {
                console.error('Failed to save chat message:', error);
            });
    } else {
        // Log activity
        if (window.addActivity) {
            window.addActivity('chat', 'User sent a message');
        }
    }
    
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
        
        const assistantMessage = document.createElement('div');
        assistantMessage.className = 'chat-message assistant';
        assistantMessage.innerHTML = `
            <div class="message-sender">Assistant</div>
            <div class="message-content">${response}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        chatMessages.appendChild(assistantMessage);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Save assistant response if service available
        if (window.assistantService && typeof window.assistantService.saveChatMessage === 'function') {
            const replyData = {
                conversationId: window.currentConversationId,
                sender: 'assistant',
                message: response
            };
            
            window.assistantService.saveChatMessage(replyData)
                .then(() => {
                    console.log('Assistant response saved to database');
                })
                .catch(error => {
                    console.error('Failed to save assistant response:', error);
                });
        }
        
        // Log activity
        if (window.addActivity) {
            window.addActivity('chat', 'Assistant responded to message');
        }
    }, 1000);
}

// Email Modal Functions
function showEmailForm() {
    const modal = document.getElementById('email-modal');
    if (modal) {
        modal.style.display = 'block';
        
        // Focus on first input field
        setTimeout(() => {
            const input = document.getElementById('email-name');
            if (input) input.focus();
        }, 100);
        
        // Log activity
        if (window.addActivity) {
            window.addActivity('email', 'Email form opened');
        }
    }
}

function closeEmailModal() {
    const modal = document.getElementById('email-modal');
    if (modal) {
        modal.style.display = 'none';
        
        // Log activity
        if (window.addActivity) {
            window.addActivity('email', 'Email form closed');
        }
    }
}

function sendEmail() {
    const name = document.getElementById('email-name').value.trim();
    const email = document.getElementById('email-address').value.trim();
    const subject = document.getElementById('email-subject').value.trim();
    const message = document.getElementById('email-message').value.trim();
    const statusElement = document.getElementById('email-status');
    
    // Validate form
    if (!name || !email || !subject || !message) {
        statusElement.textContent = 'Please fill in all required fields.';
        statusElement.className = 'status-message notification error';
        statusElement.style.display = 'block';
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        statusElement.textContent = 'Please enter a valid email address.';
        statusElement.className = 'status-message notification error';
        statusElement.style.display = 'block';
        return;
    }
    
    // Show sending status
    statusElement.textContent = 'Sending your message...';
    statusElement.className = 'status-message notification';
    statusElement.style.display = 'block';
    
    // Try to use the actual email service if available
    if (window.emailService && typeof window.emailService.sendEmail === 'function') {
        const emailData = {
            from_name: name,
            from_email: email,
            subject: subject,
            body: message,
            status: 'received'
        };
        
        window.emailService.sendEmail(emailData)
            .then(() => {
                // Show success message
                statusElement.textContent = 'Your message has been sent successfully! We will respond within 24 hours.';
                statusElement.className = 'status-message notification success';
                
                // Clear form
                document.getElementById('email-name').value = '';
                document.getElementById('email-address').value = '';
                document.getElementById('email-subject').value = '';
                document.getElementById('email-message').value = '';
                
                // Log activity
                if (window.addActivity) {
                    window.addActivity('email', `Email sent from ${name} (${email})`);
                }
                
                // Close modal after delay
                setTimeout(() => {
                    closeEmailModal();
                }, 3000);
            })
            .catch(error => {
                console.error('Email sending failed:', error);
                statusElement.textContent = 'Failed to send email. Please try again later.';
                statusElement.className = 'status-message notification error';
            });
    } else {
        // Simulate sending email if service not available
        setTimeout(() => {
            // Show success message
            statusElement.textContent = 'Your message has been sent successfully! We will respond within 24 hours.';
            statusElement.className = 'status-message notification success';
            
            // Clear form
            document.getElementById('email-name').value = '';
            document.getElementById('email-address').value = '';
            document.getElementById('email-subject').value = '';
            document.getElementById('email-message').value = '';
            
            // Log activity
            if (window.addActivity) {
                window.addActivity('email', `Email sent from ${name} (${email})`);
            }
            
            // Close modal after delay
            setTimeout(() => {
                closeEmailModal();
            }, 3000);
        }, 1500);
    }
}

// Callback Modal Functions
function requestCallback() {
    const modal = document.getElementById('callback-modal');
    if (modal) {
        modal.style.display = 'block';
        
        // Focus on first input field
        setTimeout(() => {
            const input = document.getElementById('callback-name');
            if (input) input.focus();
        }, 100);
        
        // Log activity
        if (window.addActivity) {
            window.addActivity('call', 'Callback form opened');
        }
    }
}

function closeCallbackModal() {
    const modal = document.getElementById('callback-modal');
    if (modal) {
        modal.style.display = 'none';
        
        // Log activity
        if (window.addActivity) {
            window.addActivity('call', 'Callback form closed');
        }
    }
}

function submitCallback() {
    const name = document.getElementById('callback-name').value.trim();
    const phone = document.getElementById('callback-phone').value.trim();
    const time = document.getElementById('callback-time').value;
    const reason = document.getElementById('callback-reason').value.trim();
    const statusElement = document.getElementById('callback-status');
    
    // Validate form
    if (!name || !phone) {
        statusElement.textContent = 'Please fill in all required fields.';
        statusElement.className = 'status-message notification error';
        statusElement.style.display = 'block';
        return;
    }
    
    // Show sending status
    statusElement.textContent = 'Submitting your callback request...';
    statusElement.className = 'status-message notification';
    statusElement.style.display = 'block';
    
    // Try to use the actual assistant service if available
    if (window.assistantService && typeof window.assistantService.saveCall === 'function') {
        const callbackRequest = {
            customer_name: name,
            phone_number: phone,
            callback_request: true,
            call_type: 'incoming',
            status: 'pending',
            notes: reason,
            preferred_time: time,
            timestamp: new Date().toISOString()
        };
        
        window.assistantService.saveCall(callbackRequest)
            .then(() => {
                // Show success message
                statusElement.textContent = 'Your callback request has been submitted successfully! We will call you during your preferred time.';
                statusElement.className = 'status-message notification success';
                
                // Clear form
                document.getElementById('callback-name').value = '';
                document.getElementById('callback-phone').value = '';
                document.getElementById('callback-reason').value = '';
                
                // Log activity
                if (window.addActivity) {
                    window.addActivity('call', `Callback requested by ${name} for ${time}`);
                }
                
                // Close modal after delay
                setTimeout(() => {
                    closeCallbackModal();
                }, 3000);
            })
            .catch(error => {
                console.error('Callback request failed:', error);
                statusElement.textContent = 'Failed to submit callback request. Please try again later.';
                statusElement.className = 'status-message notification error';
            });
    } else {
        // Simulate sending callback request if service not available
        setTimeout(() => {
            // Show success message
            statusElement.textContent = 'Your callback request has been submitted successfully! We will call you during your preferred time.';
            statusElement.className = 'status-message notification success';
            
            // Clear form
            document.getElementById('callback-name').value = '';
            document.getElementById('callback-phone').value = '';
            document.getElementById('callback-reason').value = '';
            
            // Log activity
            if (window.addActivity) {
                window.addActivity('call', `Callback requested by ${name} for ${time}`);
            }
            
            // Close modal after delay
            setTimeout(() => {
                closeCallbackModal();
            }, 3000);
        }, 1500);
    }
}

// Add event listeners for Enter key in input fields
document.addEventListener('DOMContentLoaded', function() {
    // Chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Email input fields
    const emailInputs = ['email-name', 'email-address', 'email-subject', 'email-message'];
    emailInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && id === 'email-message') {
                    sendEmail();
                }
            });
        }
    });
    
    // Callback input fields
    const callbackInputs = ['callback-name', 'callback-phone', 'callback-reason'];
    callbackInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && id === 'callback-reason') {
                    submitCallback();
                }
            });
        }
    });
    
    // Add close button event listeners for modals
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Make sure the buttons are properly initialized
    console.log('Modal handlers initialized');
    console.log('Chat button:', document.getElementById('chat-button'));
    console.log('Email button:', document.getElementById('email-button'));
    console.log('Callback button:', document.getElementById('callback-button'));
});

// Add CSS for modals
const style = document.createElement('style');
style.textContent = `
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0,0,0,0.5);
    }
    
    .modal-content {
        background-color: #fefefe;
        margin: 10% auto;
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        width: 80%;
        max-width: 600px;
        animation: modalFadeIn 0.3s;
    }
    
    .modal-header {
        padding: 1rem;
        background-color: #1a237e;
        color: white;
        border-radius: 8px 8px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .modal-header h3 {
        margin: 0;
    }
    
    .close {
        color: white;
        font-size: 1.5rem;
        font-weight: bold;
        cursor: pointer;
    }
    
    .close:hover {
        color: #ddd;
    }
    
    .chat-messages {
        height: 300px;
        overflow-y: auto;
        padding: 1rem;
        background-color: #f9f9f9;
    }
    
    .chat-message {
        margin-bottom: 1rem;
        padding: 0.75rem;
        border-radius: 8px;
        max-width: 80%;
    }
    
    .chat-message.user {
        background-color: #e3f2fd;
        margin-left: auto;
        margin-right: 0;
    }
    
    .chat-message.assistant {
        background-color: #1a237e;
        color: white;
        margin-left: 0;
        margin-right: auto;
    }
    
    .message-sender {
        font-weight: bold;
        margin-bottom: 0.25rem;
    }
    
    .message-time {
        font-size: 0.8rem;
        opacity: 0.7;
        margin-top: 0.25rem;
        text-align: right;
    }
    
    .chat-input-area {
        display: flex;
        padding: 1rem;
        border-top: 1px solid #eee;
    }
    
    .chat-input-area input {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-right: 0.5rem;
    }
    
    .chat-input-area button {
        background-color: #1a237e;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .email-form, .callback-form {
        padding: 1rem;
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
    }
    
    .form-group input, .form-group textarea, .form-group select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: inherit;
        font-size: 1rem;
    }
    
    @keyframes modalFadeIn {
        from {opacity: 0; transform: translateY(-20px);}
        to {opacity: 1; transform: translateY(0);}
    }
`;

document.head.appendChild(style);

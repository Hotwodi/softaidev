// Email Handler Module with Supabase Integration
import { assistantService, emailService } from './services/assistantService.js';

class EmailHandler {
    constructor() {
        this.emails = [];
        this.supabaseEnabled = false;
        this.templates = {
            'customer-service': {
                subject: 'Re: [Subject of Customer\'s Inquiry]',
                body: `Dear [Customer Name],

Thank you for reaching out to us regarding [brief summary of the issue or request].
We appreciate your contact and are here to help.

[If the issue is straightforward:]
I have reviewed your message and [briefly state action taken or information provided].
[Provide solution, answer, or next steps.]

[If more information is needed:]
To assist you further, could you please provide [any additional details needed]?

If you have any other questions or need further assistance, feel free to reply to this email.
We value your satisfaction and look forward to resolving this for you.

Best regards,
SoftAIDev Virtual Assistant
Customer Support
SoftAIDev - Software Consulting
Email: customersupport@softaidev.com
Phone: 360-972-1924`
            },
            'technical-support': {
                subject: 'Re: Technical Support - [Issue Description]',
                body: `Dear [Customer Name],

Thank you for contacting SoftAIDev technical support regarding [technical issue description].

I understand you're experiencing [summarize technical issue]. Let me help you resolve this.

[Technical Solution Steps:]
1. [First troubleshooting step]
2. [Second troubleshooting step]
3. [Additional steps as needed]

If these steps don't resolve the issue, please provide:
- [Specific technical information needed]
- [System details or error messages]
- [Screenshots if applicable]

Our technical team is committed to resolving your issue promptly.

Best regards,
SoftAIDev Technical Support Team
Email: customersupport@softaidev.com
Phone: 360-972-1924`
            },
            'sales-inquiry': {
                subject: 'Re: Sales Inquiry - [Product/Service]',
                body: `Dear [Customer Name],

Thank you for your interest in SoftAIDev's [product/service mentioned].

I'm excited to help you find the perfect solution for your business needs.

[Product/Service Information:]
- [Key features and benefits]
- [Pricing information if applicable]
- [Implementation timeline]

To provide you with a customized quote and solution:
- [Information needed from customer]
- [Specific requirements to discuss]

I'd be happy to schedule a consultation to discuss your project in detail.
Please let me know your availability for a brief call this week.

Best regards,
SoftAIDev Sales Team
Reggie Washington, President
Email: customersupport@softaidev.com
Phone: 360-972-1924`
            }
        };
        this.autoReplyEnabled = true;
        this.init();
    }

    async init() {
        // Check if Supabase is available
        try {
            if (typeof assistantService !== 'undefined') {
                this.supabaseEnabled = true;
                await this.loadEmailsFromSupabase();
            }
        } catch (error) {
            console.log('Supabase not available, using local storage');
            this.supabaseEnabled = false;
        }
        
        // Simulate initial emails if no Supabase
        if (!this.supabaseEnabled) {
            this.addSampleEmails();
        }
        
        this.updateEmailDisplay();
        
        // Set up periodic email checking
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance every interval
                this.simulateNewEmail();
            }
        }, 30000); // Check every 30 seconds
    }

    addSampleEmails() {
        const sampleEmails = [
            {
                id: 1,
                from: 'john.doe@example.com',
                subject: 'Pricing inquiry for custom software development',
                body: 'Hi, I\'m interested in getting a quote for a custom web application for my business. Can you provide pricing information?',
                timestamp: new Date(Date.now() - 120000), // 2 minutes ago
                read: false,
                replied: false,
                summary: null
            },
            {
                id: 2,
                from: 'sarah.smith@company.com',
                subject: 'Technical support needed',
                body: 'We\'re experiencing issues with the cloud solution you implemented. The system is running slowly and users are reporting timeouts.',
                timestamp: new Date(Date.now() - 300000), // 5 minutes ago
                read: false,
                replied: false,
                summary: null
            }
        ];
        
        this.emails = sampleEmails;
    }

    async loadEmailsFromSupabase() {
        try {
            const emailHistory = await assistantService.getEmailHistory(20);
            this.emails = emailHistory.map(email => ({
                id: email.id,
                from: email.from_email,
                subject: email.subject,
                body: email.body,
                timestamp: new Date(email.timestamp),
                read: email.status !== 'received',
                replied: email.email_type === 'auto_reply',
                summary: email.ai_summary
            }));
        } catch (error) {
            console.error('Failed to load emails from Supabase:', error);
            this.addSampleEmails();
        }
    }

    determineEmailType(email) {
        const subjectLower = email.subject.toLowerCase();
        const bodyLower = email.body.toLowerCase();
        
        if (subjectLower.includes('technical') || subjectLower.includes('support') || 
            bodyLower.includes('error') || bodyLower.includes('bug')) {
            return 'technical';
        } else if (subjectLower.includes('pricing') || subjectLower.includes('quote') || 
                   subjectLower.includes('sales') || bodyLower.includes('cost')) {
            return 'sales';
        }
        return 'general';
    }

    async simulateNewEmail() {
        const subjects = [
            'Question about your services',
            'Partnership opportunity',
            'Technical consultation request',
            'Project timeline inquiry',
            'Support ticket #' + Math.floor(Math.random() * 10000)
        ];
        
        const senders = [
            'client@business.com',
            'info@startup.co',
            'manager@enterprise.org',
            'developer@techfirm.net'
        ];

        const newEmail = {
            id: Date.now(),
            from: senders[Math.floor(Math.random() * senders.length)],
            subject: subjects[Math.floor(Math.random() * subjects.length)],
            body: 'This is a simulated email for demonstration purposes.',
            timestamp: new Date(),
            read: false,
            replied: false,
            summary: null
        };

        // Save to Supabase if available
        if (this.supabaseEnabled) {
            try {
                await assistantService.saveEmailRecord({
                    emailId: newEmail.id.toString(),
                    fromEmail: newEmail.from,
                    toEmail: 'customersupport@softaidev.com',
                    subject: newEmail.subject,
                    body: newEmail.body,
                    emailType: 'incoming',
                    status: 'received'
                });
                
                await assistantService.saveCustomerInfo({
                    email: newEmail.from,
                    name: newEmail.from.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    source: 'email'
                });
            } catch (error) {
                console.error('Failed to save email to Supabase:', error);
            }
        }

        this.emails.unshift(newEmail);
        this.updateEmailDisplay();
        this.updateEmailCount();
        
        // Auto-reply if enabled
        if (this.autoReplyEnabled) {
            setTimeout(async () => {
                await this.autoReply(newEmail.id);
            }, 2000);
        }
    }

    checkEmails() {
        // Simulate checking for new emails
        const checkButton = document.querySelector('.email-controls .btn-primary');
        const originalText = checkButton.textContent;
        checkButton.textContent = 'Checking...';
        checkButton.disabled = true;

        setTimeout(() => {
            // Simulate finding new emails
            if (Math.random() < 0.7) { // 70% chance of new email
                this.simulateNewEmail();
            }
            
            checkButton.textContent = originalText;
            checkButton.disabled = false;
            
            this.addActivity('email', 'Checked for new emails');
        }, 1500);
    }

    summarizeEmail(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (!email) return;

        // Simulate AI summarization
        const summaries = [
            'Customer requesting pricing information for custom software development project.',
            'Technical support request regarding system performance issues.',
            'Business inquiry about partnership opportunities.',
            'Request for project consultation and timeline estimation.',
            'General information request about available services.'
        ];

        email.summary = summaries[Math.floor(Math.random() * summaries.length)];
        email.read = true;
        
        this.updateEmailDisplay();
        this.addActivity('email', `Summarized email from ${email.from}`);
    }

    draftReply(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (!email) return;

        // Determine appropriate template based on email content
        let templateType = 'customer-service';
        if (email.subject.toLowerCase().includes('technical') || 
            email.subject.toLowerCase().includes('support')) {
            templateType = 'technical-support';
        } else if (email.subject.toLowerCase().includes('pricing') || 
                   email.subject.toLowerCase().includes('sales') ||
                   email.subject.toLowerCase().includes('quote')) {
            templateType = 'sales-inquiry';
        }

        const template = this.templates[templateType];
        const reply = this.personalizeTemplate(template, email);
        
        // Show draft reply modal
        this.showDraftReply(email, reply);
        
        this.addActivity('email', `Drafted reply to ${email.from}`);
    }

    personalizeTemplate(template, email) {
        let personalizedBody = template.body;
        let personalizedSubject = template.subject;
        
        // Extract customer name from email (simplified)
        const customerName = email.from.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Replace placeholders
        personalizedBody = personalizedBody.replace(/\[Customer Name\]/g, customerName);
        personalizedSubject = personalizedSubject.replace(/\[Subject of Customer's Inquiry\]/g, email.subject);
        
        // Add context-specific information
        if (email.subject.toLowerCase().includes('pricing')) {
            personalizedBody = personalizedBody.replace(/\[brief summary of the issue or request\]/g, 'your pricing inquiry');
        } else if (email.subject.toLowerCase().includes('technical')) {
            personalizedBody = personalizedBody.replace(/\[brief summary of the issue or request\]/g, 'the technical issue you reported');
        } else {
            personalizedBody = personalizedBody.replace(/\[brief summary of the issue or request\]/g, 'your inquiry');
        }

        return {
            subject: personalizedSubject,
            body: personalizedBody
        };
    }

    showDraftReply(email, reply) {
        // Create and show draft reply modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Draft Reply to ${email.from}</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 1rem;">
                    <div style="margin-bottom: 1rem;">
                        <label><strong>Subject:</strong></label>
                        <input type="text" value="${reply.subject}" style="width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label><strong>Message:</strong></label>
                        <textarea rows="15" style="width: 100%; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace;">${reply.body}</textarea>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn-primary" onclick="emailHandler.sendReply(${email.id}); this.closest('.modal').remove();">Send Reply</button>
                        <button class="btn-secondary" onclick="this.closest('.modal').remove();">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async sendReply(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (!email) return;

        email.replied = true;
        email.read = true;
        
        // Send via email service if available
        if (this.supabaseEnabled && typeof emailService !== 'undefined') {
            try {
                // Check if email service is available
                const { available } = await emailService.checkEmailServiceStatus();
                
                if (!available) {
                    console.warn('Email service is not available. Using fallback method.');
                    this.showNotification('Email service is currently unavailable. Please try again later.', 'warning');
                    return;
                }
                
                // Determine email type for appropriate template
                const emailType = this.determineEmailType(email);
                
                // Extract customer name from email
                const customerName = email.from.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                // Send auto-reply using the email service
                const result = await emailService.sendAutoReply({
                    originalEmail: email.from,
                    customerName: customerName,
                    emailType: emailType
                });
                
                console.log('Auto-reply sent successfully:', result);
                
                // Save customer info
                await assistantService.saveCustomerInfo({
                    email: email.from,
                    name: customerName,
                    phone: null,
                    source: 'email',
                    notes: `Auto-replied to email with subject: ${email.subject}`
                });
                
                this.showNotification('Reply sent successfully!', 'success');
            } catch (error) {
                console.error('Failed to send email via service:', error);
                this.showNotification('Failed to send email. Please try again later.', 'error');
            }
        } else {
            console.warn('Email service not available. Using simulated reply.');
            this.showNotification('Email service not configured. This is a simulation.', 'warning');
        }
        
        this.updateEmailDisplay();
        this.addActivity('email', `Sent reply to ${email.from}`);
    }

    async autoReply(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (!email || email.replied) return;

        // Simulate auto-reply delay
        setTimeout(async () => {
            await this.sendReply(emailId);
            this.addActivity('email', `Auto-replied to ${email.from}`);
        }, 1000);
    }

    updateEmailDisplay() {
        const emailList = document.getElementById('email-list');
        if (!emailList) return;

        emailList.innerHTML = '';
        
        this.emails.forEach(email => {
            const emailItem = document.createElement('div');
            emailItem.className = 'email-item';
            emailItem.innerHTML = `
                <div class="email-header">
                    <strong>${email.from} ${email.read ? '' : '🔵'}</strong>
                    <span class="email-time">${this.formatTime(email.timestamp)}</span>
                </div>
                <div class="email-preview">
                    <strong>${email.subject}</strong>
                    ${email.summary ? `<br><em>Summary: ${email.summary}</em>` : ''}
                </div>
                <div class="email-actions">
                    <button class="btn-small" onclick="emailHandler.summarizeEmail(${email.id})" ${email.summary ? 'disabled' : ''}>
                        ${email.summary ? 'Summarized' : 'Summarize'}
                    </button>
                    <button class="btn-small" onclick="emailHandler.draftReply(${email.id})" ${email.replied ? 'disabled' : ''}>
                        ${email.replied ? 'Replied ✓' : 'Auto Reply'}
                    </button>
                </div>
            `;
            emailList.appendChild(emailItem);
        });
    }

    updateEmailCount() {
        const pendingCount = this.emails.filter(e => !e.replied).length;
        const pendingElement = document.getElementById('pending-emails');
        if (pendingElement) {
            pendingElement.textContent = pendingCount;
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

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        
        // Set background color based on notification type
        let bgColor;
        switch(type) {
            case 'success':
                bgColor = '#4caf50';
                break;
            case 'error':
                bgColor = '#f44336';
                break;
            case 'warning':
                bgColor = '#ff9800';
                break;
            default:
                bgColor = '#2196f3';
        }
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 3000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        notification.textContent = message;
        
        // Add ARIA attributes for accessibility
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        
        document.body.appendChild(notification);
        
        // Remove notification after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 4000);
    }
}

// Global functions for HTML onclick handlers
function refreshEmails() {
    emailHandler.checkEmails();
}

function checkEmails() {
    emailHandler.checkEmails();
}

function showEmailTemplates() {
    document.getElementById('email-template-modal').style.display = 'block';
}

function closeEmailTemplateModal() {
    document.getElementById('email-template-modal').style.display = 'none';
}

function useTemplate(templateType) {
    const template = emailHandler.templates[templateType];
    if (template) {
        // Show template in a new modal for customization
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Email Template: ${templateType.replace('-', ' ').toUpperCase()}</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 1rem;">
                    <div style="margin-bottom: 1rem;">
                        <label><strong>Subject:</strong></label>
                        <input type="text" value="${template.subject}" style="width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label><strong>Template:</strong></label>
                        <textarea rows="20" style="width: 100%; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace;">${template.body}</textarea>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn-primary" onclick="this.closest('.modal').remove();">Use Template</button>
                        <button class="btn-secondary" onclick="this.closest('.modal').remove();">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    closeEmailTemplateModal();
}

// Initialize email handler when DOM is loaded
let emailHandler;
document.addEventListener('DOMContentLoaded', function() {
    emailHandler = new EmailHandler();
});

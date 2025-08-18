// Virtual Assistant Supabase Service
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Get these values from your Supabase project settings
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.SUPABASE_URL || window.SUPABASE_URL;
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY;

// Fallback to development values if not set
const finalSupabaseUrl = supabaseUrl || 'https://your-project-id.supabase.co';
const finalSupabaseKey = supabaseKey || 'your-anon-key';

const supabase = createClient(finalSupabaseUrl, finalSupabaseKey);

export const assistantService = {
  // Chat History Management
  async saveChatMessage({ conversationId, sender, message, visitorInfo = {} }) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        conversation_id: conversationId,
        sender: sender, // 'visitor' or 'assistant'
        message: message,
        visitor_name: visitorInfo.name || null,
        visitor_email: visitorInfo.email || null,
        visitor_phone: visitorInfo.phone || null,
        timestamp: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async getChatHistory(conversationId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getAllChatConversations(limit = 50) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('conversation_id, visitor_name, visitor_email, timestamp')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    // Group by conversation_id and get latest message per conversation
    const conversations = {};
    data.forEach(msg => {
      if (!conversations[msg.conversation_id] || 
          new Date(msg.timestamp) > new Date(conversations[msg.conversation_id].timestamp)) {
        conversations[msg.conversation_id] = msg;
      }
    });
    
    return Object.values(conversations);
  },

  // Call History Management
  async saveCallRecord({ callId, phoneNumber, customerName, callType, status, duration, summary, callbackRequest = null }) {
    const { data, error } = await supabase
      .from('call_history')
      .insert([{
        call_id: callId,
        phone_number: phoneNumber,
        customer_name: customerName,
        call_type: callType, // 'incoming', 'outgoing', 'callback_request'
        status: status, // 'completed', 'missed', 'pending'
        duration: duration,
        summary: summary,
        callback_request: callbackRequest,
        timestamp: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async getCallHistory(limit = 50) {
    const { data, error } = await supabase
      .from('call_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async updateCallStatus(callId, status, summary = null) {
    const updates = { status };
    if (summary) updates.summary = summary;

    const { data, error } = await supabase
      .from('call_history')
      .update(updates)
      .eq('call_id', callId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Email Management
  async saveEmailRecord({ emailId, fromEmail, toEmail, subject, body, emailType, status, aiSummary = null }) {
    const { data, error } = await supabase
      .from('email_history')
      .insert([{
        email_id: emailId,
        from_email: fromEmail,
        to_email: toEmail,
        subject: subject,
        body: body,
        email_type: emailType, // 'incoming', 'outgoing', 'auto_reply'
        status: status, // 'received', 'sent', 'pending', 'failed'
        ai_summary: aiSummary,
        timestamp: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async getEmailHistory(limit = 50) {
    const { data, error } = await supabase
      .from('email_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Activity Feed
  async saveActivity({ activityType, description, relatedId = null, metadata = {} }) {
    const { data, error } = await supabase
      .from('assistant_activities')
      .insert([{
        activity_type: activityType, // 'email', 'chat', 'call', 'system'
        description: description,
        related_id: relatedId,
        metadata: metadata,
        timestamp: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async getActivityFeed(limit = 100) {
    const { data, error } = await supabase
      .from('assistant_activities')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Customer Management
  async saveCustomerInfo({ email, name, phone, source, notes = null }) {
    // Check if customer already exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .or(`email.eq.${email},phone.eq.${phone}`)
      .single();

    if (existing) {
      // Update existing customer
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: name || existing.name,
          phone: phone || existing.phone,
          last_contact: new Date().toISOString(),
          notes: notes || existing.notes
        })
        .eq('id', existing.id)
        .select();

      if (error) throw error;
      return data[0];
    } else {
      // Create new customer
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          email: email,
          name: name,
          phone: phone,
          source: source, // 'chat', 'email', 'call', 'callback_request'
          notes: notes,
          first_contact: new Date().toISOString(),
          last_contact: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return data[0];
    }
  },

  async getCustomers(limit = 100) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('last_contact', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Email Forwarding Queue
  async queueEmailForward({ originalEmail, forwardTo, subject, body, priority = 'normal' }) {
    const { data, error } = await supabase
      .from('email_queue')
      .insert([{
        original_email: originalEmail,
        forward_to: forwardTo,
        subject: subject,
        body: body,
        priority: priority,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async getEmailQueue(status = 'pending') {
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateEmailQueueStatus(id, status, errorMessage = null) {
    const updates = { 
      status,
      processed_at: new Date().toISOString()
    };
    if (errorMessage) updates.error_message = errorMessage;

    const { data, error } = await supabase
      .from('email_queue')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  }
};

// Email Service Integration
export const emailService = {
  // Send email via Resend API through Supabase Edge Function
  async sendEmail({ to, from, subject, body, replyTo = null }) {
    try {
      // Format the email content as HTML if it's plain text
      const emailHtml = body.startsWith('<') ? body : `<p>${body.replace(/\n/g, '<br>')}</p>`;
      
      // Prepare email data for the Supabase function
      const emailData = {
        subject: subject,
        html: emailHtml
      };

      console.log('Sending email via Supabase Edge Function:', emailData);

      // Call Supabase Edge Function for email sending (uses Resend API internally)
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      console.log('Email sent successfully:', data);
      
      // Log email in database
      await assistantService.saveEmailRecord({
        emailId: data?.email_id || 'sent_' + Date.now(),
        fromEmail: emailData.from_email,
        toEmail: to,
        subject: subject,
        body: body,
        emailType: 'outgoing',
        status: 'sent'
      });

      return data;
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // Log failed email
      await assistantService.saveEmailRecord({
        emailId: 'failed_' + Date.now(),
        fromEmail: from || 'customersupport@softaidev.com',
        toEmail: to,
        subject: subject,
        body: body,
        emailType: 'outgoing',
        status: 'failed'
      });
      
      throw error;
    }
  },

  // Check if email service is configured and available
  async checkEmailServiceStatus() {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { check: true }
      });
      
      return { available: !error, error };
    } catch (error) {
      console.error('Email service check failed:', error);
      return { available: false, error };
    }
  },

  // Auto-reply to incoming emails
  async sendAutoReply({ originalEmail, customerName, emailType = 'general' }) {
    const templates = {
      general: {
        subject: 'Re: Thank you for contacting SoftAIDev',
        body: `Dear ${customerName || 'Valued Customer'},

Thank you for reaching out to SoftAIDev. We have received your message and appreciate your interest in our services.

Our team will review your inquiry and respond within 24 hours during business hours (Monday-Friday, 9AM-6PM PST).

For urgent matters, please call us directly at 360-972-1924.

Best regards,
SoftAIDev Customer Support Team
Email: customersupport@softaidev.com
Phone: 360-972-1924
Website: https://softaidev.github.io`
      },
      technical: {
        subject: 'Re: Technical Support Request Received',
        body: `Dear ${customerName || 'Valued Customer'},

Thank you for contacting SoftAIDev technical support. We have received your technical inquiry and our specialists are reviewing your request.

We will respond with a solution or next steps within 24 hours during business hours.

If this is an urgent technical issue affecting your business operations, please call us immediately at 360-972-1924.

Best regards,
SoftAIDev Technical Support Team
Email: customersupport@softaidev.com
Phone: 360-972-1924`
      },
      sales: {
        subject: 'Re: Sales Inquiry - Let\'s Discuss Your Project',
        body: `Dear ${customerName || 'Valued Customer'},

Thank you for your interest in SoftAIDev's software development services. We're excited to learn about your project and explore how we can help bring your vision to life.

Our sales team will contact you within 24 hours to discuss:
- Your project requirements and goals
- Timeline and budget considerations
- Our development process and approach
- Next steps for moving forward

For immediate assistance, please call us at 360-972-1924 or schedule a consultation at your convenience.

Best regards,
SoftAIDev Sales Team
Reggie Washington, President
Email: customersupport@softaidev.com
Phone: 360-972-1924`
      }
    };

    const template = templates[emailType] || templates.general;
    
    return await this.sendEmail({
      to: originalEmail,
      from: 'customersupport@softaidev.com',
      subject: template.subject,
      body: template.body,
      replyTo: 'customersupport@softaidev.com'
    });
  }
};

export default { assistantService, emailService };

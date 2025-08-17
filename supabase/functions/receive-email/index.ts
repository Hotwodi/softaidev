// @ts-ignore: Deno runtime
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore: Deno global
declare const Deno: any

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { from_email, to_email, subject, body, message_id } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract customer name from email
    const customerName = from_email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

    // Save incoming email to database
    const { data: emailRecord, error: emailError } = await supabase
      .from('email_history')
      .insert([{
        email_id: message_id || 'received_' + Date.now(),
        from_email: from_email,
        to_email: to_email,
        subject: subject,
        body: body,
        email_type: 'incoming',
        status: 'received',
        timestamp: new Date().toISOString()
      }])
      .select()
      .single()

    if (emailError) {
      console.error('Failed to save email:', emailError)
    }

    // Save or update customer information
    const { error: customerError } = await supabase
      .from('customers')
      .upsert([{
        email: from_email,
        name: customerName,
        source: 'email',
        last_contact: new Date().toISOString(),
        first_contact: new Date().toISOString()
      }], {
        onConflict: 'email',
        ignoreDuplicates: false
      })

    if (customerError) {
      console.error('Failed to save customer:', customerError)
    }

    // Determine email type for appropriate auto-reply
    let emailType = 'general'
    const subjectLower = subject.toLowerCase()
    const bodyLower = body.toLowerCase()

    if (subjectLower.includes('technical') || subjectLower.includes('support') || 
        bodyLower.includes('error') || bodyLower.includes('bug') || bodyLower.includes('issue')) {
      emailType = 'technical'
    } else if (subjectLower.includes('pricing') || subjectLower.includes('quote') || 
               subjectLower.includes('sales') || bodyLower.includes('cost') || 
               bodyLower.includes('price')) {
      emailType = 'sales'
    }

    // Generate AI summary (simplified version)
    let aiSummary = ''
    if (body.length > 100) {
      if (emailType === 'technical') {
        aiSummary = 'Technical support request regarding system issues'
      } else if (emailType === 'sales') {
        aiSummary = 'Sales inquiry about pricing and services'
      } else {
        aiSummary = 'General customer inquiry'
      }
    }

    // Update email record with AI summary
    if (aiSummary && emailRecord) {
      await supabase
        .from('email_history')
        .update({ ai_summary: aiSummary })
        .eq('id', emailRecord.id)
    }

    // Send auto-reply
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      const templates = {
        general: {
          subject: 'Re: Thank you for contacting SoftAIDev',
          body: `Dear ${customerName},

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
          body: `Dear ${customerName},

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
          body: `Dear ${customerName},

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
      }

      const template = templates[emailType]

      // Send auto-reply
      const autoReplyResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SoftAIDev Customer Support <customersupport@softaidev.com>',
          to: [from_email],
          subject: template.subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(90deg, #1a237e 0%, #3949ab 100%); color: white; padding: 20px; text-align: center;">
                <h2>SoftAIDev</h2>
                <p>Software Consulting & Solutions</p>
              </div>
              <div style="padding: 20px; background: #f9f9f9;">
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  ${template.body.replace(/\n/g, '<br>')}
                </div>
              </div>
              <div style="background: #1a237e; color: white; padding: 15px; text-align: center; font-size: 0.9rem;">
                <p>SoftAIDev - Expert Software Consulting</p>
                <p>📧 customersupport@softaidev.com | 📞 360-972-1924</p>
                <p>🌐 <a href="https://softaidev.github.io" style="color: #ffd600;">softaidev.github.io</a></p>
              </div>
            </div>
          `,
          reply_to: 'customersupport@softaidev.com'
        }),
      })

      if (autoReplyResponse.ok) {
        const replyResult = await autoReplyResponse.json()
        
        // Log auto-reply
        await supabase
          .from('email_history')
          .insert([{
            email_id: replyResult.id || 'auto_reply_' + Date.now(),
            from_email: 'customersupport@softaidev.com',
            to_email: from_email,
            subject: template.subject,
            body: template.body,
            email_type: 'auto_reply',
            status: 'sent',
            timestamp: new Date().toISOString()
          }])
      }
    }

    // Forward to customersupport@softaidev.com
    if (resendApiKey && to_email !== 'customersupport@softaidev.com') {
      const forwardResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SoftAIDev Assistant <customersupport@softaidev.com>',
          to: ['customersupport@softaidev.com'],
          subject: `[INCOMING] ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #4caf50; color: white; padding: 15px;">
                <h3>📧 New Customer Email</h3>
                <p><strong>From:</strong> ${from_email}</p>
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Type:</strong> ${emailType.toUpperCase()}</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                ${aiSummary ? `<p><strong>AI Summary:</strong> ${aiSummary}</p>` : ''}
              </div>
              <div style="padding: 20px; background: #f9f9f9;">
                <div style="background: white; padding: 20px; border-radius: 8px;">
                  <h4>Subject: ${subject}</h4>
                  <hr>
                  ${body.replace(/\n/g, '<br>')}
                </div>
              </div>
              <div style="background: #1a237e; color: white; padding: 15px; text-align: center;">
                <p>Auto-reply sent: ${emailType} template</p>
                <p>Reply directly to this email to respond to the customer</p>
              </div>
            </div>
          `,
          reply_to: from_email
        }),
      })

      if (forwardResponse.ok) {
        // Log forward
        await supabase
          .from('email_history')
          .insert([{
            email_id: 'forward_' + Date.now(),
            from_email: 'customersupport@softaidev.com',
            to_email: 'customersupport@softaidev.com',
            subject: `[INCOMING] ${subject}`,
            body: `Forwarded email from: ${from_email}\n\n${body}`,
            email_type: 'forward',
            status: 'sent',
            timestamp: new Date().toISOString()
          }])
      }
    }

    // Log activity
    await supabase
      .from('assistant_activities')
      .insert([{
        activity_type: 'email',
        description: `Received email from ${customerName} (${from_email})`,
        related_id: emailRecord?.id,
        metadata: { email_type: emailType, ai_summary: aiSummary },
        timestamp: new Date().toISOString()
      }])

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email processed successfully',
        email_type: emailType,
        ai_summary: aiSummary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Email receive function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

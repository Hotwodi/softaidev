// @ts-ignore: Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore: Deno global
declare const Deno: any

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to_email, from_email, subject, message, reply_to } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Email service configuration (using Resend API)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Send email via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from_email || 'SoftAIDev Assistant <customersupport@softaidev.com>',
        to: [to_email],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(90deg, #1a237e 0%, #3949ab 100%); color: white; padding: 20px; text-align: center;">
              <h2>SoftAIDev</h2>
              <p>Software Consulting & Solutions</p>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            <div style="background: #1a237e; color: white; padding: 15px; text-align: center; font-size: 0.9rem;">
              <p>SoftAIDev - Expert Software Consulting</p>
              <p>📧 customersupport@softaidev.com | 📞 360-972-1924</p>
              <p>🌐 <a href="https://softaidev.github.io" style="color: #ffd600;">softaidev.github.io</a></p>
            </div>
          </div>
        `,
        reply_to: reply_to || 'customersupport@softaidev.com'
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      throw new Error(`Email sending failed: ${errorData}`)
    }

    const emailResult = await emailResponse.json()

    // Log email in Supabase
    const { error: dbError } = await supabase
      .from('email_history')
      .insert([{
        email_id: emailResult.id || 'sent_' + Date.now(),
        from_email: from_email || 'customersupport@softaidev.com',
        to_email: to_email,
        subject: subject,
        body: message,
        email_type: 'outgoing',
        status: 'sent',
        timestamp: new Date().toISOString()
      }])

    if (dbError) {
      console.error('Failed to log email in database:', dbError)
    }

    // Forward to customersupport@softaidev.com if not already sending from there
    if (to_email !== 'customersupport@softaidev.com' && !from_email?.includes('customersupport@softaidev.com')) {
      const forwardResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SoftAIDev Assistant <customersupport@softaidev.com>',
          to: ['customersupport@softaidev.com'],
          subject: `[ASSISTANT] ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #ff9800; color: white; padding: 15px;">
                <h3>🤖 Virtual Assistant Email Forward</h3>
                <p><strong>Original Recipient:</strong> ${to_email}</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <div style="padding: 20px; background: #f9f9f9;">
                <div style="background: white; padding: 20px; border-radius: 8px;">
                  <h4>Subject: ${subject}</h4>
                  <hr>
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>
          `,
          reply_to: 'customersupport@softaidev.com'
        }),
      })

      if (forwardResponse.ok) {
        // Log forward email
        await supabase
          .from('email_history')
          .insert([{
            email_id: 'forward_' + Date.now(),
            from_email: 'customersupport@softaidev.com',
            to_email: 'customersupport@softaidev.com',
            subject: `[ASSISTANT] ${subject}`,
            body: `Forward of email sent to: ${to_email}\n\n${message}`,
            email_type: 'forward',
            status: 'sent',
            timestamp: new Date().toISOString()
          }])
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        email_id: emailResult.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Email function error:', error)
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

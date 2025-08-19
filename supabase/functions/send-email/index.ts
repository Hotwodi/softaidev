// @ts-ignore: Deno runtime
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  try {
    console.log('=== NEW REQUEST ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Verify Origin - only allow requests from your domain
    const allowedOrigins = [
      'https://hotwodi.github.io',
      'http://localhost:8000'
    ];
    
    const origin = req.headers.get('origin') || '';
    if (origin && !allowedOrigins.some(o => origin.includes(o))) {
      console.error('Origin not allowed:', origin);
      return new Response(
        JSON.stringify({ error: 'Origin not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Raw request body:', JSON.stringify(requestBody, null, 2));
      
      // Handle Supabase client format which wraps the body in a 'body' property
      if (requestBody.body) {
        requestBody = requestBody.body;
        console.log('Extracted body from Supabase client format:', JSON.stringify(requestBody, null, 2));
      }
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize variables with defaults
    let subject = 'New Message from Website';
    let html = '';
    
    // Handle different request formats
    if (requestBody.name && requestBody.email && requestBody.message) {
      // Contact form format
      subject = requestBody.subject || `New Contact from ${requestBody.name}`;
      html = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${requestBody.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${requestBody.email}">${requestBody.email}</a></p>
        ${requestBody.phone ? `<p><strong>Phone:</strong> ${requestBody.phone}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${requestBody.message.replace(/\n/g, '<br>')}</p>
        <p><em>Sent from the website contact form</em></p>
      `;
    } else if (requestBody.html) {
      // Direct HTML format
      html = requestBody.html;
      subject = requestBody.subject || subject;
    } else if (requestBody.message) {
      // Simple message format
      html = `<p>${requestBody.message.replace(/\n/g, '<br>')}</p>`;
      subject = requestBody.subject || subject;
    } else {
      console.error('Invalid request format:', requestBody);
      return new Response(
        JSON.stringify({ error: 'Invalid request format. Must include name/email/message or html content.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Processing email with subject:', subject);

    // Get Resend API key from environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('Resend API key not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get email addresses from environment variables
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev';
    const toEmail = Deno.env.get('TO_EMAIL') || 'customer.support@softaidev.com';
    const bccEmail = Deno.env.get('BCC_EMAIL');
    
    console.log('Sending email:', { fromEmail, toEmail, bccEmail });
    
    // Prepare email data
    const emailData: any = {
      from: fromEmail,
      to: toEmail,
      subject,
      html
    };
    
    // Add BCC if configured
    if (bccEmail) {
      emailData.bcc = bccEmail;
    }
    
    // Send email
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();
    console.log('Resend API response:', {
      status: response.status,
      statusText: response.statusText,
      result
    });

    if (!response.ok) {
      throw new Error(result.message || `Failed to send email (${response.status})`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        email_id: result.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('ERROR DETAILS:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { 
        status: error.message.includes('Missing') ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
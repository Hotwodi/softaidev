// @ts-ignore: Deno runtime
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    console.log('=== NEW REQUEST ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Verify Authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', requestBody);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      throw new Error('Invalid JSON in request body');
    }

    // Handle different request formats from various frontend components
    let subject = 'Test Email';
    let html = '<h1>Hello from SoftAIDev!</h1>';
    
    // Format 1: Direct subject and html fields
    if (requestBody.subject) subject = requestBody.subject;
    if (requestBody.html) html = requestBody.html;
    
    // Format 2: Old format with message field
    if (requestBody.message && !requestBody.html) {
      html = `<p>${requestBody.message.replace(/\n/g, '<br>')}</p>`;
    }
    
    // Format 3: Contact form with name, email, message fields
    if (requestBody.name && requestBody.email && requestBody.message) {
      subject = requestBody.subject || 'New Contact Form Submission';
      html = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${requestBody.name}</p>
        <p><strong>Email:</strong> ${requestBody.email}</p>
        <p><strong>Message:</strong></p>
        <p>${requestBody.message.replace(/\n/g, '<br>')}</p>
      `;
    }
    
    console.log('Processing email with subject:', subject);

    // Hardcoded Resend API key
    const resendApiKey = "re_SAUZzGpT_JrwW1d4jNinSwXwLovAR7xcp";
    console.log('Using Resend API Key');

    // Send email with BCC to your personal email
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'customer.support@softaidev.com',
        bcc: 'hotwodi@gmail.com',  // Add your personal email here
        subject,
        html
      }),
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
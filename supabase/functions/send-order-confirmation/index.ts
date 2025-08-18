// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// This is a Supabase Edge Function - it runs in a Deno environment
// The Deno namespace is available globally in this context

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Parse the request body
    const { email, order_id, app_name, download_url, purchase_date, amount, customer_name } = await req.json();

    // Validate required fields
    if (!email || !order_id || !app_name || !download_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create download link that expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const { data: signedUrl, error: urlError } = await supabaseClient
      .storage
      .from('downloads')
      .createSignedUrl(download_url, 60 * 60 * 24 * 7); // 7 days

    if (urlError) throw urlError;

    // Prepare email content
    const emailContent = `
      <h2>Thank you for your order, ${customer_name}!</h2>
      <p>Your order #${order_id} has been confirmed.</p>
      
      <h3>Order Details:</h3>
      <p><strong>Product:</strong> ${app_name}</p>
      <p><strong>Order Number:</strong> ${order_id}</p>
      <p><strong>Purchase Date:</strong> ${purchase_date}</p>
      <p><strong>Amount:</strong> ${amount}</p>
      
      <h3>Download Instructions:</h3>
      <p>Click the button below to download your purchase. This link will expire in 7 days.</p>
      <a href="${signedUrl?.signedUrl}" style="display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0;">
        Download ${app_name}
      </a>
      
      <p>If you have any questions about your order, please reply to this email or contact our support team.</p>
      
      <p>Thank you for your business!</p>
      <p>The Tutankaten Team</p>
    `;

    // Send email using Supabase Auth's built-in email service
    const { data: emailData, error: emailError } = await supabaseClient.functions.invoke('send-email', {
      body: JSON.stringify({
        to: email,
        subject: `Your Order #${order_id} Confirmation`,
        html: emailContent,
      }),
    });

    if (emailError) throw emailError;

    return new Response(
      JSON.stringify({ success: true, message: 'Order confirmation email sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

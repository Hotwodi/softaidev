# Virtual Assistant Deployment Guide

This guide will help you deploy the Virtual Assistant system with Supabase integration and email forwarding to `customersupport@softaidev.com`.

## Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Resend Account**: Sign up at [resend.com](https://resend.com) for email API
3. **Domain Access**: Access to configure DNS/email settings for your domain

## Step 1: Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands from `supabase/database-schema.md` to create all required tables
4. Enable Row Level Security (RLS) as specified in the schema file

## Step 2: Deploy Supabase Edge Functions

### Deploy send-email function:
```bash
supabase functions deploy send-email --project-ref YOUR_PROJECT_REF
```

### Deploy receive-email function:
```bash
supabase functions deploy receive-email --project-ref YOUR_PROJECT_REF
```

## Step 3: Configure Environment Variables

In your Supabase dashboard, go to Edge Functions → Settings and add:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
```

## Step 4: Set Up Email Domain in Resend

1. Add your domain to Resend
2. Configure DNS records as instructed by Resend
3. Verify domain ownership
4. Set `customersupport@softaidev.com` as a verified sender

## Step 5: Configure Email Forwarding

### Option A: Using Resend Webhooks (Recommended)
1. In Resend dashboard, go to Webhooks
2. Add webhook URL: `https://your-project-ref.supabase.co/functions/v1/receive-email`
3. Select events: `email.delivered`, `email.bounced`, `email.complained`

### Option B: Email Provider Forwarding
Configure your email provider to forward all emails to:
`https://your-project-ref.supabase.co/functions/v1/receive-email`

## Step 6: Update Frontend Configuration

1. Update `js/services/supabaseService.js` with your Supabase URL and anon key
2. Ensure all script imports are configured as modules in `virtual-assistant.html`

## Step 7: Test the System

### Test Email Sending:
```javascript
// In browser console on virtual-assistant.html
assistantService.sendEmail({
    to: 'test@example.com',
    subject: 'Test Email',
    body: 'This is a test email from the virtual assistant.'
});
```

### Test Chat Storage:
1. Open virtual-assistant.html
2. Start a chat conversation
3. Check Supabase dashboard to verify messages are stored

### Test Email Forwarding:
1. Send an email to any address that should forward to customersupport@softaidev.com
2. Check the email_history table in Supabase
3. Verify auto-reply was sent

## Step 8: Configure Email Auto-Reply Templates

The system includes these auto-reply templates:
- **Support Request**: For technical support inquiries
- **Sales Inquiry**: For pricing and sales questions  
- **General Inquiry**: For general questions
- **Complaint**: For complaints and issues

Templates are automatically selected based on email content analysis.

## Step 9: Set Up Email Provider Integration

### For Gmail/Google Workspace:
1. Set up email forwarding rules to forward to the receive-email webhook
2. Configure customersupport@softaidev.com as the primary support email

### For Other Providers:
1. Configure MX records to route emails through your provider
2. Set up forwarding rules to the Supabase webhook endpoint

## Troubleshooting

### Common Issues:

1. **Edge Functions not responding**:
   - Check environment variables are set correctly
   - Verify function deployment was successful
   - Check function logs in Supabase dashboard

2. **Emails not being forwarded**:
   - Verify webhook URL is correct
   - Check DNS configuration
   - Test webhook endpoint manually

3. **Database connection errors**:
   - Verify RLS policies are configured
   - Check service role key permissions
   - Ensure tables were created successfully

4. **Module import errors**:
   - Verify all scripts are loaded as modules where needed
   - Check for JavaScript console errors
   - Ensure proper import/export syntax

## Security Considerations

1. **API Keys**: Never expose API keys in client-side code
2. **RLS Policies**: Configure appropriate Row Level Security policies
3. **CORS**: Configure CORS settings for your domain
4. **Rate Limiting**: Implement rate limiting for email sending

## Monitoring and Maintenance

1. **Monitor Edge Function logs** for errors
2. **Check email delivery rates** in Resend dashboard
3. **Review assistant_activities table** for system health
4. **Set up alerts** for failed email deliveries

## Next Steps

After deployment:
1. Test all functionality thoroughly
2. Configure monitoring and alerts
3. Train team on using the virtual assistant interface
4. Set up backup procedures for important data
5. Plan for scaling as usage grows

## Support

For issues with this deployment:
1. Check Supabase function logs
2. Review browser console for JavaScript errors
3. Verify all environment variables are set
4. Test individual components (email, chat, database) separately

# Virtual Assistant Setup Steps

Follow these steps to complete the deployment:

## Step 1: Supabase Project Setup ✅ Ready

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and enter project details
   - Wait for project to be ready

2. **Run Database Setup**:
   - Go to SQL Editor in your Supabase dashboard
   - Copy all content from `setup-database.txt`
   - Paste into SQL Editor and click "Run"
   - Verify all tables are created

3. **Get Project Details**:
   - Go to Settings → API
   - Copy your `Project URL` and `anon public` key
   - Copy your `service_role` key (keep this secure)

## Step 2: Deploy Edge Functions (Alternative Methods)

### Option A: Manual Upload via Dashboard
1. Go to Edge Functions in Supabase dashboard
2. Create new function named `send-email`
3. Copy content from `supabase/functions/send-email/index.ts`
4. Paste and deploy
5. Repeat for `receive-email` function

### Option B: Try Supabase CLI via Scoop
```powershell
# Install Scoop first if not installed
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option C: Direct Binary Download
1. Go to [GitHub Supabase CLI releases](https://github.com/supabase/cli/releases)
2. Download Windows binary
3. Extract to a folder in your PATH

## Step 3: Configure Environment Variables

In Supabase Dashboard → Edge Functions → Settings:
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
```

## Step 4: Set up Resend Account

1. **Create Account**: Go to [resend.com](https://resend.com)
2. **Add Domain**: Add `softaidev.com` to your domains
3. **Verify Domain**: Add DNS records as instructed
4. **Get API Key**: Create API key for the project
5. **Configure Sender**: Set up `customersupport@softaidev.com`

## Step 5: Configure Frontend

Update `js/services/supabaseService.js` with your Supabase details:
```javascript
const supabaseUrl = 'https://your-project-ref.supabase.co'
const supabaseKey = 'your-anon-public-key'
```

## Step 6: Test System

1. **Test Database Connection**:
   - Open `virtual-assistant.html`
   - Check browser console for errors
   - Try creating a chat message

2. **Test Email Functions**:
   - Send test email via Edge Function
   - Check email_history table for records

3. **Test Auto-Reply**:
   - Send email to your domain
   - Verify auto-reply is sent
   - Check forwarding to customersupport@softaidev.com

## Troubleshooting

- **CLI Issues**: Use manual upload method for Edge Functions
- **CORS Errors**: Add your domain to Supabase CORS settings
- **Email Issues**: Verify domain DNS records in Resend
- **Database Errors**: Check RLS policies are correctly set

## Next Steps After Setup

1. Configure email forwarding rules
2. Test all functionality end-to-end
3. Monitor Edge Function logs
4. Set up monitoring and alerts

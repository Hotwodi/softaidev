# Virtual Assistant Database Schema

This document contains the SQL commands to create the necessary tables for the Virtual Assistant system in Supabase.

## Tables to Create

Run these SQL commands in your Supabase SQL editor:

### 1. Chat Messages Table
```sql
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('visitor', 'assistant')),
    message TEXT NOT NULL,
    visitor_name TEXT,
    visitor_email TEXT,
    visitor_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
```

### 2. Call History Table
```sql
CREATE TABLE call_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    caller_name TEXT,
    caller_phone TEXT,
    call_type TEXT CHECK (call_type IN ('incoming', 'outgoing', 'callback_request')),
    duration INTEGER, -- in seconds
    status TEXT CHECK (status IN ('completed', 'missed', 'pending', 'in_progress')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_call_history_created_at ON call_history(created_at);
CREATE INDEX idx_call_history_status ON call_history(status);
```

### 3. Email History Table
```sql
CREATE TABLE email_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    email_type TEXT CHECK (email_type IN ('incoming', 'outgoing', 'auto_reply', 'forwarded')),
    status TEXT CHECK (status IN ('sent', 'received', 'failed', 'pending')),
    reply_to_id UUID REFERENCES email_history(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_email_history_created_at ON email_history(created_at);
CREATE INDEX idx_email_history_type ON email_history(email_type);
CREATE INDEX idx_email_history_from_email ON email_history(from_email);
```

### 4. Customers Table
```sql
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    company TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
```

### 5. Assistant Activities Table
```sql
CREATE TABLE assistant_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('email', 'chat', 'call', 'system')),
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_assistant_activities_created_at ON assistant_activities(created_at);
CREATE INDEX idx_assistant_activities_type ON assistant_activities(activity_type);
```

### 6. Email Queue Table
```sql
CREATE TABLE email_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    to_email TEXT NOT NULL,
    from_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled_at ON email_queue(scheduled_at);
```

## Row Level Security (RLS)

Enable RLS and create policies for each table:

```sql
-- Enable RLS on all tables
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For now, allow service role to access everything
CREATE POLICY "Service role can access chat_messages" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Service role can access call_history" ON call_history FOR ALL USING (true);
CREATE POLICY "Service role can access email_history" ON email_history FOR ALL USING (true);
CREATE POLICY "Service role can access customers" ON customers FOR ALL USING (true);
CREATE POLICY "Service role can access assistant_activities" ON assistant_activities FOR ALL USING (true);
CREATE POLICY "Service role can access email_queue" ON email_queue FOR ALL USING (true);
```

## Environment Variables

Set these environment variables in your Supabase Edge Functions:

1. `SUPABASE_URL` - Your Supabase project URL
2. `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
3. `RESEND_API_KEY` - Your Resend API key for sending emails

## Next Steps

1. Run the SQL commands above in your Supabase SQL editor
2. Deploy the Edge Functions (`send-email` and `receive-email`)
3. Set the environment variables
4. Test the email sending and receiving functionality
5. Configure your email provider to forward emails to the `receive-email` function webhook

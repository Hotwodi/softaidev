import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# Get Supabase credentials
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')

print(f"Testing connection to Supabase at: {url}")
print(f"Using key: {key[:10]}...{key[-10:] if key else ''}")

try:
    # Initialize the client
    supabase = create_client(url, key)
    
    # Test a simple query
    print("\nTesting database connection...")
    result = supabase.table('purchases').select('*').limit(1).execute()
    
    if hasattr(result, 'data'):
        print("✅ Successfully connected to Supabase!")
        print(f"Found {len(result.data)} purchase records")
    else:
        print("❌ Unexpected response format:")
        print(result)
        
except Exception as e:
    print(f"\n❌ Connection failed: {str(e)}")
    
    # Print more detailed error information
    if hasattr(e, 'args') and e.args:
        print("\nError details:")
        for i, arg in enumerate(e.args, 1):
            print(f"  {i}. {arg}")
    
    print("\nTroubleshooting:")
    print("1. Verify your Supabase URL and API key in the .env file")
    print("2. Check if your Supabase project is running")
    print("3. Ensure your IP is whitelisted in Supabase dashboard")
    print("4. Check if you need to enable Row Level Security (RLS) for the tables")

import os
from dotenv import load_dotenv
from supabase import create_client, Client

def test_supabase_connection():
    # Load environment variables
    load_dotenv()
    
    # Get Supabase credentials
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')
    
    print(f"Testing connection to Supabase at: {url}")
    print(f"Using key: {key[:10]}...{key[-10:] if key else ''}")
    
    try:
        # Initialize the client
        supabase = create_client(url, key)
        
        # Test a simple query (unauthenticated)
        print("\nTesting unauthenticated access...")
        try:
            result = supabase.table('purchases').select('*').limit(1).execute()
            print(f"✅ Success! Found {len(result.data)} purchase records")
        except Exception as e:
            if "not authenticated" in str(e).lower():
                print("✅ Expected: Unauthenticated access was blocked")
            else:
                print(f"❌ Unexpected error: {str(e)}")
        
        # Test authentication with test user
        print("\nTesting authentication...")
        email = os.getenv('TEST_EMAIL')
        password = os.getenv('TEST_PASSWORD')
        
        if not email or not password:
            print("❌ Missing TEST_EMAIL or TEST_PASSWORD in .env")
            return
            
        try:
            # Sign in
            result = supabase.auth.sign_in_with_password({
                'email': email,
                'password': password
            })
            
            if hasattr(result, 'user') and result.user:
                print(f"✅ Successfully authenticated as: {result.user.email}")
                
                # Test authenticated query
                print("\nTesting authenticated query...")
                try:
                    result = supabase.table('purchases').select('*').limit(1).execute()
                    print(f"✅ Success! Found {len(result.data)} purchase records")
                except Exception as e:
                    print(f"❌ Authenticated query failed: {str(e)}")
                
                # Sign out
                supabase.auth.sign_out()
                print("✅ Signed out successfully")
            else:
                print("❌ Authentication failed - invalid response format")
                
        except Exception as e:
            print(f"❌ Authentication failed: {str(e)}")
        
    except Exception as e:
        print(f"\n❌ Connection failed: {str(e)}")
        
        # Print more detailed error information
        if hasattr(e, 'args') and e.args:
            print("\nError details:")
            for i, arg in enumerate(e.args, 1):
                print(f"  {i}. {arg}")
    
    print("\nTest completed!")

if __name__ == "__main__":
    test_supabase_connection()

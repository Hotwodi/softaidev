import os
import requests
from dotenv import load_dotenv

def test_supabase_http():
    # Load environment variables
    load_dotenv()
    
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')
    
    if not url or not key:
        print("❌ Missing Supabase URL or API key in .env file")
        return
        
    # Test REST API endpoint
    endpoint = f"{url}/rest/v1/"
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    print(f"Testing connection to: {endpoint}")
    
    try:
        response = requests.get(endpoint, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Successfully connected to Supabase")
            
            # Test a simple query
            table_endpoint = f"{url}/rest/v1/purchases?select=*&limit=1"
            response = requests.get(table_endpoint, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Retrieved {len(data)} purchase records")
            elif response.status_code == 401:
                print("ℹ️ Could not access table - authentication required")
            else:
                print(f"❌ Failed to query table (Status: {response.status_code})")
                print(response.text[:500])  # Print first 500 chars of response
                
        else:
            print(f"❌ Failed to connect (Status: {response.status_code})")
            print(response.text[:500])  # Print first 500 chars of response
            
    except Exception as e:
        print(f"❌ Connection error: {str(e)}")

if __name__ == "__main__":
    test_supabase_http()

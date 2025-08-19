import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def list_function_env():
    # Get Supabase project reference and access token from environment
    project_ref = os.getenv('SUPABASE_PROJECT_REF', 'glplnybcdgbyajdgzjrr')
    access_token = os.getenv('SUPABASE_ACCESS_TOKEN')
    
    if not access_token:
        print("Error: SUPABASE_ACCESS_TOKEN not found in environment variables")
        print("Please set SUPABASE_ACCESS_TOKEN in your .env file")
        return False
    
    # API endpoint
    url = f"https://api.supabase.com/v1/projects/{project_ref}/functions/send-phone-call/env"
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        env_vars = response.json()
        print("Environment variables for send-email function:")
        for var in env_vars:
            value = var['value'] if not var.get('is_secret') else '[HIDDEN]'
            print(f"{var['name']} = {value}")
            
    except requests.exceptions.RequestException as e:
        print(f"Error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Status Code: {e.response.status_code}")
            print(f"Response: {e.response.text}")
        return False
    
    return True

if __name__ == "__main__":
    list_function_env()

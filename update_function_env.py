import os
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def update_function_env():
    # Get environment variables
    project_ref = os.getenv('SUPABASE_PROJECT_REF', 'glplnybcdgbyajdgzjrr')
    access_token = os.getenv('SUPABASE_ACCESS_TOKEN')
    
    if not access_token:
        print("Error: SUPABASE_ACCESS_TOKEN not found in environment variables")
        print("Please set SUPABASE_ACCESS_TOKEN in your .env file")
        return False
    
    # Get environment variables to set
    env_vars = {
        'RESEND_API_KEY': os.getenv('RESEND_API_KEY'),
        'FROM_EMAIL': os.getenv('FROM_EMAIL', 'onboarding@resend.dev'),
        'TO_EMAIL': os.getenv('TO_EMAIL'),
        'BCC_EMAIL': os.getenv('BCC_EMAIL')
    }
    
    # Prepare the request
    url = f"https://api.supabase.com/v1/projects/{project_ref}/functions/send-email/env"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    # Prepare the payload
    payload = []
    for name, value in env_vars.items():
        if value is not None:
            payload.append({
                'name': name,
                'value': value,
                'is_secret': name == 'RESEND_API_KEY'  # Mark API key as secret
            })
    
    try:
        # First, get existing variables to avoid duplicates
        response = requests.get(url, headers=headers)
        existing_vars = {v['name']: v for v in response.json()}
        
        # Update existing variables and add new ones
        for var in payload:
            existing_vars[var['name']] = var
        
        # Convert back to list
        payload = list(existing_vars.values())
        
        # Update the environment variables
        response = requests.put(url, headers=headers, json=payload)
        response.raise_for_status()
        
        print("✅ Environment variables updated successfully")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error updating environment variables: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Status Code: {e.response.status_code}")
            print(f"Response: {e.response.text}")
        return False

if __name__ == "__main__":
    update_function_env()

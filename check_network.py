import os
import requests
import socket
from urllib.parse import urlparse
from dotenv import load_dotenv

def check_network():
    # Load environment variables
    load_dotenv()
    
    # Get Supabase URL
    supabase_url = os.getenv('SUPABASE_URL', 'https://glplnybcdgbyajdgzjrr.supabase.co')
    
    # Parse the URL
    parsed_url = urlparse(supabase_url)
    hostname = parsed_url.hostname
    port = parsed_url.port or (443 if parsed_url.scheme == 'https' else 80)
    
    print(f"Testing connection to: {hostname}:{port}")
    
    # Test DNS resolution
    try:
        ip = socket.gethostbyname(hostname)
        print(f"✅ DNS Resolution: {hostname} -> {ip}")
    except socket.gaierror as e:
        print(f"❌ DNS Resolution failed: {e}")
        return
    
    # Test TCP connection
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)  # 5 second timeout
        result = sock.connect_ex((hostname, port))
        if result == 0:
            print(f"✅ TCP Connection successful on port {port}")
        else:
            print(f"❌ TCP Connection failed (Error: {result})")
        sock.close()
    except Exception as e:
        print(f"❌ TCP Connection error: {e}")
        return
    
    # Test HTTP connection
    try:
        print(f"\nTesting HTTP connection to: {supabase_url}")
        response = requests.get(supabase_url, timeout=10, allow_redirects=True)
        print(f"✅ HTTP Status Code: {response.status_code}")
        print(f"✅ Final URL: {response.url}")
        
        # Check if this is a Supabase project
        if 'supabase' in response.text.lower():
            print("✅ Detected Supabase project")
        else:
            print("⚠️ Response doesn't look like Supabase")
            
    except requests.exceptions.SSLError as e:
        print(f"❌ SSL Error: {e}")
    except requests.exceptions.RequestException as e:
        print(f"❌ HTTP Request failed: {e}")

if __name__ == "__main__":
    check_network()

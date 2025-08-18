import sys
import os
from dotenv import load_dotenv

print("Python Version:", sys.version)
print("Current Working Directory:", os.getcwd())

# Try to load .env file
load_dotenv()
print("\nEnvironment Variables:")
for var in ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'TEST_EMAIL']:
    value = os.getenv(var)
    print(f"{var}: {'*****' + value[-4:] if value and len(value) > 4 else 'Not set'}")

# Test Supabase import
try:
    from supabase import create_client
    print("\n✅ Supabase module imported successfully")
except ImportError as e:
    print(f"\n❌ Failed to import Supabase: {e}")
    print("Try running: pip install supabase python-dotenv")

import os
import time
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://glplnybcdgbyajdgzjrr.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'your-supabase-anon-key')
TEST_EMAIL = os.getenv('TEST_EMAIL', 'test@example.com')
TEST_PASSWORD = os.getenv('TEST_PASSWORD', 'TestPass123!')

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def print_step(step, message):
    print(f"\n{'='*50}")
    print(f"STEP {step}: {message}")
    print(f"{'='*50}")

def test_password_reset():
    """Test the complete password reset flow"""
    try:
        # Step 1: Request password reset
        print_step(1, "Requesting password reset")
        response = supabase.auth.reset_password_for_email(
            TEST_EMAIL,
            {"redirect_to": "http://localhost:8000/update-password.html"}
        )
        print(f"Password reset email sent to {TEST_EMAIL}")
        
        # Step 2: In a real test, you would extract the reset link from the email
        # For this example, we'll simulate the next steps
        print_step(2, "Simulating email link click")
        print("Please check your email and click the reset link to continue testing...")
        
        # Step 3: Wait for user to click the link and set a new password
        input("Press Enter after you've set a new password...")
        
        # Step 4: Test login with new password
        print_step(3, "Testing login with new password")
        new_password = input("Enter the new password you set: ")
        
        # Try to sign in with the new password
        result = supabase.auth.sign_in_with_password({
            'email': TEST_EMAIL,
            'password': new_password
        })
        
        if result.user:
            print("✅ Successfully logged in with new password!")
            # Update the test password for future tests
            with open('.env', 'a') as f:
                f.write(f"\nTEST_PASSWORD={new_password}")
            return True
        else:
            print("❌ Failed to login with new password")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting password reset test...")
    success = test_password_reset()
    
    if success:
        print("\n✅ Password reset test completed successfully!")
    else:
        print("\n❌ Password reset test failed")

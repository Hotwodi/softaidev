import os
import time
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://glplnybcdgbyajdgzjrr.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdi...')

# Test user credentials
TEST_EMAIL = 'customer.support@softaidev.com'
TEST_PASSWORD = 'Test@1234'
TEST_USERNAME = 'testuser_softaidev'
TEST_FIRST_NAME = 'Test'
TEST_LAST_NAME = 'User'

def print_step(step_num, description):
    print(f"\n{'='*50}")
    print(f"STEP {step_num}: {description}")
    print(f"{'='*50}")

def test_signup():
    print_step(1, "Testing Sign Up")
    
    # Create a new client for signup
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        # First, try to delete the test user if it exists
        try:
            result = supabase.auth.sign_in_with_password({
                'email': TEST_EMAIL,
                'password': TEST_PASSWORD
            })
            user = result.user
            print(f"Found existing user: {user.email}")
            print("Deleting existing user...")
            # Note: In production, you'd need admin privileges to delete users
            # This is just for testing
            supabase.auth.admin.delete_user(user.id)
            print("Existing user deleted.")
        except Exception as e:
            if "Invalid login credentials" in str(e):
                print("No existing test user found. Proceeding with signup.")
            else:
                print(f"Error checking for existing user: {e}")
        
        # Sign up new user
        print(f"Creating new user: {TEST_EMAIL}")
        result = supabase.auth.sign_up({
            'email': TEST_EMAIL,
            'password': TEST_PASSWORD,
            'options': {
                'data': {
                    'username': TEST_USERNAME,
                    'first_name': TEST_FIRST_NAME,
                    'last_name': TEST_LAST_NAME,
                    'full_name': f"{TEST_FIRST_NAME} {TEST_LAST_NAME}"
                }
            }
        })
        
        print(f"Signup successful! Please check {TEST_EMAIL} for verification email.")
        print("Note: In a real test, you would need to extract the verification link from the email.")
        
        return True
        
    except Exception as e:
        print(f"Signup failed: {str(e)}")
        return False

def test_login():
    print_step(2, "Testing Login")
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        print(f"Attempting to log in as {TEST_EMAIL}...")
        result = supabase.auth.sign_in_with_password({
            'email': TEST_EMAIL,
            'password': TEST_PASSWORD
        })
        
        user = result.user
        print(f"Login successful!")
        print(f"User ID: {user.id}")
        print(f"Email: {user.email}")
        print(f"Email verified: {user.email_confirmed_at is not None}")
        
        # Get user metadata
        user_metadata = result.user.user_metadata
        print(f"Username: {user_metadata.get('username')}")
        print(f"First Name: {user_metadata.get('first_name')}")
        print(f"Last Name: {user_metadata.get('last_name')}")
        
        return True
        
    except Exception as e:
        print(f"Login failed: {str(e)}")
        return False

def test_password_reset():
    print_step(3, "Testing Password Reset")
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        print(f"Sending password reset email to {TEST_EMAIL}...")
        result = supabase.auth.reset_password_for_email(TEST_EMAIL)
        
        print(f"Password reset email sent to {TEST_EMAIL}")
        print("Please check your email and follow the password reset link.")
        print("Note: In a real test, you would need to extract the reset link from the email.")
        
        # In a real test, you would:
        # 1. Extract the reset link from the email
        # 2. Simulate clicking the link
        # 3. Submit a new password
        
        return True
        
    except Exception as e:
        print(f"Password reset request failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting authentication flow tests...")
    
    # Test signup
    if test_signup():
        print("\n✅ Signup test completed successfully!")
    else:
        print("\n❌ Signup test failed.")
    
    # Test login
    if test_login():
        print("\n✅ Login test completed successfully!")
    else:
        print("\n❌ Login test failed.")
    
    # Test password reset
    if test_password_reset():
        print("\n✅ Password reset test initiated successfully!")
        print("Please check your email to complete the password reset process.")
    else:
        print("\n❌ Password reset test failed.")
    
    print("\nTesting complete. Please check your email for verification and password reset links.")

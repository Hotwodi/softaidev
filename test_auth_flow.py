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
        # First, ensure we have a valid session
        try:
            result = supabase.auth.sign_in_with_password({
                'email': TEST_EMAIL,
                'password': TEST_PASSWORD
            })
            print("Logged in with current password")
        except Exception as e:
            if "Invalid login credentials" in str(e):
                print("Current password is invalid, but we'll proceed with reset")
            else:
                raise e
        
        # Request password reset
        print(f"Sending password reset email to {TEST_EMAIL}...")
        supabase.auth.reset_password_for_email(TEST_EMAIL, {
            'redirectTo': 'http://localhost:8000/update-password.html'
        })
        
        print("\n=== TEST INSTRUCTIONS ===")
        print("1. Check your email for a password reset link")
        print("2. Click the link to go to the password reset page")
        print("3. Set a new password")
        print("4. Return here to continue testing")
        print("=======================\n")
        
        input("Press Enter after you've reset your password to continue testing...")
        
        # Test login with new password
        print("\nTesting login with new password...")
        new_password = input("Enter the new password you set: ")
        
        result = supabase.auth.sign_in_with_password({
            'email': TEST_EMAIL,
            'password': new_password
        })
        
        if result.user:
            print("✅ Successfully logged in with new password!")
            # Update the test password for subsequent tests
            global TEST_PASSWORD
            TEST_PASSWORD = new_password
            return True
        else:
            print("❌ Failed to login with new password")
            return False
        
    except Exception as e:
        print(f"❌ Password reset test failed: {str(e)}")
        return False

def run_tests():
    print("Starting authentication flow tests...")
    tests_passed = 0
    total_tests = 3
    
    # Test signup
    print("\n" + "="*60)
    print("RUNNING SIGNUP TEST")
    print("="*60)
    if test_signup():
        tests_passed += 1
    
    # Test login
    print("\n" + "="*60)
    print("RUNNING LOGIN TEST")
    print("="*60)
    if test_login():
        tests_passed += 1
    
    # Test password reset
    print("\n" + "="*60)
    print("RUNNING PASSWORD RESET TEST")
    print("="*60)
    if test_password_reset():
        tests_passed += 1
    
    # Final results
    print("\n" + "="*60)
    print("TEST RESULTS")
    print("="*60)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    print("="*60)
    
    if tests_passed == total_tests:
        print("✅ All tests completed successfully!")
        return True
    else:
        print(f"❌ {total_tests - tests_passed} test(s) failed")
        return False

if __name__ == "__main__":
    try:
        run_tests()
    except KeyboardInterrupt:
        print("\n\nTest execution cancelled by user.")
    except Exception as e:
        print(f"\n\nAn unexpected error occurred: {str(e)}")
        raise

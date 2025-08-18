import os
import time
import requests
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://glplnybcdgbyajdgzjrr.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', 'your-supabase-anon-key')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'your-service-role-key')
TEST_EMAIL = os.getenv('TEST_EMAIL', 'test@example.com')
TEST_PASSWORD = os.getenv('TEST_PASSWORD', 'TestPass123!')
SITE_URL = os.getenv('SITE_URL', 'http://localhost:8000')

class AuthTester:
    def __init__(self):
        # Initialize clients with proper options
        client_options = ClientOptions(
            postgrest_client_timeout=10,
            storage_client_timeout=10,
            auth_auto_refresh_interval=60,
            auth_persist_session=False
        )
        
        self.supabase = create_client(
            SUPABASE_URL, 
            SUPABASE_ANON_KEY,
            options=client_options
        )
        
        # Initialize admin client with service role key
        self.admin = create_client(
            SUPABASE_URL,
            SUPABASE_SERVICE_KEY,
            options=client_options
        )
        
        # Test user configuration
        self.test_email = TEST_EMAIL
        self.test_password = TEST_PASSWORD
        self.access_token = None
        self.user_created = False
        self.test_user_id = None
        
    def print_step(self, step, message):
        print(f"\n{'='*50}")
        print(f"STEP {step}: {message}")
        print(f"{'='*50}")
    
    def ensure_test_user(self):
        """Ensure test user exists, create if necessary"""
        try:
            # Try to sign in first
            result = self.supabase.auth.sign_in_with_password({
                'email': self.test_email,
                'password': self.test_password
            })
            
            if result.user:
                print(f"ℹ️ Using existing test user: {self.test_email}")
                self.test_user_id = result.user.id
                self.user_created = False  # We didn't create it
                return True
                
        except Exception as e:
            # User doesn't exist or invalid credentials, try to create
            pass
            
        try:
            # Create new user with admin client (bypasses email confirmation)
            result = self.admin.auth.admin.create_user({
                'email': self.test_email,
                'password': self.test_password,
                'email_confirm': True,  # Auto-confirm email
                'user_metadata': {
                    'full_name': 'Test User',
                    'username': f'testuser_{int(time.time())}'
                }
            })
            
            if hasattr(result, 'user') and result.user:
                print(f"✅ Created test user: {self.test_email}")
                self.test_user_id = result.user.id
                self.user_created = True
                return True
            else:
                print("❌ Failed to create test user")
                return False
                
        except Exception as e:
            print(f"❌ Failed to create test user: {str(e)}")
            return False
    
    def test_signup(self):
        """Test user signup flow"""
        self.print_step(1, "Testing User Signup")
        
        # First ensure we have a test user
        if not self.ensure_test_user():
            print("❌ Could not ensure test user exists")
            return False
            
        # Test public signup flow
        try:
            # Try to sign up with the same email (should fail)
            temp_email = f"temp_{int(time.time())}@test.com"
            result = self.supabase.auth.sign_up({
                'email': temp_email,
                'password': self.test_password,
                'options': {
                    'data': {
                        'full_name': 'Temp User',
                        'username': f'tempuser_{int(time.time())}'
                    },
                    'email_redirect_to': f'{SITE_URL}/auth/callback'
                }
            })
            
            if result.user:
                print(f"✅ Public signup successful for: {temp_email}")
                # Clean up the temporary user
                self.admin.auth.admin.delete_user(result.user.id)
                return True
            else:
                print("❌ Public signup returned no user")
                return False
                
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Public signup failed: {error_msg}")
            return False
    
    def test_login(self, email=None, password=None):
        """Test user login"""
        self.print_step(2, "Testing User Login")
        try:
            email = email or self.test_email
            password = password or self.test_password
            
            # Ensure we have a fresh session
            self.supabase.auth.sign_out()
            
            # Test login with credentials
            result = self.supabase.auth.sign_in_with_password({
                'email': email,
                'password': password
            })
            
            if result and hasattr(result, 'user') and result.user:
                self.access_token = result.session.access_token
                print(f"✅ Login successful: {result.user.email}")
                return True
            else:
                print("❌ Login failed - invalid response format")
                return False
                
        except Exception as e:
            error_msg = str(e)
            if "Invalid login credentials" in error_msg:
                print("❌ Login failed - invalid credentials")
            else:
                print(f"❌ Login failed: {error_msg}")
            return False
    
    def test_protected_route(self):
        """Test accessing a protected route"""
        self.print_step(3, "Testing Protected Route Access")
        try:
            # First test without authentication
            try:
                # Clear any existing session
                self.supabase.auth.sign_out()
                
                # Try to access a protected endpoint
                response = self.supabase.table('purchases').select('*').execute()
                print("❌ Should not be able to access protected route without auth")
                return False
                
            except Exception as e:
                if "not authenticated" in str(e).lower() or "auth session missing" in str(e).lower():
                    print("✅ Protected route correctly rejects unauthenticated access")
                else:
                    print(f"❌ Unexpected error for unauthenticated access: {str(e)}")
                    return False
            
            # Now test with authentication
            try:
                # Ensure we're logged in
                if not self.access_token:
                    if not self.test_login():
                        print("❌ Could not authenticate for protected route test")
                        return False
                
                # Try to access a protected endpoint
                response = self.supabase.table('purchases').select('*').limit(1).execute()
                
                # If we get here, the request was successful
                if hasattr(response, 'data'):
                    print("✅ Successfully accessed protected route with authentication")
                    return True
                else:
                    print("❌ Unexpected response format from protected route")
                    return False
                    
            except Exception as e:
                print(f"❌ Error accessing protected route with auth: {str(e)}")
                return False
            
        except Exception as e:
            print(f"❌ Error in protected route test: {str(e)}")
            return False
    
    def test_password_reset(self):
        """Test password reset flow"""
        self.print_step(4, "Testing Password Reset")
        
        # First ensure we have a test user
        if not self.ensure_test_user():
            print("❌ Could not ensure test user exists")
            return False
            
        try:
            # Generate a new password
            new_password = f"NewPass123!{int(time.time())}"
            
            # Update password using admin client (bypassing email verification for testing)
            user = self.admin.auth.admin.get_user_by_email(self.test_email)
            if not user or not hasattr(user, 'user') or not user.user:
                print("❌ Could not find test user")
                return False
                
            # Update the password
            self.admin.auth.admin.update_user_by_id(
                user.user.id,
                {'password': new_password}
            )
            
            print(f"✅ Updated password for {self.test_email}")
            
            # Test login with new password
            if self.test_login(self.test_email, new_password):
                print("✅ Password update and login successful")
                self.test_password = new_password  # Update for subsequent tests
                return True
            else:
                print("❌ Could not login with new password")
                return False
                
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Password reset test failed: {error_msg}")
            return False
    
    def cleanup_test_user(self):
        """Clean up test user if it exists"""
        if not self.user_created and not self.test_user_id:
            return
            
        try:
            # Try to delete using admin client
            if self.test_user_id:
                self.admin.auth.admin.delete_user(self.test_user_id)
                print(f"✅ Deleted test user: {self.test_email}")
            else:
                # Fallback: Try to sign in and delete
                result = self.supabase.auth.sign_in_with_password({
                    'email': self.test_email,
                    'password': self.test_password
                })
                if result.user:
                    self.admin.auth.admin.delete_user(result.user.id)
                    print(f"✅ Deleted test user: {self.test_email}")
            
            self.user_created = False
            self.test_user_id = None
                
        except Exception as e:
            print(f"⚠️ Could not clean up test user: {str(e)}")
            # Try to continue anyway
    
    def run_all_tests(self):
        """Run all authentication tests"""
        print("\n" + "="*60)
        print("STARTING AUTHENTICATION TESTS")
        print("="*60)
        print(f"Test User: {self.test_email}")
        print("-" * 60)
        
        tests = [
            ("1. User Signup", self.test_signup, True),
            ("2. User Login", lambda: self.test_login(), True),
            ("3. Protected Route (unauthenticated)", self.test_protected_route, False),
            ("4. Password Reset", self.test_password_reset, False),
            ("5. Protected Route (authenticated)", self.test_protected_route, False)
        ]
        
        results = []
        start_time = time.time()
        
        for name, test_func, is_required in tests:
            test_start = time.time()
            print(f"\n{name}")
            print("-" * len(name))
            
            # Skip dependent tests if required tests failed
            if is_required and results and not results[-1][1]:
                print("⚠️ Skipping due to previous test failure")
                results.append((name, False, "Skipped due to previous failure"))
                continue
                
            try:
                result = test_func()
                duration = time.time() - test_start
                results.append((name, result, f"({duration:.2f}s)"))
                time.sleep(1)  # Add delay between tests
            except Exception as e:
                duration = time.time() - test_start
                error_msg = f"Crashed after {duration:.2f}s: {str(e)}"
                print(f"❌ {error_msg}")
                results.append((name, False, error_msg))
        
        # Calculate total duration
        total_duration = time.time() - start_time
        
        # Clean up test user if we created one
        if self.user_created:
            print("\nCleaning up test user...")
            self.cleanup_test_user()
        
        # Print summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        all_passed = True
        for name, result, message in results:
            status = "✅ PASS" if result else "❌ FAIL"
            msg = f" {message}" if message else ""
            print(f"{status} {name:<40}{msg}")
            if not result:
                all_passed = False
        
        print("\n" + "-" * 60)
        print(f"Total test time: {total_duration:.2f} seconds")
        
        if all_passed:
            print("\n🎉 All tests passed successfully!")
        else:
            print("\n❌ Some tests failed. Please check the output above for details.")
        
        return all_passed

if __name__ == "__main__":
    tester = AuthTester()
    tester.run_all_tests()

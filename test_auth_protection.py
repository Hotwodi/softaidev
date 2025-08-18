import pytest
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Test configuration
TEST_EMAIL = os.getenv('TEST_EMAIL', 'test@example.com')
TEST_PASSWORD = os.getenv('TEST_PASSWORD', 'TestPass123!')
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://glplnybcdgbyajdgzjrr.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'your-supabase-key')

class TestAuthProtection:
    @classmethod
    def setup_class(cls):
        """Set up test environment"""
        cls.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Ensure we're signed out before tests
        try:
            cls.supabase.auth.sign_out()
        except Exception as e:
            print(f"Warning during sign out: {e}")
    
    def test_unauthenticated_access_to_paid_content(self):
        """Test that unauthenticated users cannot access paid content"""
        # Ensure we're signed out
        self.supabase.auth.sign_out()
        
        # Try to access paid content (simulate API call that requires auth)
        try:
            # This should fail with an auth error
            response = self.supabase.table('purchases').select('*').execute()
            assert False, "Should not be able to access purchases without authentication"
        except Exception as e:
            # Expected to fail with auth error
            assert "Auth session missing" in str(e) or "not authenticated" in str(e).lower()
    
    def test_authenticated_access_to_paid_content(self):
        """Test that authenticated users can access paid content"""
        try:
            # Sign in
            result = self.supabase.auth.sign_in_with_password({
                'email': TEST_EMAIL,
                'password': TEST_PASSWORD
            })
            
            # This should work for authenticated users
            response = self.supabase.table('purchases').select('*').execute()
            
            # If we get here, the request was successful
            assert response.data is not None
            
        except Exception as e:
            pytest.fail(f"Authenticated access failed: {str(e)}")
            
        finally:
            # Clean up - sign out
            self.supabase.auth.sign_out()
    
    def test_download_protection(self):
        """Test that downloads are protected"""
        # First try without authentication
        self.supabase.auth.sign_out()
        
        try:
            # This should redirect to login or fail
            response = self.supabase.functions.invoke('get-download-url', {
                'body': {'app_id': 'test-app'}
            })
            assert False, "Should not be able to get download URL without authentication"
        except Exception as e:
            # Expected to fail with auth error
            assert "Auth session missing" in str(e) or "not authenticated" in str(e).lower()
        
        # Now try with authentication
        try:
            # Sign in
            self.supabase.auth.sign_in_with_password({
                'email': TEST_EMAIL,
                'password': TEST_PASSWORD
            })
            
            # This should work for authenticated users
            response = self.supabase.functions.invoke('get-download-url', {
                'body': {'app_id': 'test-app'}
            })
            
            # If we get here, the request was successful
            assert 'url' in response.data
            
        except Exception as e:
            pytest.fail(f"Authenticated download failed: {str(e)}")
            
        finally:
            # Clean up - sign out
            self.supabase.auth.sign_out()

if __name__ == "__main__":
    # Create a test instance and run tests
    test = TestAuthProtection()
    test.setup_class()
    
    print("Running unauthenticated access test...")
    test.test_unauthenticated_access_to_paid_content()
    
    print("Running authenticated access test...")
    test.test_authenticated_access_to_paid_content()
    
    print("Running download protection test...")
    test.test_download_protection()
    
    print("\n✅ All authentication protection tests passed!")

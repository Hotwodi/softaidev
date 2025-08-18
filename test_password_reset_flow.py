import os
import time
import re
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://glplnybcdgbyajdgzjrr.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdi...')

# Test user credentials
TEST_EMAIL = 'test@example.com'
TEST_PASSWORD = 'OldPassword123!'
NEW_PASSWORD = 'NewPassword123!'

# Mailtrap configuration (for testing email)
MAILTRAP_TOKEN = os.getenv('MAILTRAP_TOKEN')
MAILTRAP_INBOX_ID = os.getenv('MAILTRAP_INBOX_ID')

class TestPasswordReset:
    def __init__(self):
        self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.reset_link = None
        self.session = None

    def print_step(self, step_num, description):
        print(f"\n{'='*60}")
        print(f"STEP {step_num}: {description}")
        print(f"{'='*60}")

    def get_reset_link_from_mailtrap(self):
        """Retrieve the password reset link from Mailtrap inbox"""
        if not MAILTRAP_TOKEN or not MAILTRAP_INBOX_ID:
            print("Mailtrap credentials not found. Please set MAILTRAP_TOKEN and MAILTRAP_INBOX_ID in .env")
            return None
            
        headers = {
            'Api-Token': MAILTRAP_TOKEN,
            'Content-Type': 'application/json'
        }
        
        # Get latest message from Mailtrap
        response = requests.get(
            f'https://mailtrap.io/api/accounts/1393103/inboxes/{MAILTRAP_INBOX_ID}/messages',
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"Failed to fetch emails: {response.text}")
            return None
            
        messages = response.json()
        if not messages:
            print("No emails found in the inbox")
            return None
            
        # Get the latest message
        latest_message = messages[0]
        message_id = latest_message['id']
        
        # Get message body
        response = requests.get(
            f'https://mailtrap.io/api/accounts/1393103/inboxes/{MAILTRAP_INBOX_ID}/messages/{message_id}/body.html',
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"Failed to fetch email body: {response.text}")
            return None
            
        # Extract reset link from email
        html_content = response.text
        reset_link_match = re.search(r'href=[\'"](https?://[^\'"]+token=[^\'"]+)[\'"]', html_content)
        
        if not reset_link_match:
            print("No reset link found in the email")
            return None
            
        return reset_link_match.group(1)

    def test_reset_flow(self):
        """Test the entire password reset flow"""
        try:
            # Step 1: Request password reset
            self.print_step(1, "Requesting password reset")
            self.supabase.auth.reset_password_for_email(TEST_EMAIL, {
                'redirectTo': 'http://localhost:8000/update-password.html'
            })
            print(f"Password reset email sent to {TEST_EMAIL}")
            
            # Step 2: Get reset link from email (simulated with Mailtrap)
            self.print_step(2, "Retrieving reset link from email")
            max_attempts = 5
            for attempt in range(max_attempts):
                print(f"Attempt {attempt + 1}/{max_attempts} to get reset link...")
                self.reset_link = self.get_reset_link_from_mailtrap()
                if self.reset_link:
                    break
                time.sleep(5)  # Wait for email to arrive
            
            if not self.reset_link:
                raise Exception("Failed to retrieve reset link from email")
                
            print(f"Reset link found: {self.reset_link}")
            
            # Step 3: Extract token from reset link
            token_match = re.search(r'token=([^&]+)', self.reset_link)
            if not token_match:
                raise Exception("Could not extract token from reset link")
                
            token = token_match.group(1)
            print("Token extracted successfully")
            
            # Step 4: Update password using the token
            self.print_step(3, "Updating password")
            response = requests.post(
                f"{SUPABASE_URL}/auth/v1/verify",
                headers={
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY
                },
                json={
                    'type': 'recovery',
                    'token': token,
                    'password': NEW_PASSWORD
                }
            )
            
            if response.status_code != 200:
                raise Exception(f"Password update failed: {response.text}")
                
            print("Password updated successfully")
            
            # Step 5: Test login with new password
            self.print_step(4, "Testing login with new password")
            try:
                result = self.supabase.auth.sign_in_with_password({
                    'email': TEST_EMAIL,
                    'password': NEW_PASSWORD
                })
                
                if not result.user:
                    raise Exception("Login with new password failed")
                    
                print("✅ Successfully logged in with new password!")
                
                # Clean up - reset password back to original for future tests
                self.supabase.auth.update_user({
                    'password': TEST_PASSWORD
                })
                print("Password reset back to original for future tests")
                
                return True
                
            except Exception as e:
                raise Exception(f"Login with new password failed: {str(e)}")
            
        except Exception as e:
            print(f"❌ Test failed: {str(e)}")
            return False

if __name__ == "__main__":
    print("Starting password reset flow test...")
    tester = TestPasswordReset()
    
    try:
        success = tester.test_reset_flow()
        if success:
            print("\n✅ Password reset flow test completed successfully!")
        else:
            print("\n❌ Password reset flow test failed")
            exit(1)
    except KeyboardInterrupt:
        print("\nTest execution cancelled by user.")
        exit(1)
    except Exception as e:
        print(f"\nAn unexpected error occurred: {str(e)}")
        exit(1)

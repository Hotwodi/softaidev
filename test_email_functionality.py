import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
import requests
import json
import os

class EmailFunctionalityTest(unittest.TestCase):
    """Test class for testing email functionality with Resend API integration"""
    
    @classmethod
    def setUpClass(cls):
        """Set up the test environment once before all tests"""
        # Set up WebDriver
        service = Service(ChromeDriverManager().install())
        cls.driver = webdriver.Chrome(service=service)
        cls.base_url = "http://localhost:8080"  # Update with your server URL
        cls.driver.maximize_window()
        
        # Load email configuration
        try:
            with open('email-config.json', 'r') as f:
                cls.email_config = json.load(f)
        except FileNotFoundError:
            cls.email_config = {
                "RESEND_API_KEY": os.environ.get("RESEND_API_KEY", ""),
                "FROM_EMAIL": "onboarding@resend.dev",  # Default Resend sender
                "TO_EMAIL": "test@example.com"  # Update with your test email
            }
        
        # Check if Resend API key is available
        cls.resend_api_available = bool(cls.email_config.get("RESEND_API_KEY"))
        if not cls.resend_api_available:
            print("WARNING: Resend API key not found. Direct email verification will be skipped.")
        
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests are done"""
        cls.driver.quit()
        
    def setUp(self):
        """Set up before each test method"""
        self.driver.get(f"{self.base_url}/virtual-assistant.html")
        # Wait for page to load completely
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "communication-options"))
        )
    
    def test_01_email_form_validation(self):
        """Test email form validation"""
        print("\nTesting email form validation...")
        
        # Open email modal
        email_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "email-button"))
        )
        email_button.click()
        
        # Verify email modal is displayed
        email_modal = WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, "email-modal"))
        )
        self.assertTrue(email_modal.is_displayed(), "Email modal did not open")
        
        # Test empty form submission
        send_button = self.driver.find_element(By.ID, "send-email")
        send_button.click()
        
        # Check for validation error message
        error_message = WebDriverWait(self.driver, 5).until(
            EC.visibility_of_element_located((By.ID, "email-status"))
        )
        self.assertIn("error", error_message.get_attribute("class"), 
                     "Validation error not shown for empty form")
        self.assertIn("required fields", error_message.text, 
                     "Wrong validation message for empty form")
        
        # Test invalid email format
        self.driver.find_element(By.ID, "email-name").send_keys("Test User")
        self.driver.find_element(By.ID, "email-address").send_keys("invalid-email")
        self.driver.find_element(By.ID, "email-subject").send_keys("Test Subject")
        self.driver.find_element(By.ID, "email-message").send_keys("Test message content")
        
        send_button.click()
        
        # Check for validation error message
        error_message = WebDriverWait(self.driver, 5).until(
            EC.visibility_of_element_located((By.ID, "email-status"))
        )
        self.assertIn("error", error_message.get_attribute("class"), 
                     "Validation error not shown for invalid email")
        self.assertIn("valid email", error_message.text.lower(), 
                     "Wrong validation message for invalid email")
        
        print("Email form validation test passed!")
    
    def test_02_email_sending_ui_feedback(self):
        """Test email sending UI feedback"""
        print("\nTesting email sending UI feedback...")
        
        # Open email modal
        email_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "email-button"))
        )
        email_button.click()
        
        # Fill out the email form with valid data
        self.driver.find_element(By.ID, "email-name").send_keys("Test User")
        self.driver.find_element(By.ID, "email-address").send_keys("test@example.com")
        self.driver.find_element(By.ID, "email-subject").send_keys("Test Email Subject")
        self.driver.find_element(By.ID, "email-message").send_keys("This is a test email message.")
        
        # Click send email button
        send_button = self.driver.find_element(By.ID, "send-email")
        send_button.click()
        
        # Check for "sending" status message
        sending_message = WebDriverWait(self.driver, 5).until(
            EC.visibility_of_element_located((By.ID, "email-status"))
        )
        self.assertIn("Sending", sending_message.text, 
                     "No 'Sending' status shown")
        
        # Wait for success message
        success_message = WebDriverWait(self.driver, 10).until(
            lambda d: d.find_element(By.ID, "email-status") and 
                      "sent successfully" in d.find_element(By.ID, "email-status").text
        )
        self.assertIn("success", success_message.get_attribute("class"), 
                     "Success status not shown after sending")
        
        # Check that form was cleared
        self.assertEqual("", self.driver.find_element(By.ID, "email-name").get_attribute("value"),
                        "Name field was not cleared")
        self.assertEqual("", self.driver.find_element(By.ID, "email-address").get_attribute("value"),
                        "Email field was not cleared")
        
        print("Email sending UI feedback test passed!")
    
    def test_03_direct_resend_api_test(self):
        """Test direct Resend API integration if API key is available"""
        if not self.resend_api_available:
            print("\nSkipping direct Resend API test - no API key available")
            return
            
        print("\nTesting direct Resend API integration...")
        
        # Resend API endpoint
        api_url = "https://api.resend.com/emails"
        
        # Test email data
        email_data = {
            "from": self.email_config.get("FROM_EMAIL"),
            "to": self.email_config.get("TO_EMAIL"),
            "subject": "Test Email from Automated Test",
            "html": "<p>This is a test email sent by the automated test script.</p>"
        }
        
        # Send test email via Resend API
        headers = {
            "Authorization": f"Bearer {self.email_config.get('RESEND_API_KEY')}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(api_url, headers=headers, json=email_data)
            response_data = response.json()
            
            # Check if email was sent successfully
            self.assertEqual(response.status_code, 200, 
                           f"API request failed with status {response.status_code}")
            self.assertIn("id", response_data, 
                         "No email ID returned in response")
            
            print(f"Email sent successfully via Resend API. Email ID: {response_data.get('id')}")
        except Exception as e:
            self.fail(f"Direct API test failed: {str(e)}")
            
        print("Direct Resend API test passed!")
        
    def test_04_end_to_end_email_flow(self):
        """Test end-to-end email flow with UI and backend integration"""
        print("\nTesting end-to-end email flow...")
        
        # Open email modal from secondary button for variety
        email_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "email-button-secondary"))
        )
        email_button.click()
        
        # Generate unique test data
        timestamp = int(time.time())
        test_name = f"E2E Test User {timestamp}"
        test_email = f"test.{timestamp}@example.com"
        test_subject = f"E2E Test Email {timestamp}"
        test_message = f"This is an end-to-end test email message. Timestamp: {timestamp}"
        
        # Fill out the email form with test data
        self.driver.find_element(By.ID, "email-name").send_keys(test_name)
        self.driver.find_element(By.ID, "email-address").send_keys(test_email)
        self.driver.find_element(By.ID, "email-subject").send_keys(test_subject)
        self.driver.find_element(By.ID, "email-message").send_keys(test_message)
        
        # Click send email button
        send_button = self.driver.find_element(By.ID, "send-email")
        send_button.click()
        
        # Wait for success message
        try:
            success_message = WebDriverWait(self.driver, 10).until(
                EC.visibility_of_element_located((By.ID, "email-status"))
            )
            self.assertIn("success", success_message.get_attribute("class"), 
                         "Email was not sent successfully")
            self.assertIn("sent successfully", success_message.text, 
                         "Success message not displayed")
        except TimeoutException:
            self.fail("Email status message did not appear")
        
        # If we have admin access, we could check the admin dashboard here
        # to verify the email appears in the system
        
        print("End-to-end email flow test passed!")

if __name__ == "__main__":
    print("Starting Email Functionality Tests...")
    unittest.main(verbosity=2)

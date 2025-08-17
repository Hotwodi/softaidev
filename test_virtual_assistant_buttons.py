import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

class VirtualAssistantButtonTest(unittest.TestCase):
    """Test class for testing all buttons on the virtual assistant page"""
    
    @classmethod
    def setUpClass(cls):
        """Set up the test environment once before all tests"""
        service = Service(ChromeDriverManager().install())
        cls.driver = webdriver.Chrome(service=service)
        cls.base_url = "http://localhost:8080"  # Update this with your actual server URL
        cls.driver.maximize_window()
        
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
        
    def test_01_chat_button_primary(self):
        """Test the primary 'Start Chat' button functionality"""
        print("\nTesting primary 'Start Chat' button...")
        
        # Find and click the primary chat button
        chat_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "chat-button"))
        )
        chat_button.click()
        
        # Verify chat modal is displayed
        chat_modal = WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, "chat-modal"))
        )
        self.assertTrue(chat_modal.is_displayed(), "Chat modal did not open")
        
        # Enter a test message
        chat_input = self.driver.find_element(By.ID, "chat-input")
        test_message = "Hello, this is a test message"
        chat_input.send_keys(test_message)
        
        # Click send button
        send_button = self.driver.find_element(By.ID, "send-chat")
        send_button.click()
        
        # Wait for message to appear in chat
        time.sleep(2)  # Allow time for message to be processed
        
        # Verify message appears in chat window
        chat_messages = self.driver.find_element(By.ID, "chat-messages")
        self.assertIn(test_message, chat_messages.text, 
                     f"Test message '{test_message}' not found in chat window")
        
        # Wait for assistant response
        time.sleep(2)
        
        # Verify assistant responded
        self.assertIn("Assistant", chat_messages.text, 
                     "No assistant response received")
        
        print("Primary 'Start Chat' button test passed!")
        
    def test_02_chat_button_secondary(self):
        """Test the secondary 'Start Chat' button functionality"""
        print("\nTesting secondary 'Start Chat' button...")
        
        # Find and click the secondary chat button
        chat_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "chat-button-secondary"))
        )
        chat_button.click()
        
        # Verify chat modal is displayed
        chat_modal = WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, "chat-modal"))
        )
        self.assertTrue(chat_modal.is_displayed(), "Chat modal did not open")
        
        # Enter a test message
        chat_input = self.driver.find_element(By.ID, "chat-input")
        test_message = "This is a test from secondary button"
        chat_input.send_keys(test_message)
        
        # Click send button
        send_button = self.driver.find_element(By.ID, "send-chat")
        send_button.click()
        
        # Wait for message to appear in chat
        time.sleep(2)  # Allow time for message to be processed
        
        # Verify message appears in chat window
        chat_messages = self.driver.find_element(By.ID, "chat-messages")
        self.assertIn(test_message, chat_messages.text, 
                     f"Test message '{test_message}' not found in chat window")
        
        print("Secondary 'Start Chat' button test passed!")
        
    def test_03_email_button_primary(self):
        """Test the primary 'Send Email' button functionality"""
        print("\nTesting primary 'Send Email' button...")
        
        # Find and click the primary email button
        email_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "email-button"))
        )
        email_button.click()
        
        # Verify email modal is displayed
        email_modal = WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, "email-modal"))
        )
        self.assertTrue(email_modal.is_displayed(), "Email modal did not open")
        
        # Fill out the email form
        self.driver.find_element(By.ID, "email-name").send_keys("Test User")
        self.driver.find_element(By.ID, "email-address").send_keys("test@example.com")
        self.driver.find_element(By.ID, "email-subject").send_keys("Test Email Subject")
        self.driver.find_element(By.ID, "email-message").send_keys("This is a test email message.")
        
        # Click send email button
        send_button = self.driver.find_element(By.ID, "send-email")
        send_button.click()
        
        # Wait for success message
        try:
            success_message = WebDriverWait(self.driver, 5).until(
                EC.visibility_of_element_located((By.ID, "email-status"))
            )
            self.assertIn("success", success_message.get_attribute("class"), 
                         "Email was not sent successfully")
            self.assertIn("sent successfully", success_message.text, 
                         "Success message not displayed")
        except TimeoutException:
            self.fail("Email status message did not appear")
            
        print("Primary 'Send Email' button test passed!")
        
    def test_04_email_button_secondary(self):
        """Test the secondary 'Send Email' button functionality"""
        print("\nTesting secondary 'Send Email' button...")
        
        # Find and click the secondary email button
        email_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "email-button-secondary"))
        )
        email_button.click()
        
        # Verify email modal is displayed
        email_modal = WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, "email-modal"))
        )
        self.assertTrue(email_modal.is_displayed(), "Email modal did not open")
        
        # Fill out the email form
        self.driver.find_element(By.ID, "email-name").send_keys("Secondary Test")
        self.driver.find_element(By.ID, "email-address").send_keys("secondary@example.com")
        self.driver.find_element(By.ID, "email-subject").send_keys("Secondary Test Subject")
        self.driver.find_element(By.ID, "email-message").send_keys("This is a test from secondary button.")
        
        # Click send email button
        send_button = self.driver.find_element(By.ID, "send-email")
        send_button.click()
        
        # Wait for success message
        try:
            success_message = WebDriverWait(self.driver, 5).until(
                EC.visibility_of_element_located((By.ID, "email-status"))
            )
            self.assertIn("success", success_message.get_attribute("class"), 
                         "Email was not sent successfully")
        except TimeoutException:
            self.fail("Email status message did not appear")
            
        print("Secondary 'Send Email' button test passed!")
        
    def test_05_callback_button_primary(self):
        """Test the primary 'Request Callback' button functionality"""
        print("\nTesting primary 'Request Callback' button...")
        
        # Find and click the primary callback button
        callback_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "callback-button"))
        )
        callback_button.click()
        
        # Verify callback modal is displayed
        callback_modal = WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, "callback-modal"))
        )
        self.assertTrue(callback_modal.is_displayed(), "Callback modal did not open")
        
        # Fill out the callback form
        self.driver.find_element(By.ID, "callback-name").send_keys("Callback Test User")
        self.driver.find_element(By.ID, "callback-phone").send_keys("123-456-7890")
        self.driver.find_element(By.ID, "callback-reason").send_keys("This is a test callback request.")
        
        # Click request callback button
        request_button = self.driver.find_element(By.ID, "request-callback")
        request_button.click()
        
        # Wait for success message
        try:
            success_message = WebDriverWait(self.driver, 5).until(
                EC.visibility_of_element_located((By.ID, "callback-status"))
            )
            self.assertIn("success", success_message.get_attribute("class"), 
                         "Callback was not requested successfully")
            self.assertIn("submitted successfully", success_message.text, 
                         "Success message not displayed")
        except TimeoutException:
            self.fail("Callback status message did not appear")
            
        print("Primary 'Request Callback' button test passed!")
        
    def test_06_callback_button_secondary(self):
        """Test the secondary 'Request Callback' button functionality"""
        print("\nTesting secondary 'Request Callback' button...")
        
        # Find and click the secondary callback button
        callback_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "callback-button-secondary"))
        )
        callback_button.click()
        
        # Verify callback modal is displayed
        callback_modal = WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, "callback-modal"))
        )
        self.assertTrue(callback_modal.is_displayed(), "Callback modal did not open")
        
        # Fill out the callback form
        self.driver.find_element(By.ID, "callback-name").send_keys("Secondary Callback Test")
        self.driver.find_element(By.ID, "callback-phone").send_keys("987-654-3210")
        self.driver.find_element(By.ID, "callback-reason").send_keys("This is a test from secondary button.")
        
        # Click request callback button
        request_button = self.driver.find_element(By.ID, "request-callback")
        request_button.click()
        
        # Wait for success message
        try:
            success_message = WebDriverWait(self.driver, 5).until(
                EC.visibility_of_element_located((By.ID, "callback-status"))
            )
            self.assertIn("success", success_message.get_attribute("class"), 
                         "Callback was not requested successfully")
        except TimeoutException:
            self.fail("Callback status message did not appear")
            
        print("Secondary 'Request Callback' button test passed!")

if __name__ == "__main__":
    print("Starting Virtual Assistant Button Tests...")
    unittest.main(verbosity=2)

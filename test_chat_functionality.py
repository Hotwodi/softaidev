import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.keys import Keys

class ChatFunctionalityTest(unittest.TestCase):
    """Test class for testing chat functionality"""
    
    @classmethod
    def setUpClass(cls):
        """Set up the test environment once before all tests"""
        service = Service(ChromeDriverManager().install())
        cls.driver = webdriver.Chrome(service=service)
        cls.base_url = "http://localhost:8080"  # Update with your server URL
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
    
    def test_01_chat_modal_open_close(self):
        """Test opening and closing the chat modal"""
        print("\nTesting chat modal open/close functionality...")
        
        # Test primary button opens modal
        chat_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "chat-button"))
        )
        chat_button.click()
        
        # Verify chat modal is displayed
        chat_modal = WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, "chat-modal"))
        )
        self.assertTrue(chat_modal.is_displayed(), "Chat modal did not open with primary button")
        
        # Close modal by clicking outside
        self.driver.execute_script("arguments[0].click();", chat_modal)
        
        # Verify modal is closed
        WebDriverWait(self.driver, 10).until(
            EC.invisibility_of_element_located((By.ID, "chat-modal"))
        )
        
        # Test secondary button opens modal
        chat_button_secondary = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "chat-button-secondary"))
        )
        chat_button_secondary.click()
        
        # Verify chat modal is displayed
        chat_modal = WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, "chat-modal"))
        )
        self.assertTrue(chat_modal.is_displayed(), "Chat modal did not open with secondary button")
        
        # Close modal using X button if available
        try:
            close_button = chat_modal.find_element(By.CLASS_NAME, "close")
            close_button.click()
            
            # Verify modal is closed
            WebDriverWait(self.driver, 10).until(
                EC.invisibility_of_element_located((By.ID, "chat-modal"))
            )
        except:
            # If no close button, close by clicking outside again
            self.driver.execute_script("arguments[0].click();", chat_modal)
            
            # Verify modal is closed
            WebDriverWait(self.driver, 10).until(
                EC.invisibility_of_element_located((By.ID, "chat-modal"))
            )
        
        print("Chat modal open/close test passed!")
    
    def test_02_chat_message_sending(self):
        """Test sending chat messages"""
        print("\nTesting chat message sending...")
        
        # Open chat modal
        chat_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "chat-button"))
        )
        chat_button.click()
        
        # Verify chat modal is displayed
        chat_modal = WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, "chat-modal"))
        )
        
        # Get chat messages container to check if it's empty
        chat_messages = self.driver.find_element(By.ID, "chat-messages")
        initial_messages = chat_messages.text
        
        # Send a test message
        chat_input = self.driver.find_element(By.ID, "chat-input")
        test_message = "Hello, this is a test message"
        chat_input.send_keys(test_message)
        
        # Click send button
        send_button = self.driver.find_element(By.ID, "send-chat")
        send_button.click()
        
        # Wait for message to appear in chat
        time.sleep(2)  # Allow time for message to be processed
        
        # Verify message appears in chat window
        updated_messages = self.driver.find_element(By.ID, "chat-messages").text
        self.assertIn(test_message, updated_messages, 
                     f"Test message '{test_message}' not found in chat window")
        
        # Verify that input field is cleared after sending
        self.assertEqual("", chat_input.get_attribute("value"),
                        "Chat input field was not cleared after sending")
        
        print("Chat message sending test passed!")
    
    def test_03_chat_assistant_response(self):
        """Test assistant response to chat messages"""
        print("\nTesting assistant response...")
        
        # Open chat modal
        chat_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "chat-button"))
        )
        chat_button.click()
        
        # Send a test message
        chat_input = self.driver.find_element(By.ID, "chat-input")
        test_message = "Can you help me with a question?"
        chat_input.send_keys(test_message)
        send_button = self.driver.find_element(By.ID, "send-chat")
        send_button.click()
        
        # Wait for assistant response
        time.sleep(3)  # Allow time for assistant to respond
        
        # Verify assistant responded
        chat_messages = self.driver.find_element(By.ID, "chat-messages").text
        self.assertIn("Assistant", chat_messages, 
                     "No assistant response received")
        
        # Verify message structure
        message_elements = self.driver.find_elements(By.CLASS_NAME, "chat-message")
        self.assertGreaterEqual(len(message_elements), 2, 
                              "Expected at least 2 messages (user + assistant)")
        
        # Check that second message is from assistant
        assistant_message = message_elements[1]
        self.assertIn("assistant", assistant_message.get_attribute("class"),
                     "Second message is not from assistant")
        
        print("Assistant response test passed!")
    
    def test_04_chat_keyboard_interaction(self):
        """Test keyboard interaction with chat"""
        print("\nTesting chat keyboard interaction...")
        
        # Open chat modal
        chat_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "chat-button"))
        )
        chat_button.click()
        
        # Send a test message using Enter key
        chat_input = self.driver.find_element(By.ID, "chat-input")
        test_message = "This message is sent with Enter key"
        chat_input.send_keys(test_message)
        chat_input.send_keys(Keys.ENTER)
        
        # Wait for message to appear
        time.sleep(2)
        
        # Verify message appears in chat window
        chat_messages = self.driver.find_element(By.ID, "chat-messages").text
        self.assertIn(test_message, chat_messages, 
                     f"Enter key message '{test_message}' not found in chat window")
        
        print("Chat keyboard interaction test passed!")
    
    def test_05_multiple_chat_messages(self):
        """Test sending multiple chat messages in sequence"""
        print("\nTesting multiple chat messages...")
        
        # Open chat modal
        chat_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "chat-button"))
        )
        chat_button.click()
        
        # Send multiple messages
        messages = [
            "First test message",
            "Second test message",
            "Third test message"
        ]
        
        chat_input = self.driver.find_element(By.ID, "chat-input")
        
        for msg in messages:
            chat_input.send_keys(msg)
            send_button = self.driver.find_element(By.ID, "send-chat")
            send_button.click()
            time.sleep(1)  # Brief pause between messages
        
        # Wait for all messages and responses
        time.sleep(5)
        
        # Verify all user messages appear in chat window
        chat_messages = self.driver.find_element(By.ID, "chat-messages").text
        for msg in messages:
            self.assertIn(msg, chat_messages, 
                         f"Message '{msg}' not found in chat window")
        
        # Count message elements
        message_elements = self.driver.find_elements(By.CLASS_NAME, "chat-message")
        
        # Should have at least 3 user messages + some assistant responses
        self.assertGreaterEqual(len(message_elements), 3, 
                              "Not all messages appeared in chat")
        
        print("Multiple chat messages test passed!")

if __name__ == "__main__":
    print("Starting Chat Functionality Tests...")
    unittest.main(verbosity=2)

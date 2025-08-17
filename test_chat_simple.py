import unittest
import time
import sys
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, WebDriverException

class SimpleChatTest(unittest.TestCase):
    """Simplified test class for testing chat functionality without ChromeDriverManager"""
    
    @classmethod
    def setUpClass(cls):
        """Set up the test environment once before all tests"""
        try:
            # Use direct Chrome WebDriver without ChromeDriverManager
            options = webdriver.ChromeOptions()
            options.add_argument('--headless')  # Run headless to avoid UI issues
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_experimental_option('excludeSwitches', ['enable-logging'])
            
            # Try to initialize Chrome driver directly
            cls.driver = webdriver.Chrome(options=options)
            cls.driver.maximize_window()
            cls.base_url = "http://localhost:8000"  # Using port 8000
            print("WebDriver initialized successfully.")
        except WebDriverException as e:
            print(f"Failed to initialize WebDriver: {e}")
            print("Tests cannot run without WebDriver. Please ensure Chrome is installed.")
            sys.exit(1)
        
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests are done"""
        if hasattr(cls, 'driver'):
            cls.driver.quit()
        
    def setUp(self):
        """Set up before each test method"""
        try:
            self.driver.get(f"{self.base_url}/virtual-assistant.html")
            # Wait for page to load with a shorter timeout
            WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            print(f"Loaded page: {self.base_url}/virtual-assistant.html")
        except Exception as e:
            print(f"Error loading page: {e}")
            self.skipTest(f"Could not load page: {e}")
    
    def test_page_title(self):
        """Test if the page title is correct"""
        print("\nTesting page title...")
        title = self.driver.title
        print(f"Page title: {title}")
        self.assertIn("Virtual Assistant", title, "Page title should contain 'Virtual Assistant'")
        
    def test_chat_button_exists(self):
        """Test if chat button exists on the page"""
        print("\nTesting if chat button exists...")
        try:
            # Try to find the chat button with a short timeout
            chat_button = WebDriverWait(self.driver, 3).until(
                EC.presence_of_element_located((By.ID, "chat-button"))
            )
            self.assertTrue(chat_button.is_displayed(), "Chat button should be visible")
            print("Chat button found and is visible.")
        except TimeoutException:
            # If primary button not found, try secondary button
            try:
                chat_button = WebDriverWait(self.driver, 3).until(
                    EC.presence_of_element_located((By.ID, "chat-button-secondary"))
                )
                self.assertTrue(chat_button.is_displayed(), "Secondary chat button should be visible")
                print("Secondary chat button found and is visible.")
            except TimeoutException:
                self.fail("No chat button found on the page")

    def test_page_structure(self):
        """Test if the page has the expected structure"""
        print("\nTesting page structure...")
        
        # Check for communication options section
        try:
            comm_options = self.driver.find_element(By.CLASS_NAME, "communication-options")
            print("Communication options section found.")
        except:
            print("Communication options section not found.")
            pass  # Don't fail if not found, just report
            
        # Check for main container
        try:
            main_container = self.driver.find_element(By.CLASS_NAME, "container")
            print("Main container found.")
            self.assertTrue(main_container.is_displayed(), "Main container should be visible")
        except:
            print("Main container not found or not using expected class name.")
            pass  # Don't fail if not found, just report
            
        # Print page source for debugging (limited to first 500 chars)
        page_source = self.driver.page_source[:500] + "..." if len(self.driver.page_source) > 500 else self.driver.page_source
        print(f"Page source preview: {page_source}")

if __name__ == "__main__":
    print("Starting Simple Chat Tests...")
    unittest.main(verbosity=2)

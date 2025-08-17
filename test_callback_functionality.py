import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

class CallbackFunctionalityTest(unittest.TestCase):
    """Test class for testing callback request functionality"""
    
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
    
    def test_01_callback_form_validation(self):
        """Test callback form validation"""
        print("\nTesting callback form validation...")
        
        # Open callback modal
        callback_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "callback-button"))
        )
        callback_button.click()
        
        # Verify callback modal is displayed
        callback_modal = WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, "callback-modal"))
        )
        self.assertTrue(callback_modal.is_displayed(), "Callback modal did not open")
        
        # Test empty form submission
        request_button = self.driver.find_element(By.ID, "request-callback")
        request_button.click()
        
        # Check for validation error message
        error_message = WebDriverWait(self.driver, 5).until(
            EC.visibility_of_element_located((By.ID, "callback-status"))
        )
        self.assertIn("error", error_message.get_attribute("class"), 
                     "Validation error not shown for empty form")
        self.assertIn("required fields", error_message.text, 
                     "Wrong validation message for empty form")
        
        # Test partial form submission (only name)
        self.driver.find_element(By.ID, "callback-name").send_keys("Test User")
        request_button.click()
        
        # Check for validation error message
        error_message = WebDriverWait(self.driver, 5).until(
            EC.visibility_of_element_located((By.ID, "callback-status"))
        )
        self.assertIn("error", error_message.get_attribute("class"), 
                     "Validation error not shown for partial form")
        
        print("Callback form validation test passed!")
    
    def test_02_callback_time_selection(self):
        """Test callback time selection dropdown"""
        print("\nTesting callback time selection...")
        
        # Open callback modal
        callback_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "callback-button"))
        )
        callback_button.click()
        
        # Verify dropdown has expected options
        time_select = Select(self.driver.find_element(By.ID, "callback-time"))
        options = [option.text for option in time_select.options]
        
        self.assertIn("Morning", options[0], "Morning option not found")
        self.assertIn("Afternoon", options[1], "Afternoon option not found")
        self.assertIn("Evening", options[2], "Evening option not found")
        
        # Test selecting each option
        for index, option_text in enumerate(["morning", "afternoon", "evening"]):
            time_select.select_by_value(option_text)
            selected_option = time_select.first_selected_option
            self.assertEqual(option_text, selected_option.get_attribute("value"),
                           f"Failed to select {option_text} option")
        
        print("Callback time selection test passed!")
    
    def test_03_callback_submission_ui_feedback(self):
        """Test callback submission UI feedback"""
        print("\nTesting callback submission UI feedback...")
        
        # Open callback modal
        callback_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "callback-button"))
        )
        callback_button.click()
        
        # Fill out the callback form with valid data
        self.driver.find_element(By.ID, "callback-name").send_keys("Test User")
        self.driver.find_element(By.ID, "callback-phone").send_keys("123-456-7890")
        self.driver.find_element(By.ID, "callback-reason").send_keys("This is a test callback request.")
        
        # Select a time preference
        time_select = Select(self.driver.find_element(By.ID, "callback-time"))
        time_select.select_by_value("afternoon")
        
        # Click request callback button
        request_button = self.driver.find_element(By.ID, "request-callback")
        request_button.click()
        
        # Check for "submitting" status message
        submitting_message = WebDriverWait(self.driver, 5).until(
            EC.visibility_of_element_located((By.ID, "callback-status"))
        )
        self.assertIn("Submitting", submitting_message.text, 
                     "No 'Submitting' status shown")
        
        # Wait for success message
        success_message = WebDriverWait(self.driver, 10).until(
            lambda d: d.find_element(By.ID, "callback-status") and 
                      "submitted successfully" in d.find_element(By.ID, "callback-status").text
        )
        self.assertIn("success", success_message.get_attribute("class"), 
                     "Success status not shown after submission")
        
        # Check that form was cleared
        self.assertEqual("", self.driver.find_element(By.ID, "callback-name").get_attribute("value"),
                        "Name field was not cleared")
        self.assertEqual("", self.driver.find_element(By.ID, "callback-phone").get_attribute("value"),
                        "Phone field was not cleared")
        
        print("Callback submission UI feedback test passed!")
    
    def test_04_end_to_end_callback_flow(self):
        """Test end-to-end callback flow with UI and backend integration"""
        print("\nTesting end-to-end callback flow...")
        
        # Open callback modal from secondary button for variety
        callback_button = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "callback-button-secondary"))
        )
        callback_button.click()
        
        # Generate unique test data
        timestamp = int(time.time())
        test_name = f"E2E Callback User {timestamp}"
        test_phone = f"555-{timestamp % 1000}-{(timestamp // 1000) % 10000}"
        test_reason = f"This is an end-to-end test callback request. Timestamp: {timestamp}"
        
        # Fill out the callback form with test data
        self.driver.find_element(By.ID, "callback-name").send_keys(test_name)
        self.driver.find_element(By.ID, "callback-phone").send_keys(test_phone)
        
        # Select evening time slot
        time_select = Select(self.driver.find_element(By.ID, "callback-time"))
        time_select.select_by_value("evening")
        
        self.driver.find_element(By.ID, "callback-reason").send_keys(test_reason)
        
        # Click request callback button
        request_button = self.driver.find_element(By.ID, "request-callback")
        request_button.click()
        
        # Wait for success message
        try:
            success_message = WebDriverWait(self.driver, 10).until(
                EC.visibility_of_element_located((By.ID, "callback-status"))
            )
            self.assertIn("success", success_message.get_attribute("class"), 
                         "Callback was not submitted successfully")
            self.assertIn("submitted successfully", success_message.text, 
                         "Success message not displayed")
        except TimeoutException:
            self.fail("Callback status message did not appear")
        
        # If we have admin access, we could check the admin dashboard here
        # to verify the callback request appears in the system
        
        print("End-to-end callback flow test passed!")

if __name__ == "__main__":
    print("Starting Callback Functionality Tests...")
    unittest.main(verbosity=2)

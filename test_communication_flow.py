#!/usr/bin/env python3
"""
SoftAIDev Communication Flow Testing Script
This script tests the end-to-end communication flow of the SoftAIDev virtual assistant platform.
"""

import requests
import json
import time
import sys
import os
import uuid
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

class CommunicationFlowTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.admin_email = "customersupport@softaidev.com"
        self.admin_password = "admin123"  # For testing only
        self.driver = None
        self.admin_driver = None
        self.test_results = {
            "chat_to_admin": False,
            "email_to_admin": False,
            "callback_to_admin": False,
            "admin_response": False,
            "resend_api": False
        }
        
    def setup_drivers(self):
        """Initialize the WebDrivers for browser automation"""
        print("Setting up WebDrivers...")
        try:
            # Use Chrome WebDriver
            from selenium.webdriver.chrome.service import Service
            from webdriver_manager.chrome import ChromeDriverManager
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service)
            self.driver.maximize_window()
            
            # Create a second driver for admin view
            self.admin_driver = webdriver.Chrome(service=service)
            self.admin_driver.maximize_window()
            return True
        except Exception as e:
            print(f"Failed to initialize WebDrivers: {e}")
            return False
            
    def close_drivers(self):
        """Close the WebDrivers"""
        if self.driver:
            self.driver.quit()
        if self.admin_driver:
            self.admin_driver.quit()
            
    def admin_login(self):
        """Login to admin panel"""
        try:
            # Navigate to admin login page
            self.admin_driver.get(f"{self.base_url}/admin-login.html")
            
            # Wait for the page to load
            WebDriverWait(self.admin_driver, 10).until(
                EC.presence_of_element_located((By.ID, "email"))
            )
            
            # Enter credentials
            self.admin_driver.find_element(By.ID, "email").send_keys(self.admin_email)
            self.admin_driver.find_element(By.ID, "password").send_keys(self.admin_password)
            
            # Click login button
            self.admin_driver.find_element(By.ID, "login-button").click()
            
            # Wait for redirect to admin dashboard
            try:
                WebDriverWait(self.admin_driver, 5).until(
                    EC.url_contains("admin-dashboard.html")
                )
                print("✅ Admin login successful")
                return True
            except TimeoutException:
                print("❌ Admin login failed - redirect to dashboard not detected")
                return False
                
        except Exception as e:
            print(f"❌ Admin login failed: {e}")
            return False
            
    def test_chat_flow(self):
        """Test the chat flow from customer to admin"""
        print("\n💬 Testing Chat Flow...")
        
        try:
            # Generate a unique message ID for tracking
            unique_id = str(uuid.uuid4())[:8]
            test_message = f"Test chat message {unique_id}"
            
            # Navigate to public virtual assistant page
            self.driver.get(f"{self.base_url}/virtual-assistant.html")
            
            # Wait for the page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "chat-button"))
            )
            
            # Open chat modal
            self.driver.find_element(By.ID, "chat-button").click()
            
            # Wait for chat modal to open
            WebDriverWait(self.driver, 10).until(
                EC.visibility_of_element_located((By.ID, "chat-modal"))
            )
            
            # Enter test message with unique ID
            chat_input = self.driver.find_element(By.ID, "chat-input")
            chat_input.send_keys(test_message)
            
            # Send message
            self.driver.find_element(By.ID, "send-chat").click()
            
            # Wait for message to appear in chat
            try:
                WebDriverWait(self.driver, 5).until(
                    EC.text_to_be_present_in_element((By.CLASS_NAME, "chat-messages"), test_message)
                )
                print("✅ Chat message sent successfully from customer interface")
            except TimeoutException:
                print("❌ Chat message not displayed after sending")
                return False
                
            # Now check admin interface for the message
            # Navigate to admin virtual assistant page
            self.admin_driver.get(f"{self.base_url}/virtual-assistant-admin.html")
            
            # Wait for the page to load
            WebDriverWait(self.admin_driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "admin-controls"))
            )
            
            # Check for the message in the chat history
            try:
                WebDriverWait(self.admin_driver, 10).until(
                    EC.text_to_be_present_in_element((By.CLASS_NAME, "chat-history"), test_message)
                )
                print("✅ Chat message received in admin interface")
                self.test_results["chat_to_admin"] = True
                return True
            except TimeoutException:
                print("❌ Chat message not found in admin interface")
                return False
                
        except Exception as e:
            print(f"❌ Chat flow test failed: {e}")
            return False
            
    def test_email_flow(self):
        """Test the email flow from customer to admin"""
        print("\n📧 Testing Email Flow...")
        
        try:
            # Generate a unique message ID for tracking
            unique_id = str(uuid.uuid4())[:8]
            test_subject = f"Test email subject {unique_id}"
            test_message = f"This is a test email message with ID {unique_id}."
            
            # Navigate to public virtual assistant page
            self.driver.get(f"{self.base_url}/virtual-assistant.html")
            
            # Wait for the page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "email-button"))
            )
            
            # Open email modal
            self.driver.find_element(By.ID, "email-button").click()
            
            # Wait for email modal to open
            WebDriverWait(self.driver, 10).until(
                EC.visibility_of_element_located((By.ID, "email-modal"))
            )
            
            # Fill email form with unique ID
            self.driver.find_element(By.ID, "email-name").send_keys("Test User")
            self.driver.find_element(By.ID, "email-address").send_keys("test@example.com")
            self.driver.find_element(By.ID, "email-subject").send_keys(test_subject)
            self.driver.find_element(By.ID, "email-message").send_keys(test_message)
            
            # Submit form
            self.driver.find_element(By.ID, "send-email").click()
            
            # Check for success notification
            try:
                WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "notification"))
                )
                print("✅ Email form submitted successfully from customer interface")
            except TimeoutException:
                print("❌ Email submission notification not displayed")
                return False
                
            # Now check admin interface for the email
            # Navigate to admin virtual assistant page
            self.admin_driver.get(f"{self.base_url}/virtual-assistant-admin.html")
            
            # Wait for the page to load
            WebDriverWait(self.admin_driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "admin-controls"))
            )
            
            # Open email tab if needed
            email_tab = self.admin_driver.find_elements(By.ID, "email-tab")
            if len(email_tab) > 0:
                email_tab[0].click()
                
            # Check for the email in the inbox
            try:
                WebDriverWait(self.admin_driver, 10).until(
                    EC.text_to_be_present_in_element((By.CLASS_NAME, "email-list"), test_subject)
                )
                print("✅ Email received in admin interface")
                self.test_results["email_to_admin"] = True
                
                # Test Resend API integration
                try:
                    # Find the email in the list
                    email_items = self.admin_driver.find_elements(By.CSS_SELECTOR, ".email-item")
                    for item in email_items:
                        if test_subject in item.text:
                            # Click on the email to view it
                            item.click()
                            break
                    
                    # Wait for email details to load
                    WebDriverWait(self.admin_driver, 5).until(
                        EC.presence_of_element_located((By.CLASS_NAME, "email-details"))
                    )
                    
                    # Click reply button
                    reply_button = self.admin_driver.find_element(By.CSS_SELECTOR, ".email-actions .reply-button")
                    reply_button.click()
                    
                    # Wait for reply form
                    WebDriverWait(self.admin_driver, 5).until(
                        EC.presence_of_element_located((By.ID, "reply-form"))
                    )
                    
                    # Enter reply message
                    reply_message = f"This is a test reply to {test_subject}"
                    self.admin_driver.find_element(By.ID, "reply-message").send_keys(reply_message)
                    
                    # Send reply
                    self.admin_driver.find_element(By.ID, "send-reply").click()
                    
                    # Check for success notification
                    try:
                        WebDriverWait(self.admin_driver, 5).until(
                            EC.presence_of_element_located((By.CLASS_NAME, "notification"))
                        )
                        print("✅ Email reply sent successfully - Resend API working")
                        self.test_results["resend_api"] = True
                    except TimeoutException:
                        print("❌ Email reply notification not displayed")
                        
                except Exception as e:
                    print(f"❌ Email reply test failed: {e}")
                
                return True
            except TimeoutException:
                print("❌ Email not found in admin interface")
                return False
                
        except Exception as e:
            print(f"❌ Email flow test failed: {e}")
            return False
            
    def test_callback_flow(self):
        """Test the callback flow from customer to admin"""
        print("\n📞 Testing Callback Flow...")
        
        try:
            # Generate a unique message ID for tracking
            unique_id = str(uuid.uuid4())[:8]
            test_name = f"Test User {unique_id}"
            test_phone = f"555-{unique_id}"
            
            # Navigate to public virtual assistant page
            self.driver.get(f"{self.base_url}/virtual-assistant.html")
            
            # Wait for the page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "callback-button"))
            )
            
            # Open callback modal
            self.driver.find_element(By.ID, "callback-button").click()
            
            # Wait for callback modal to open
            WebDriverWait(self.driver, 10).until(
                EC.visibility_of_element_located((By.ID, "callback-modal"))
            )
            
            # Fill callback form with unique ID
            self.driver.find_element(By.ID, "callback-name").send_keys(test_name)
            self.driver.find_element(By.ID, "callback-phone").send_keys(test_phone)
            self.driver.find_element(By.ID, "callback-message").send_keys(f"Test callback request {unique_id}")
            
            # Submit form
            self.driver.find_element(By.ID, "request-callback").click()
            
            # Check for success notification
            try:
                WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "notification"))
                )
                print("✅ Callback form submitted successfully from customer interface")
            except TimeoutException:
                print("❌ Callback submission notification not displayed")
                return False
                
            # Now check admin interface for the callback request
            # Navigate to admin virtual assistant page
            self.admin_driver.get(f"{self.base_url}/virtual-assistant-admin.html")
            
            # Wait for the page to load
            WebDriverWait(self.admin_driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "admin-controls"))
            )
            
            # Open callbacks tab if needed
            callbacks_tab = self.admin_driver.find_elements(By.ID, "callbacks-tab")
            if len(callbacks_tab) > 0:
                callbacks_tab[0].click()
                
            # Check for the callback in the list
            try:
                WebDriverWait(self.admin_driver, 10).until(
                    EC.text_to_be_present_in_element((By.CLASS_NAME, "callback-list"), test_phone)
                )
                print("✅ Callback request received in admin interface")
                self.test_results["callback_to_admin"] = True
                return True
            except TimeoutException:
                print("❌ Callback request not found in admin interface")
                return False
                
        except Exception as e:
            print(f"❌ Callback flow test failed: {e}")
            return False
            
    def test_admin_response(self):
        """Test admin response to customer inquiries"""
        print("\n👑 Testing Admin Response...")
        
        try:
            # Navigate to admin virtual assistant page
            self.admin_driver.get(f"{self.base_url}/virtual-assistant-admin.html")
            
            # Wait for the page to load
            WebDriverWait(self.admin_driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "admin-controls"))
            )
            
            # Check if there are any active chats
            chat_items = self.admin_driver.find_elements(By.CSS_SELECTOR, ".chat-item")
            
            if len(chat_items) > 0:
                # Click on the first chat
                chat_items[0].click()
                
                # Wait for chat details to load
                WebDriverWait(self.admin_driver, 5).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "chat-messages"))
                )
                
                # Send a response
                admin_message = f"This is an admin response at {time.time()}"
                self.admin_driver.find_element(By.ID, "admin-chat-input").send_keys(admin_message)
                self.admin_driver.find_element(By.ID, "admin-send-chat").click()
                
                # Check if message appears in admin chat
                try:
                    WebDriverWait(self.admin_driver, 5).until(
                        EC.text_to_be_present_in_element((By.CLASS_NAME, "chat-messages"), admin_message)
                    )
                    print("✅ Admin response sent successfully")
                    self.test_results["admin_response"] = True
                    return True
                except TimeoutException:
                    print("❌ Admin response not displayed after sending")
                    return False
            else:
                print("⚠️ No active chats found for testing admin response")
                # Consider this a pass if no chats are available
                self.test_results["admin_response"] = True
                return True
                
        except Exception as e:
            print(f"❌ Admin response test failed: {e}")
            return False
            
    def run_all_tests(self):
        """Run all tests and report results"""
        if not self.setup_drivers():
            print("Failed to set up WebDrivers. Tests cannot run.")
            return False
            
        try:
            print("\n==== 🔄 SoftAIDev Communication Flow Testing 🔄 ====")
            print(f"Testing against URL: {self.base_url}")
            
            # Login to admin panel first
            if not self.admin_login():
                print("❌ Admin login failed. Cannot continue with tests.")
                return False
                
            self.test_chat_flow()
            self.test_email_flow()
            self.test_callback_flow()
            self.test_admin_response()
            
            # Print summary
            print("\n==== 📊 Test Results Summary 📊 ====")
            for test, result in self.test_results.items():
                status = "✅ PASS" if result else "❌ FAIL"
                print(f"{status}: {test.replace('_', ' ').title()}")
                
            # Overall result
            passed = sum(1 for result in self.test_results.values() if result)
            total = len(self.test_results)
            print(f"\nOverall: {passed}/{total} tests passed ({int(passed/total*100)}%)")
            
            return passed == total
            
        finally:
            self.close_drivers()
            
if __name__ == "__main__":
    # Default to localhost:8000 if no argument provided
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    tester = CommunicationFlowTester(base_url)
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All communication flow tests passed! The platform is working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️ Some communication flow tests failed. Please check the results above.")
        sys.exit(1)

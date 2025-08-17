#!/usr/bin/env python3
"""
SoftAIDev Virtual Assistant Testing Script
This script tests the functionality of the SoftAIDev virtual assistant platform.
"""

import requests
import json
import time
import sys
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

class VirtualAssistantTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.admin_email = "customersupport@softaidev.com"
        self.admin_password = "admin123"  # For testing only
        self.driver = None
        self.test_results = {
            "admin_auth": False,
            "public_interface": False,
            "email_functionality": False,
            "chat_functionality": False,
            "accessibility": False,
            "role_separation": False
        }
        
    def setup_driver(self):
        """Initialize the WebDriver for browser automation"""
        print("Setting up WebDriver...")
        try:
            # Use Chrome WebDriver
            from selenium.webdriver.chrome.service import Service
            from webdriver_manager.chrome import ChromeDriverManager
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service)
            self.driver.maximize_window()
            return True
        except Exception as e:
            print(f"Failed to initialize WebDriver: {e}")
            return False
            
    def close_driver(self):
        """Close the WebDriver"""
        if self.driver:
            self.driver.quit()
            
    def test_admin_authentication(self):
        """Test admin authentication functionality"""
        print("\n🔒 Testing Admin Authentication...")
        
        try:
            # Navigate to admin login page
            self.driver.get(f"{self.base_url}/admin-login.html")
            
            # Wait for the page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "email"))
            )
            
            # Enter credentials
            self.driver.find_element(By.ID, "email").send_keys(self.admin_email)
            self.driver.find_element(By.ID, "password").send_keys(self.admin_password)
            
            # Click login button
            self.driver.find_element(By.ID, "login-button").click()
            
            # Wait for redirect to admin dashboard
            try:
                WebDriverWait(self.driver, 5).until(
                    EC.url_contains("admin-dashboard.html")
                )
                print("✅ Admin authentication successful")
                self.test_results["admin_auth"] = True
            except TimeoutException:
                print("❌ Admin authentication failed - redirect to dashboard not detected")
                return False
                
            return True
            
        except Exception as e:
            print(f"❌ Admin authentication test failed: {e}")
            return False
            
    def test_public_interface(self):
        """Test the public virtual assistant interface"""
        print("\n🌐 Testing Public Virtual Assistant Interface...")
        
        try:
            # Navigate to public virtual assistant page
            self.driver.get(f"{self.base_url}/virtual-assistant.html")
            
            # Wait for the page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "assistant-container"))
            )
            
            # Check if admin controls are NOT present
            admin_elements = self.driver.find_elements(By.CLASS_NAME, "admin-controls")
            if len(admin_elements) > 0:
                print("❌ Admin controls found on public interface")
                return False
                
            # Check for communication options
            chat_button = self.driver.find_elements(By.ID, "chat-button")
            email_button = self.driver.find_elements(By.ID, "email-button")
            callback_button = self.driver.find_elements(By.ID, "callback-button")
            
            if len(chat_button) > 0 and len(email_button) > 0 and len(callback_button) > 0:
                print("✅ Public interface loaded with communication options")
                self.test_results["public_interface"] = True
                return True
            else:
                print("❌ Communication options not found on public interface")
                return False
                
        except Exception as e:
            print(f"❌ Public interface test failed: {e}")
            return False
            
    def test_admin_interface(self):
        """Test the admin virtual assistant interface"""
        print("\n👑 Testing Admin Virtual Assistant Interface...")
        
        try:
            # Navigate to admin virtual assistant page
            self.driver.get(f"{self.base_url}/virtual-assistant-admin.html")
            
            # Wait for the page to load or redirect
            time.sleep(3)
            
            # Check if redirected to login (expected behavior if not authenticated)
            if "login.html" in self.driver.current_url:
                print("✅ Unauthenticated access properly redirected to login")
                
                # Now login and try again
                self.driver.get(f"{self.base_url}/admin-login.html")
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.ID, "email"))
                )
                self.driver.find_element(By.ID, "email").send_keys(self.admin_email)
                self.driver.find_element(By.ID, "password").send_keys(self.admin_password)
                self.driver.find_element(By.ID, "login-button").click()
                
                # Navigate to admin virtual assistant page again
                self.driver.get(f"{self.base_url}/virtual-assistant-admin.html")
                
            # Check for admin controls
            try:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "admin-controls"))
                )
                print("✅ Admin controls found on admin interface")
                self.test_results["role_separation"] = True
                return True
            except TimeoutException:
                print("❌ Admin controls not found on admin interface")
                return False
                
        except Exception as e:
            print(f"❌ Admin interface test failed: {e}")
            return False
            
    def test_chat_functionality(self):
        """Test the chat functionality"""
        print("\n💬 Testing Chat Functionality...")
        
        try:
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
            
            # Enter test message
            chat_input = self.driver.find_element(By.ID, "chat-input")
            chat_input.send_keys("Hello, this is a test message")
            
            # Send message
            self.driver.find_element(By.ID, "send-chat").click()
            
            # Wait for message to appear in chat
            try:
                WebDriverWait(self.driver, 5).until(
                    EC.text_to_be_present_in_element((By.CLASS_NAME, "chat-messages"), "Hello, this is a test message")
                )
                print("✅ Chat message sent successfully")
                self.test_results["chat_functionality"] = True
                return True
            except TimeoutException:
                print("❌ Chat message not displayed after sending")
                return False
                
        except Exception as e:
            print(f"❌ Chat functionality test failed: {e}")
            return False
            
    def test_email_functionality(self):
        """Test the email functionality"""
        print("\n📧 Testing Email Functionality...")
        
        try:
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
            
            # Fill email form
            self.driver.find_element(By.ID, "email-name").send_keys("Test User")
            self.driver.find_element(By.ID, "email-address").send_keys("test@example.com")
            self.driver.find_element(By.ID, "email-subject").send_keys("Test Email Subject")
            self.driver.find_element(By.ID, "email-message").send_keys("This is a test email message.")
            
            # Submit form
            self.driver.find_element(By.ID, "send-email").click()
            
            # Check for success notification
            try:
                WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "notification"))
                )
                print("✅ Email form submitted successfully")
                self.test_results["email_functionality"] = True
                return True
            except TimeoutException:
                print("❌ Email submission notification not displayed")
                return False
                
        except Exception as e:
            print(f"❌ Email functionality test failed: {e}")
            return False
            
    def test_accessibility(self):
        """Test accessibility features"""
        print("\n♿ Testing Accessibility Features...")
        
        try:
            # Navigate to public virtual assistant page
            self.driver.get(f"{self.base_url}/virtual-assistant.html")
            
            # Wait for the page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Check for ARIA roles
            elements_with_roles = self.driver.find_elements(By.CSS_SELECTOR, "[role]")
            if len(elements_with_roles) > 0:
                print(f"✅ Found {len(elements_with_roles)} elements with ARIA roles")
            else:
                print("❌ No elements with ARIA roles found")
                return False
                
            # Check for alt text on images
            images = self.driver.find_elements(By.TAG_NAME, "img")
            images_with_alt = 0
            
            for img in images:
                if img.get_attribute("alt"):
                    images_with_alt += 1
                    
            if len(images) == 0 or images_with_alt / len(images) >= 0.9:
                print(f"✅ {images_with_alt}/{len(images)} images have alt text")
            else:
                print(f"❌ Only {images_with_alt}/{len(images)} images have alt text")
                
            # Check for skip links
            skip_links = self.driver.find_elements(By.CSS_SELECTOR, "a.skip-link")
            if len(skip_links) > 0:
                print("✅ Skip links found for accessibility")
            else:
                print("❌ No skip links found")
                
            # Overall accessibility check
            if len(elements_with_roles) > 0 and (len(images) == 0 or images_with_alt / len(images) >= 0.9):
                self.test_results["accessibility"] = True
                return True
            return False
                
        except Exception as e:
            print(f"❌ Accessibility test failed: {e}")
            return False
            
    def run_all_tests(self):
        """Run all tests and report results"""
        if not self.setup_driver():
            print("Failed to set up WebDriver. Tests cannot run.")
            return False
            
        try:
            print("\n==== 🤖 SoftAIDev Virtual Assistant Testing 🤖 ====")
            print(f"Testing against URL: {self.base_url}")
            
            self.test_admin_authentication()
            self.test_public_interface()
            self.test_admin_interface()
            self.test_chat_functionality()
            self.test_email_functionality()
            self.test_accessibility()
            
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
            self.close_driver()
            
if __name__ == "__main__":
    # Default to localhost:8000 if no argument provided
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    tester = VirtualAssistantTester(base_url)
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! The virtual assistant platform is working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️ Some tests failed. Please check the results above.")
        sys.exit(1)

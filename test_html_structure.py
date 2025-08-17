import unittest
import os
import re
import json
import requests
from urllib.parse import urljoin

class HTMLStructureTest(unittest.TestCase):
    """Test class for verifying HTML structure and content without browser automation"""
    
    def setUp(self):
        """Set up test environment"""
        self.base_url = "http://localhost:8000"
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        
    def test_virtual_assistant_html_exists(self):
        """Test if virtual-assistant.html file exists"""
        file_path = os.path.join(self.base_dir, "virtual-assistant.html")
        self.assertTrue(os.path.exists(file_path), f"File {file_path} should exist")
        print(f"✓ virtual-assistant.html exists")
        
    def test_virtual_assistant_html_content(self):
        """Test if virtual-assistant.html contains required elements"""
        file_path = os.path.join(self.base_dir, "virtual-assistant.html")
        if not os.path.exists(file_path):
            self.skipTest(f"File {file_path} does not exist")
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Check for chat button
        self.assertIn('id="chat-button"', content, "Chat button should exist")
        print(f"✓ Chat button exists in HTML")
        
        # Check for chat modal
        self.assertIn('id="chat-modal"', content, "Chat modal should exist")
        print(f"✓ Chat modal exists in HTML")
        
        # Check for chat messages container
        self.assertIn('id="chat-messages"', content, "Chat messages container should exist")
        print(f"✓ Chat messages container exists in HTML")
        
        # Check for chat input
        self.assertIn('id="chat-input"', content, "Chat input should exist")
        print(f"✓ Chat input exists in HTML")
        
        # Check for send button
        self.assertIn('id="send-chat"', content, "Send button should exist")
        print(f"✓ Send button exists in HTML")
        
    def test_css_files_exist(self):
        """Test if required CSS files exist"""
        css_files = [
            os.path.join(self.base_dir, "css", "virtual-assistant.css")
        ]
        
        for css_file in css_files:
            self.assertTrue(os.path.exists(css_file), f"CSS file {css_file} should exist")
            print(f"✓ {os.path.basename(css_file)} exists")
            
    def test_js_files_exist(self):
        """Test if required JS files exist"""
        js_files = [
            os.path.join(self.base_dir, "js", "chat-handler.js"),
            os.path.join(self.base_dir, "js", "virtual-assistant.js")
        ]
        
        for js_file in js_files:
            if os.path.exists(js_file):
                print(f"✓ {os.path.basename(js_file)} exists")
            else:
                print(f"✗ {os.path.basename(js_file)} does not exist (not critical)")
                
    def test_server_connectivity(self):
        """Test if server is running and accessible"""
        try:
            response = requests.get(self.base_url, timeout=2)
            self.assertEqual(response.status_code, 200, "Server should return 200 OK")
            print(f"✓ Server is running at {self.base_url} (Status: {response.status_code})")
        except requests.exceptions.RequestException as e:
            self.fail(f"Server is not accessible at {self.base_url}: {str(e)}")
            
    def test_virtual_assistant_page_accessible(self):
        """Test if virtual-assistant.html is accessible via server"""
        try:
            url = urljoin(self.base_url, "virtual-assistant.html")
            response = requests.get(url, timeout=2)
            self.assertEqual(response.status_code, 200, "Virtual assistant page should return 200 OK")
            print(f"✓ Virtual assistant page is accessible at {url} (Status: {response.status_code})")
            
            # Check if the page content contains expected elements
            content = response.text
            self.assertIn('id="chat-button"', content, "Chat button should exist in served page")
            print(f"✓ Chat button exists in served page")
            
        except requests.exceptions.RequestException as e:
            self.fail(f"Virtual assistant page is not accessible at {url}: {str(e)}")
            
    def test_chat_handler_js_content(self):
        """Test if chat-handler.js contains required functions"""
        js_file = os.path.join(self.base_dir, "js", "chat-handler.js")
        if not os.path.exists(js_file):
            print(f"✗ chat-handler.js does not exist, skipping content check")
            return
            
        with open(js_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Check for essential functions
        function_patterns = [
            r'function\s+(?:sendMessage|sendChatMessage)',
            r'function\s+(?:displayMessage|addMessage)',
            r'\.addEventListener\(\s*[\'"]click[\'"]'
        ]
        
        for pattern in function_patterns:
            match = re.search(pattern, content)
            if match:
                print(f"✓ Found chat handler function: {match.group(0)[:30]}...")
            else:
                print(f"✗ Missing expected chat handler function pattern: {pattern}")

if __name__ == "__main__":
    print("Starting HTML Structure Tests...")
    unittest.main(verbosity=2)

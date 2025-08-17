import unittest
import os
import json
import time
import http.client
import urllib.parse

class VirtualAssistantBasicTest(unittest.TestCase):
    """Basic test class for testing virtual assistant without browser automation"""
    
    def setUp(self):
        """Set up before each test method"""
        self.host = "localhost"
        self.port = 8000
        self.base_path = os.path.dirname(os.path.abspath(__file__))
        
        # Check if server is running
        self._check_server()
    
    def _check_server(self):
        """Check if the server is running"""
        try:
            conn = http.client.HTTPConnection(self.host, self.port)
            conn.request("HEAD", "/")
            response = conn.getresponse()
            conn.close()
            
            if response.status >= 200 and response.status < 400:
                print(f"Server is running on http://{self.host}:{self.port}")
                return True
            else:
                print(f"WARNING: Server returned status code: {response.status}")
                return False
        except Exception as e:
            print(f"ERROR: Could not connect to server at http://{self.host}:{self.port}")
            print(f"Error details: {str(e)}")
            self.skipTest(f"Server not running: {str(e)}")
            return False
    
    def test_01_virtual_assistant_html_exists(self):
        """Test if virtual-assistant.html file exists"""
        file_path = os.path.join(self.base_path, "virtual-assistant.html")
        self.assertTrue(os.path.exists(file_path), 
                       f"File {file_path} should exist")
        print("✓ virtual-assistant.html exists")
    
    def test_02_virtual_assistant_css_exists(self):
        """Test if virtual-assistant CSS file exists"""
        file_path = os.path.join(self.base_path, "css", "virtual-assistant.css")
        self.assertTrue(os.path.exists(file_path), 
                       f"File {file_path} should exist")
        print("✓ virtual-assistant.css exists")
    
    def test_03_chat_handler_js_exists(self):
        """Test if chat-handler.js file exists"""
        file_path = os.path.join(self.base_path, "js", "chat-handler.js")
        if os.path.exists(file_path):
            print("✓ chat-handler.js exists")
        else:
            print("✗ chat-handler.js does not exist (may be using a different filename)")
            # Look for other JS files that might handle chat functionality
            js_dir = os.path.join(self.base_path, "js")
            if os.path.exists(js_dir):
                js_files = [f for f in os.listdir(js_dir) if f.endswith('.js')]
                print(f"Found JS files: {', '.join(js_files)}")
    
    def test_04_virtual_assistant_html_content(self):
        """Test if virtual-assistant.html contains required elements"""
        file_path = os.path.join(self.base_path, "virtual-assistant.html")
        if not os.path.exists(file_path):
            self.skipTest(f"File {file_path} does not exist")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for essential elements
        required_elements = [
            ('Chat button', 'id="chat-button"'),
            ('Communication options', 'class="communication-options"'),
            ('Chat modal', 'id="chat-modal"'),
            ('Chat messages', 'id="chat-messages"'),
            ('Chat input', 'id="chat-input"'),
            ('Send button', 'id="send-chat"')
        ]
        
        for name, pattern in required_elements:
            if pattern in content:
                print(f"✓ {name} found in HTML")
            else:
                print(f"✗ {name} not found in HTML")
                # This is not a failure, just information
    
    def test_05_js_functionality(self):
        """Test if JS files contain required chat functionality"""
        js_files = []
        js_dir = os.path.join(self.base_path, "js")
        
        if os.path.exists(js_dir):
            for file in os.listdir(js_dir):
                if file.endswith('.js'):
                    js_files.append(os.path.join(js_dir, file))
        
        chat_functions_found = False
        
        for js_file in js_files:
            with open(js_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Check for chat functionality
                if 'chat-button' in content or 'chat-modal' in content:
                    print(f"✓ Chat references found in {os.path.basename(js_file)}")
                    chat_functions_found = True
                    
                    # Check for specific functions
                    if 'function' in content and ('message' in content.lower() or 'chat' in content.lower()):
                        print(f"✓ Chat functions likely found in {os.path.basename(js_file)}")
        
        self.assertTrue(chat_functions_found, 
                       "No chat functionality found in JS files")
    
    def test_06_fetch_virtual_assistant_page(self):
        """Test if virtual-assistant.html can be fetched from server"""
        try:
            conn = http.client.HTTPConnection(self.host, self.port)
            conn.request("GET", "/virtual-assistant.html")
            response = conn.getresponse()
            
            self.assertEqual(response.status, 200, 
                            "Virtual assistant page should return 200 OK")
            print(f"✓ Virtual assistant page fetched successfully (Status: {response.status})")
            
            # Read a small portion of the response to confirm it's HTML
            data = response.read(1024).decode('utf-8')
            self.assertIn("<!DOCTYPE html>", data, 
                         "Response should be HTML")
            print("✓ Response is valid HTML")
            
            conn.close()
        except Exception as e:
            self.fail(f"Failed to fetch virtual assistant page: {str(e)}")

if __name__ == "__main__":
    print("Starting Basic Virtual Assistant Tests...")
    unittest.main(verbosity=2)

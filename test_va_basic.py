import os
import sys
import json
import re

def print_header(text):
    """Print a formatted header"""
    print("\n" + "="*80)
    print(text)
    print("="*80)

def print_success(text):
    """Print a success message"""
    print(f"✓ {text}")

def print_warning(text):
    """Print a warning message"""
    print(f"⚠ {text}")

def print_error(text):
    """Print an error message"""
    print(f"✗ {text}")

def check_file_exists(file_path):
    """Check if a file exists"""
    if os.path.exists(file_path):
        print_success(f"File exists: {os.path.basename(file_path)}")
        return True
    else:
        print_error(f"File does not exist: {os.path.basename(file_path)}")
        return False

def check_html_elements(file_path, elements):
    """Check if HTML file contains required elements"""
    if not os.path.exists(file_path):
        print_error(f"Cannot check elements: {os.path.basename(file_path)} does not exist")
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        all_found = True
        for name, pattern in elements:
            if pattern in content:
                print_success(f"Found {name} in {os.path.basename(file_path)}")
            else:
                print_error(f"Missing {name} in {os.path.basename(file_path)}")
                all_found = False
        
        return all_found
    except Exception as e:
        print_error(f"Error reading {os.path.basename(file_path)}: {str(e)}")
        return False

def check_js_functions(file_path, functions):
    """Check if JS file contains required functions"""
    if not os.path.exists(file_path):
        print_error(f"Cannot check functions: {os.path.basename(file_path)} does not exist")
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        all_found = True
        for name, pattern in functions:
            if re.search(pattern, content):
                print_success(f"Found {name} in {os.path.basename(file_path)}")
            else:
                print_error(f"Missing {name} in {os.path.basename(file_path)}")
                all_found = False
        
        return all_found
    except Exception as e:
        print_error(f"Error reading {os.path.basename(file_path)}: {str(e)}")
        return False

def main():
    """Main function to test virtual assistant files"""
    base_path = os.path.dirname(os.path.abspath(__file__))
    print_header("VIRTUAL ASSISTANT BASIC TEST")
    print(f"Testing files in: {base_path}")
    
    # Track test results
    tests_passed = 0
    tests_failed = 0
    
    # Test 1: Check if required files exist
    print_header("TEST 1: FILE EXISTENCE")
    required_files = [
        os.path.join(base_path, "virtual-assistant.html"),
        os.path.join(base_path, "css", "virtual-assistant.css"),
        os.path.join(base_path, "js", "chat-handler.js"),
        os.path.join(base_path, "js", "virtual-assistant.js")
    ]
    
    for file_path in required_files:
        if check_file_exists(file_path):
            tests_passed += 1
        else:
            tests_failed += 1
    
    # Test 2: Check HTML elements
    print_header("TEST 2: HTML ELEMENTS")
    html_file = os.path.join(base_path, "virtual-assistant.html")
    html_elements = [
        ("Chat button", 'id="chat-button"'),
        ("Chat modal", 'id="chat-modal"'),
        ("Chat messages container", 'id="chat-messages"'),
        ("Chat input", 'id="chat-input"'),
        ("Send button", 'id="send-chat"'),
        ("Email form", 'id="email-modal"'),
        ("Callback form", 'id="callback-modal"')
    ]
    
    if check_html_elements(html_file, html_elements):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Test 3: Check JS functions
    print_header("TEST 3: JAVASCRIPT FUNCTIONS")
    js_file = os.path.join(base_path, "js", "chat-handler.js")
    js_functions = [
        ("Send chat message function", r"function\s+sendChatMessage"),
        ("Close chat modal function", r"function\s+closeChatModal"),
        ("Open chat function", r"function\s+openChat"),
        ("Chat handler class", r"class\s+ChatHandler"),
        ("DOM content loaded event", r"document\.addEventListener\(\s*['\"]\s*DOMContentLoaded\s*['\"]")
    ]
    
    if check_js_functions(js_file, js_functions):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Print summary
    print_header("TEST SUMMARY")
    print(f"Tests passed: {tests_passed}")
    print(f"Tests failed: {tests_failed}")
    
    if tests_failed == 0:
        print_success("All tests passed!")
        return 0
    else:
        print_warning(f"{tests_failed} tests failed. See details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

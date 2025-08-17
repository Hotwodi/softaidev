import os
import sys

# Get the base path
base_path = os.path.dirname(os.path.abspath(__file__))
print(f"Testing files in: {base_path}")

# Test 1: Check if required files exist
print("\n===== TEST 1: FILE EXISTENCE =====")
required_files = [
    os.path.join(base_path, "virtual-assistant.html"),
    os.path.join(base_path, "css", "virtual-assistant.css"),
    os.path.join(base_path, "js", "chat-handler.js"),
    os.path.join(base_path, "js", "virtual-assistant.js")
]

for file_path in required_files:
    if os.path.exists(file_path):
        print(f"✓ File exists: {os.path.basename(file_path)}")
    else:
        print(f"✗ File does not exist: {os.path.basename(file_path)}")

# Test 2: Check HTML elements
print("\n===== TEST 2: HTML ELEMENTS =====")
html_file = os.path.join(base_path, "virtual-assistant.html")
if os.path.exists(html_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    html_elements = [
        ("Chat button", 'id="chat-button"'),
        ("Chat modal", 'id="chat-modal"'),
        ("Chat messages container", 'id="chat-messages"'),
        ("Chat input", 'id="chat-input"'),
        ("Send button", 'id="send-chat"'),
        ("Email form", 'id="email-modal"'),
        ("Callback form", 'id="callback-modal"')
    ]
    
    for name, pattern in html_elements:
        if pattern in content:
            print(f"✓ Found {name} in virtual-assistant.html")
        else:
            print(f"✗ Missing {name} in virtual-assistant.html")
else:
    print("✗ Cannot check HTML elements: virtual-assistant.html does not exist")

# Test 3: Check JS functions
print("\n===== TEST 3: JAVASCRIPT FUNCTIONS =====")
js_file = os.path.join(base_path, "js", "chat-handler.js")
if os.path.exists(js_file):
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    js_functions = [
        ("Send chat message function", "sendChatMessage"),
        ("Close chat modal function", "closeChatModal"),
        ("Open chat function", "openChat"),
        ("Chat handler class", "ChatHandler"),
        ("DOM content loaded event", "DOMContentLoaded")
    ]
    
    for name, pattern in js_functions:
        if pattern in content:
            print(f"✓ Found {name} in chat-handler.js")
        else:
            print(f"✗ Missing {name} in chat-handler.js")
else:
    print("✗ Cannot check JS functions: chat-handler.js does not exist")

print("\n===== TEST COMPLETE =====")

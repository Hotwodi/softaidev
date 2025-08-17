import os
import sys

def check_file_exists(file_path):
    """Check if a file exists and print result"""
    if os.path.exists(file_path):
        print(f"✓ {file_path} exists")
        return True
    else:
        print(f"✗ {file_path} does not exist")
        return False

def check_html_content(file_path, elements_to_check):
    """Check if HTML file contains specified elements"""
    if not os.path.exists(file_path):
        print(f"Cannot check content of {file_path} - file does not exist")
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        all_found = True
        for name, pattern in elements_to_check:
            if pattern in content:
                print(f"✓ {name} found in {os.path.basename(file_path)}")
            else:
                print(f"✗ {name} not found in {os.path.basename(file_path)}")
                all_found = False
        
        return all_found
    except Exception as e:
        print(f"Error reading {file_path}: {str(e)}")
        return False

def main():
    """Main function to check virtual assistant files"""
    base_path = os.path.dirname(os.path.abspath(__file__))
    print(f"Checking files in: {base_path}")
    
    # Check HTML file
    va_html = os.path.join(base_path, "virtual-assistant.html")
    html_exists = check_file_exists(va_html)
    
    # Check CSS file
    va_css = os.path.join(base_path, "css", "virtual-assistant.css")
    check_file_exists(va_css)
    
    # Check JS directory
    js_dir = os.path.join(base_path, "js")
    if os.path.exists(js_dir) and os.path.isdir(js_dir):
        print(f"✓ JS directory exists")
        # List JS files
        js_files = [f for f in os.listdir(js_dir) if f.endswith('.js')]
        print(f"Found JS files: {', '.join(js_files)}")
    else:
        print(f"✗ JS directory does not exist")
    
    # Check HTML content if file exists
    if html_exists:
        elements_to_check = [
            ('Chat button', 'id="chat-button"'),
            ('Communication options', 'class="communication-options"'),
            ('Chat modal', 'id="chat-modal"'),
            ('Chat messages', 'id="chat-messages"'),
            ('Chat input', 'id="chat-input"'),
            ('Send button', 'id="send-chat"')
        ]
        check_html_content(va_html, elements_to_check)
    
    print("\nCheck completed.")

if __name__ == "__main__":
    main()

import os
import re

def update_footer(html_content):
    # Pattern to find the footer section
    footer_pattern = r'(<footer[^>]*>)(.*?)(</footer>)'
    
    # Replacement with privacy policy link
    replacement = (
        r'\1'
        r'<div style="text-align: center;">\2<br>'
        r'<a href="privacy-policy.html" style="color: #1a237e; text-decoration: underline;">Privacy Policy</a>'
        r'</div>'
        r'\3'
    )
    
    # Update the footer
    updated_content = re.sub(
        footer_pattern,
        replacement,
        html_content,
        flags=re.DOTALL
    )
    
    return updated_content

def main():
    # Get all HTML files in the current directory
    html_files = [f for f in os.listdir('.') if f.endswith('.html') and f != 'privacy-policy.html']
    
    for filename in html_files:
        try:
            with open(filename, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Skip if already has privacy policy link
            if 'privacy-policy.html' in content:
                print(f"Skipping {filename} - already has privacy policy link")
                continue
                
            updated_content = update_footer(content)
            
            with open(filename, 'w', encoding='utf-8') as file:
                file.write(updated_content)
            
            print(f"Updated footer in {filename}")
            
        except Exception as e:
            print(f"Error processing {filename}: {str(e)}")

if __name__ == "__main__":
    main()

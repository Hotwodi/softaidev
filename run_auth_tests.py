#!/usr/bin/env python3
"""
Run all authentication and authorization tests.
"""
import subprocess
import sys
import os
from pathlib import Path

def run_test(script_name, description):
    """Run a test script and print the result."""
    print(f"\n{'='*60}")
    print(f"RUNNING: {description}")
    print(f"{'='*60}")
    
    try:
        # Run the test script
        result = subprocess.run(
            [sys.executable, script_name],
            check=True,
            text=True,
            capture_output=True
        )
        print(result.stdout)
        print("✅ Test passed")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Test failed with exit code {e.returncode}")
        print("=== STDOUT ===")
        print(e.stdout)
        print("=== STDERR ===")
        print(e.stderr)
        return False
    except Exception as e:
        print(f"❌ Error running test: {str(e)}")
        return False

def main():
    """Main function to run all auth tests."""
    # Ensure we're in the correct directory
    os.chdir(Path(__file__).parent)
    
    print("🚀 Starting Authentication & Authorization Tests")
    print("="*60)
    
    # Run tests in order
    tests = [
        ("test_auth_flow.py", "Authentication Flow Test"),
        ("test_password_reset_flow.py", "Password Reset Flow Test"),
        ("test_auth_protection.py", "Authorization Protection Test")
    ]
    
    all_passed = True
    for script, description in tests:
        if not os.path.exists(script):
            print(f"\n❌ Test script not found: {script}")
            all_passed = False
            continue
            
        if not run_test(script, description):
            all_passed = False
    
    # Print final result
    print("\n" + "="*60)
    if all_passed:
        print("✅ All authentication tests passed successfully!")
    else:
        print("❌ Some tests failed. Please check the output above for details.")
    print("="*60)
    
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()

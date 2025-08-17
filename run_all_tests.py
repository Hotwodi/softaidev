import unittest
import time
import sys
import os

# Import all test classes
from test_virtual_assistant_buttons import VirtualAssistantButtonTest
from test_chat_functionality import ChatFunctionalityTest
from test_email_functionality import EmailFunctionalityTest
from test_callback_functionality import CallbackFunctionalityTest

def run_tests():
    """Run all test suites in sequence"""
    
    # Print header
    print("\n" + "="*80)
    print("VIRTUAL ASSISTANT COMPLETE TEST SUITE")
    print("="*80)
    print(f"Starting tests at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Testing against server: http://localhost:8080")
    print("="*80 + "\n")
    
    # Create test suite
    test_suite = unittest.TestSuite()
    loader = unittest.TestLoader()
    
    # Add all tests from each test class
    test_suite.addTest(loader.loadTestsFromTestCase(VirtualAssistantButtonTest))
    test_suite.addTest(loader.loadTestsFromTestCase(ChatFunctionalityTest))
    test_suite.addTest(loader.loadTestsFromTestCase(EmailFunctionalityTest))
    test_suite.addTest(loader.loadTestsFromTestCase(CallbackFunctionalityTest))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    print(f"Test completion time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    if result.wasSuccessful():
        print("\nALL TESTS PASSED SUCCESSFULLY!")
        return 0
    else:
        print("\nTESTS FAILED - See details above")
        return 1

if __name__ == "__main__":
    # Check if server is running
    import http.client
    
    try:
        conn = http.client.HTTPConnection("localhost", 8080)
        conn.request("HEAD", "/")
        response = conn.getresponse()
        conn.close()
        
        if response.status >= 200 and response.status < 400:
            print("Server is running on http://localhost:8080")
        else:
            print("WARNING: Server returned status code:", response.status)
            print("Tests may fail if the server is not properly running")
    except Exception as e:
        print("ERROR: Could not connect to server at http://localhost:8080")
        print("Please start the server before running tests with:")
        print("python -m http.server 8080")
        print(f"Error details: {str(e)}")
        sys.exit(1)
    
    # Run the tests
    sys.exit(run_tests())

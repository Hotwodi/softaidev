# Virtual Assistant Testing Guide

This guide explains how to run the automated tests for the virtual assistant interface buttons and functionality.

## Prerequisites

Before running the tests, make sure you have the following installed:

1. Python 3.7 or higher
2. Chrome browser
3. Required Python packages (install using the command below)

```bash
pip install -r test-requirements.txt
```

## Starting the Local Server

The tests require a local HTTP server running on port 8000. Start it with:

```bash
python -m http.server 8000
```

Keep this server running in a separate terminal window while you run the tests.

## Running the Tests

### Run All Tests

To run all tests at once, you can use the provided batch file:

```bash
run_tests.bat
```

This will start the local server, run the basic tests first, then execute all test suites in sequence, and provide a summary at the end.

Alternatively, you can run the test runner script directly:

```bash
python run_all_tests.py
```

### Run Individual Test Suites

You can also run specific test suites individually:

```bash
# Test all buttons
python test_virtual_assistant_buttons.py

# Test chat functionality
python test_chat_functionality.py

# Test email functionality
python test_email_functionality.py

# Test callback functionality
python test_callback_functionality.py

# Simplified chat test (doesn't require ChromeDriverManager)
python test_chat_simple.py

# Basic file structure and content test
python simple_va_test.py

# HTML structure test
python test_html_structure.py

# Virtual assistant basic test
python test_virtual_assistant_basic.py
```

## Test Coverage

The tests are organized in multiple levels of complexity:

### Basic Tests
- **File Structure Tests**: Check if required files exist
- **HTML Structure Tests**: Verify HTML elements are present
- **JavaScript Function Tests**: Confirm key JS functions are implemented

### Functional Tests
The functional tests cover the following functionality:

1. **Button Tests**:
   - Primary and secondary "Start Chat" buttons
   - Primary and secondary "Send Email" buttons
   - Primary and secondary "Request Callback" buttons

2. **Chat Tests**:
   - Opening/closing chat modal
   - Sending messages
   - Receiving assistant responses
   - Keyboard interaction
   - Multiple message sequences

3. **Email Tests**:
   - Form validation
   - UI feedback
   - Email sending (simulated and direct API if configured)
   - End-to-end flow

4. **Callback Tests**:
   - Form validation
   - Time selection
   - UI feedback
   - End-to-end flow

## Configuring Email API Testing

To test actual email sending with the Resend API:

1. Create a file named `email-config.json` with the following structure:

```json
{
  "RESEND_API_KEY": "your_resend_api_key",
  "FROM_EMAIL": "your_verified_sender@example.com",
  "TO_EMAIL": "recipient@example.com"
}
```

2. If this file is not present, the tests will still run but will skip direct API testing.

## Troubleshooting

If you encounter issues:

1. **WebDriver errors**: Make sure Chrome is installed and up to date
2. **Connection errors**: Verify the local server is running on port 8000
3. **Test failures**: Check the console output for specific error details

For element not found errors, you may need to increase wait times in the test scripts if your system is slower.

## Simplified Testing Approach

If you encounter issues with Selenium or ChromeDriverManager, you can use the simplified test scripts that don't rely on browser automation:

1. **simple_va_test.py**: Basic file existence and content check
2. **test_html_structure.py**: Verifies HTML structure without browser automation
3. **test_virtual_assistant_basic.py**: Tests basic functionality using HTTP requests
4. **test_chat_simple.py**: Simplified chat test that uses Chrome WebDriver directly

These tests provide a more reliable way to verify the basic functionality of the virtual assistant without the complexity of full browser automation.

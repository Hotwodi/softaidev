import os
import sys
import requests
import json
import time
from dotenv import load_dotenv
from urllib.parse import urljoin

# Configure logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def load_environment():
    """Load and validate required environment variables"""
    load_dotenv()
    
    config = {
        'supabase_url': os.getenv('SUPABASE_URL'),
        'supabase_key': os.getenv('SUPABASE_ANON_KEY'),
        'resend_api_key': os.getenv('RESEND_API_KEY')
    }
    
    missing = [k for k, v in config.items() if not v]
    if missing:
        logger.error(f"Missing required environment variables: {', '.join(missing)}")
        logger.info("Please check your .env file and make sure all required variables are set.")
        return None
        
    return config

def test_email_send():
    """Test the email sending functionality"""
    # Load and validate environment
    config = load_environment()
    if not config:
        return False
        
    # Prepare test data
    test_data = {
        "name": "Test User",
        "email": "test@example.com",
        "message": "This is a test message from the email test script",
        "subject": f"Test Email from Script - {time.strftime('%Y-%m-%d %H:%M:%S')}"
    }
    
    # Prepare request
    function_url = urljoin(config['supabase_url'], '/functions/v1/send-email')
    headers = {
        'Authorization': f'Bearer {config["supabase_key"]}',
        'Content-Type': 'application/json'
    }
    
    logger.info("Sending test email...")
    logger.debug(f"URL: {function_url}")
    logger.debug(f"Headers: {headers}")
    logger.debug(f"Payload: {json.dumps(test_data, indent=2)}")
    
    try:
        # Make the request with timeout
        start_time = time.time()
        response = requests.post(
            function_url,
            headers=headers,
            json=test_data,
            timeout=30
        )
        elapsed = (time.time() - start_time) * 1000
        
        # Log response details
        logger.info(f"Response Time: {elapsed:.2f}ms")
        logger.info(f"Status Code: {response.status_code}")
        
        try:
            response_data = response.json()
            logger.info("Response Body:")
            print(json.dumps(response_data, indent=2))
        except ValueError:
            logger.warning("Response is not valid JSON")
            logger.debug(f"Raw Response: {response.text}")
        
        if response.status_code == 200:
            logger.info("✅ Email sent successfully!")
            return True
        else:
            logger.error(f"❌ Failed to send email. Status: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request failed: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"❌ An unexpected error occurred: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    test_email_send()

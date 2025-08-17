// Test Communication Flows
// This script tests the end-to-end communication flows between customer and admin interfaces

// Import required modules
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/umd/supabase.min.js';
import { assistantService, emailService } from './js/services/assistantService.js';
import { checkAuth, checkAdminAuth, signIn, signOut } from './js/auth.js';

// Initialize Supabase client
const supabase = createClient(
  'https://glplnybcdgbyajdgzjrr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdi...'
);

// Test configuration
const config = {
  adminEmail: 'customer.support@softaidev.com',
  adminPassword: 'test-password', // Replace with actual test password
  testVisitorName: 'Test Visitor',
  testVisitorEmail: 'test@example.com',
  testMessage: 'This is a test message from the automated testing script',
  testSubject: 'Test Email Subject',
  testPhoneNumber: '+1234567890'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper functions
function logSuccess(message) {
  console.log(`✅ PASS: ${message}`);
  testResults.passed++;
  testResults.total++;
}

function logFailure(message, error) {
  console.error(`❌ FAIL: ${message}`);
  if (error) console.error(`   Error: ${error.message || error}`);
  testResults.failed++;
  testResults.total++;
}

function logInfo(message) {
  console.log(`ℹ️ INFO: ${message}`);
}

// Test functions
async function testAdminAuth() {
  try {
    logInfo('Testing admin authentication...');
    
    // Sign out any existing session
    await signOut();
    
    // Try to sign in with admin credentials
    const { data, error } = await signIn(config.adminEmail, config.adminPassword);
    
    if (error) {
      logFailure('Admin sign in failed', error);
      return false;
    }
    
    // Verify admin role
    const { isAdmin } = await checkAdminAuth();
    
    if (isAdmin) {
      logSuccess('Admin authentication successful');
      return true;
    } else {
      logFailure('User authenticated but not recognized as admin');
      return false;
    }
  } catch (error) {
    logFailure('Admin authentication test threw an exception', error);
    return false;
  }
}

async function testChatFlow() {
  try {
    logInfo('Testing chat communication flow...');
    
    // Generate a unique conversation ID for this test
    const testConversationId = `test-${Date.now()}`;
    
    // Step 1: Customer sends a message
    const visitorMessage = {
      conversationId: testConversationId,
      sender: 'visitor',
      message: config.testMessage,
      visitorName: config.testVisitorName,
      visitorEmail: config.testVisitorEmail
    };
    
    await assistantService.saveChatMessage(visitorMessage);
    logSuccess('Customer message sent successfully');
    
    // Step 2: Verify the message appears in the admin dashboard
    const { data: messages } = await assistantService.getChatHistory(testConversationId);
    
    if (!messages || messages.length === 0) {
      logFailure('Customer message not found in chat history');
      return false;
    }
    
    const foundMessage = messages.find(msg => 
      msg.conversation_id === testConversationId && 
      msg.sender === 'visitor' && 
      msg.message === config.testMessage
    );
    
    if (foundMessage) {
      logSuccess('Customer message found in admin dashboard');
    } else {
      logFailure('Customer message not found in admin dashboard');
      return false;
    }
    
    // Step 3: Admin sends a reply
    const adminReply = {
      conversationId: testConversationId,
      sender: 'assistant',
      message: `Reply to: ${config.testMessage}`
    };
    
    await assistantService.saveChatMessage(adminReply);
    logSuccess('Admin reply sent successfully');
    
    // Step 4: Verify the reply appears in the chat history
    const { data: updatedMessages } = await assistantService.getChatHistory(testConversationId);
    
    const foundReply = updatedMessages.find(msg => 
      msg.conversation_id === testConversationId && 
      msg.sender === 'assistant' && 
      msg.message === adminReply.message
    );
    
    if (foundReply) {
      logSuccess('Admin reply found in chat history');
      return true;
    } else {
      logFailure('Admin reply not found in chat history');
      return false;
    }
  } catch (error) {
    logFailure('Chat flow test threw an exception', error);
    return false;
  }
}

async function testEmailFlow() {
  try {
    logInfo('Testing email communication flow...');
    
    // Step 1: Customer sends an email
    const testEmail = {
      from_name: config.testVisitorName,
      from_email: config.testVisitorEmail,
      subject: config.testSubject,
      body: config.testMessage,
      status: 'received'
    };
    
    const { data: emailData, error: emailError } = await emailService.saveEmail(testEmail);
    
    if (emailError) {
      logFailure('Failed to save customer email', emailError);
      return false;
    }
    
    logSuccess('Customer email sent successfully');
    
    // Step 2: Verify the email appears in the admin dashboard
    const { data: emails } = await assistantService.getEmailHistory();
    
    const foundEmail = emails.find(email => 
      email.from_email === config.testVisitorEmail && 
      email.subject === config.testSubject
    );
    
    if (foundEmail) {
      logSuccess('Customer email found in admin dashboard');
    } else {
      logFailure('Customer email not found in admin dashboard');
      return false;
    }
    
    // Step 3: Admin sends a reply
    const replyEmail = {
      to_name: config.testVisitorName,
      to_email: config.testVisitorEmail,
      subject: `Re: ${config.testSubject}`,
      body: `This is a reply to: ${config.testMessage}`,
      status: 'sent',
      parent_email_id: foundEmail.email_id
    };
    
    const { data: replyData, error: replyError } = await emailService.saveEmail(replyEmail);
    
    if (replyError) {
      logFailure('Failed to save admin reply email', replyError);
      return false;
    }
    
    logSuccess('Admin reply email sent successfully');
    
    // Step 4: Verify the reply appears in the email history
    const { data: updatedEmails } = await assistantService.getEmailHistory();
    
    const foundReply = updatedEmails.find(email => 
      email.to_email === config.testVisitorEmail && 
      email.subject === replyEmail.subject
    );
    
    if (foundReply) {
      logSuccess('Admin reply email found in email history');
      return true;
    } else {
      logFailure('Admin reply email not found in email history');
      return false;
    }
  } catch (error) {
    logFailure('Email flow test threw an exception', error);
    return false;
  }
}

async function testCallFlow() {
  try {
    logInfo('Testing call communication flow...');
    
    // Step 1: Customer requests a callback
    const callbackRequest = {
      customer_name: config.testVisitorName,
      phone_number: config.testPhoneNumber,
      callback_request: true,
      call_type: 'incoming',
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    
    const { data: callData, error: callError } = await assistantService.saveCall(callbackRequest);
    
    if (callError) {
      logFailure('Failed to save callback request', callError);
      return false;
    }
    
    logSuccess('Customer callback request sent successfully');
    
    // Step 2: Verify the callback request appears in the admin dashboard
    const { data: calls } = await assistantService.getCallHistory();
    
    const foundCall = calls.find(call => 
      call.customer_name === config.testVisitorName && 
      call.phone_number === config.testPhoneNumber &&
      call.callback_request === true
    );
    
    if (foundCall) {
      logSuccess('Customer callback request found in admin dashboard');
    } else {
      logFailure('Customer callback request not found in admin dashboard');
      return false;
    }
    
    // Step 3: Admin marks the call as completed
    const updatedCall = {
      ...foundCall,
      status: 'completed',
      duration: 120, // 2 minutes
      notes: 'Test call completed successfully'
    };
    
    const { data: updateData, error: updateError } = await assistantService.updateCall(updatedCall);
    
    if (updateError) {
      logFailure('Failed to update call status', updateError);
      return false;
    }
    
    logSuccess('Admin marked call as completed successfully');
    
    // Step 4: Verify the call status is updated
    const { data: updatedCalls } = await assistantService.getCallHistory();
    
    const foundUpdatedCall = updatedCalls.find(call => 
      call.call_id === foundCall.call_id && 
      call.status === 'completed'
    );
    
    if (foundUpdatedCall) {
      logSuccess('Updated call status found in call history');
      return true;
    } else {
      logFailure('Updated call status not found in call history');
      return false;
    }
  } catch (error) {
    logFailure('Call flow test threw an exception', error);
    return false;
  }
}

async function testRealTimeSubscription() {
  try {
    logInfo('Testing real-time subscription for chat messages...');
    
    // Generate a unique conversation ID for this test
    const testConversationId = `test-rt-${Date.now()}`;
    
    // Set up a promise that will resolve when we receive the message via subscription
    const messageReceivedPromise = new Promise((resolve, reject) => {
      // Set a timeout to fail the test if we don't receive the message
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for real-time message'));
      }, 5000); // 5 second timeout
      
      // Subscribe to changes
      const subscription = supabase
        .channel('public:chat_messages')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `conversation_id=eq.${testConversationId}`
        }, (payload) => {
          clearTimeout(timeout);
          subscription.unsubscribe();
          resolve(payload.new);
        })
        .subscribe();
    });
    
    // Send a test message
    const testMessage = {
      conversationId: testConversationId,
      sender: 'visitor',
      message: 'Real-time test message',
      visitorName: config.testVisitorName,
      visitorEmail: config.testVisitorEmail
    };
    
    // Wait a moment before sending the message
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send the message
    await assistantService.saveChatMessage(testMessage);
    logSuccess('Test message sent for real-time subscription test');
    
    try {
      // Wait for the message to be received via subscription
      const receivedMessage = await messageReceivedPromise;
      
      if (receivedMessage.message === testMessage.message) {
        logSuccess('Message received via real-time subscription');
        return true;
      } else {
        logFailure('Received message does not match sent message');
        return false;
      }
    } catch (error) {
      logFailure('Failed to receive message via real-time subscription', error);
      return false;
    }
  } catch (error) {
    logFailure('Real-time subscription test threw an exception', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  logInfo('Starting end-to-end communication flow tests...');
  
  // Test admin authentication first
  const authSuccess = await testAdminAuth();
  
  if (!authSuccess) {
    logInfo('Skipping remaining tests due to authentication failure');
    return;
  }
  
  // Run all communication flow tests
  await testChatFlow();
  await testEmailFlow();
  await testCallFlow();
  await testRealTimeSubscription();
  
  // Print test summary
  logInfo('Test Summary:');
  logInfo(`Total Tests: ${testResults.total}`);
  logInfo(`Passed: ${testResults.passed}`);
  logInfo(`Failed: ${testResults.failed}`);
  
  if (testResults.failed === 0) {
    logInfo('All tests passed! 🎉');
  } else {
    logInfo('Some tests failed. Please review the logs above.');
  }
}

// Run tests when script is loaded
document.addEventListener('DOMContentLoaded', runAllTests);

const fetch = require('node-fetch');

async function testEmail() {
  try {
    const response = await fetch('https://glplnybcdgbyajdgzjrr.functions.supabase.co/functions/v1/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdieWFqZGd6anJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjMxOTQsImV4cCI6MjA3MDY5OTE5NH0.w8h4GWoJ1oOsxEAsol2Y3P5d6cmI46RoE4rs0iFFcoY'
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message from direct test'
      })
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmail();

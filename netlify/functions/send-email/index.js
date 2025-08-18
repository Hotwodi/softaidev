// Netlify function to handle sending emails via Resend API
exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Parse the request body
        const data = JSON.parse(event.body);
        const { name, email, message, subject, to } = data;

        // Validate required fields
        if (!name || !email || !message || !to) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Use environment variable for Resend API key
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error('RESEND_API_KEY is not set');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error' })
            };
        }

        // Send email using Resend API
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: 'SoftAIDev <noreply@softaidev.com>',
                to: to,
                bcc: 'delivered@resend.dev',
                subject: subject || 'New Contact Form Submission',
                html: `
                    <h2>New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                `
            })
        });

        const result = await resendResponse.json();

        if (!resendResponse.ok) {
            console.error('Resend API error:', result);
            return {
                statusCode: resendResponse.status,
                body: JSON.stringify({ error: 'Failed to send email', details: result })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully', data: result })
        };
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};

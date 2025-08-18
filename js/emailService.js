// Email service for sending order confirmations and notifications
import { supabase } from './supabaseClient.js';

export const emailService = {
    // Send order confirmation email
    async sendOrderConfirmation(email, orderDetails) {
        try {
            const { data, error } = await supabase.functions.invoke('send-order-confirmation', {
                body: JSON.stringify({
                    email,
                    order_id: orderDetails.orderId,
                    app_name: orderDetails.appName,
                    download_url: orderDetails.downloadUrl,
                    purchase_date: orderDetails.purchaseDate,
                    amount: orderDetails.amount,
                    customer_name: orderDetails.customerName
                })
            });

            if (error) {
                console.error('Error sending order confirmation:', error);
                return { success: false, error };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Exception in sendOrderConfirmation:', error);
            return { success: false, error };
        }
    },

    // Generate email content for order confirmation
    generateOrderConfirmationEmail(orderDetails) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Order Confirmation #${orderDetails.orderId}</h2>
                <p>Thank you for your purchase, ${orderDetails.customerName}!</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3>Order Details</h3>
                    <p><strong>Product:</strong> ${orderDetails.appName}</p>
                    <p><strong>Order Number:</strong> ${orderDetails.orderId}</p>
                    <p><strong>Purchase Date:</strong> ${new Date(orderDetails.purchaseDate).toLocaleString()}</p>
                    <p><strong>Amount:</strong> $${orderDetails.amount.toFixed(2)}</p>
                    
                    <div style="margin: 20px 0; text-align: center;">
                        <a href="${orderDetails.downloadUrl}" 
                           style="display: inline-block; padding: 12px 24px; 
                                  background: #4CAF50; color: white; 
                                  text-decoration: none; border-radius: 4px;">
                            Download Now
                        </a>
                        <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
                            This link will expire in 7 days.
                        </p>
                    </div>
                </div>
                
                <p>If you have any questions about your order, please contact our support team.</p>
                
                <p>Best regards,<br>The Tutankaten Team</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.8em; color: #777;">
                    <p>© ${new Date().getFullYear()} Tutankaten. All rights reserved.</p>
                </div>
            </div>
        `;
    }
};

export default emailService;

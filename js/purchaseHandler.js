import { emailService } from './emailService.js';
import { generateOrderId, formatDate } from './utils.js';

export class PurchaseHandler {
    constructor(supabase) {
        this.supabase = supabase;
    }

    async processSuccessfulPurchase(appId) {
        try {
            // Generate a unique order ID
            const orderId = generateOrderId();
            
            // Get app and user details
            const [{ data: app, error: appError }, { data: { user } }] = await Promise.all([
                this.supabase
                    .from('apps')
                    .select('*')
                    .eq('id', appId)
                    .single(),
                this.supabase.auth.getUser()
            ]);

            if (appError) throw appError;
            if (!user) throw new Error('User not authenticated');
            
            // Create purchase record
            const purchaseData = await this.createPurchaseRecord(user, app, orderId);
            
            // Send confirmation email
            await this.sendConfirmationEmail(user, app, purchaseData);
            
            // Update UI
            this.updatePurchaseUI(app, orderId);
            
            // Set up auto-redirect
            this.setupAutoRedirect(orderId);
            
            return { success: true, orderId };
        } catch (error) {
            console.error('Error processing purchase:', error);
            this.showError('Failed to process your purchase. Please contact support.');
            return { success: false, error };
        }
    }
    
    async createPurchaseRecord(user, app, orderId) {
        const purchaseData = {
            user_id: user.id,
            app_id: app.id,
            order_id: orderId,
            purchase_date: new Date().toISOString(),
            expiry_date: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            amount: app.price,
            currency: 'USD',
            download_url: app.download_url
        };
        
        const { data, error } = await this.supabase
            .from('purchases')
            .insert([purchaseData])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }
    
    async sendConfirmationEmail(user, app, purchaseData) {
        try {
            await emailService.sendOrderConfirmation(user.email, {
                orderId: purchaseData.order_id,
                appName: app.name,
                downloadUrl: purchaseData.download_url,
                purchaseDate: purchaseData.purchase_date,
                amount: app.price,
                customerName: user.user_metadata?.full_name || 'Customer'
            });
        } catch (error) {
            console.error('Error sending confirmation email:', error);
            // Don't fail the whole process if email fails
        }
    }
    
    updatePurchaseUI(app, orderId) {
        document.getElementById('orderNumber').textContent = orderId;
        document.getElementById('orderDate').textContent = new Date().toLocaleString();
        
        const orderDetails = document.getElementById('orderDetails');
        orderDetails.innerHTML = `
            <p><strong>Product:</strong> ${app.name}</p>
            <p><strong>Version:</strong> ${app.version || '1.0.0'}</p>
            <p><strong>Amount:</strong> $${app.price.toFixed(2)}</p>
        `;
        
        // Set up download button
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.href = app.download_url;
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = app.download_url;
        });
    }
    
    setupAutoRedirect(orderId) {
        // Store order ID for chat reference
        sessionStorage.setItem('lastOrderId', orderId);
        
        // Notify other tabs/windows about the purchase
        localStorage.setItem('purchase_completed', JSON.stringify({
            orderId,
            timestamp: Date.now()
        }));
        
        // Auto redirect to dashboard after delay
        setTimeout(() => {
            window.location.href = `dashboard.html?order=${orderId}`;
        }, 10000);
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = 'color: #d32f2f; background: #ffebee; padding: 15px; border-radius: 4px; margin: 20px 0;';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        const container = document.querySelector('.purchase-success') || document.body;
        container.prepend(errorDiv);
    }
}

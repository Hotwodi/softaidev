// Use the global Supabase client that's already initialized in supabase-config.js

// DOM Elements
const appGrid = document.getElementById('appGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortBy = document.getElementById('sortBy');
const priceMinInput = document.getElementById('priceMin');
const priceMaxInput = document.getElementById('priceMax');
const modal = document.getElementById('appModal');
const closeBtn = document.querySelector('.close-btn');

// Variable to store apps data fetched from Supabase
let apps = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await fetchApps();
        setupEventListeners();
        // Default sort: Price High to Low
        if (sortBy) sortBy.value = 'price_desc';
        filterAndSortApps();
    } catch (error) {
        console.error('Error initializing app:', error);
        appGrid.innerHTML = '<div class="error-message">Failed to load apps. Please try again later.</div>';
    }
});

// Fetch products from Supabase
async function fetchApps() {
    console.log('Fetching products from Supabase...');
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
        
        console.log(`Successfully fetched ${data?.length || 0} products`);
        apps = data || [];
        return apps;
    } catch (error) {
        console.error('Error in fetchApps:', error);
        throw error;
    }
}

// Render apps to the grid
function renderApps(appsToRender) {
    appGrid.innerHTML = '';
    
    if (appsToRender.length === 0) {
        appGrid.innerHTML = '<div class="no-results">No apps found matching your criteria.</div>';
        return;
    }
    
    appsToRender.forEach(app => {
        const appCard = createAppCard(app);
        appGrid.appendChild(appCard);
    });
}

// Create app card element
function createAppCard(app) {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.dataset.id = app.id;
    
    // Format the rating stars
    const stars = Array(5).fill('').map((_, i) => 
        i < Math.floor(app.rating) ? '<i class="fas fa-star"></i>' : 
        (i < Math.ceil(app.rating) ? '<i class="fas fa-star-half-alt"></i>' : 
        '<i class="far fa-star"></i>')
    ).join('');
    
    card.innerHTML = `
        <div class="app-card-image" style="background-image: url('${app.icon_url || 'https://via.placeholder.com/300x200?text=No+Image'}')"></div>
        <div class="app-card-content">
            <div class="app-card-header">
                <img src="${app.icon_url || 'https://via.placeholder.com/50?text=Icon'}" alt="${app.name} Icon" class="app-icon">
                <div class="app-card-title">
                    <h3>${app.name}</h3>
                    <span class="app-card-category">${app.category || 'General'}</span>
                </div>
            </div>
            <p class="app-card-description">${app.description || 'No description available'}</p>
            <div class="app-card-footer">
                <div class="app-rating">
                    ${stars}
                    <span>(${app.download_count || 0} downloads)</span>
                </div>
                <button class="buy-btn" data-id="${app.id}" data-button-id="${app.paypal_button_id}" data-price="${app.price}" data-name="${app.name}" data-type="${app.type}">
                    <i class="fas fa-shopping-cart"></i> Buy $${parseFloat(app.price).toFixed(2)}
                </button>
            </div>
        </div>
    `;
    
    // Add click event to view app details
    card.addEventListener('click', (e) => {
        const isDownloadBtn = e.target.closest('.download-btn');
        const isBuyBtn = e.target.closest('.buy-btn');
        
        if (!isDownloadBtn && !isBuyBtn) {
            openAppModal(app);
        } else if (isDownloadBtn) {
            e.preventDefault();
            e.stopPropagation();
            requestDownload(app.id);
        } else if (isBuyBtn) {
            e.preventDefault();
            e.stopPropagation();
            openPayPalPayment(app);
        }
    });
    
    return card;
}

// Open app details modal
function openAppModal(app) {
    const modal = document.getElementById('appModal');
    const modalTitle = document.getElementById('appModalTitle');
    
    // Update modal content with app details
    modalTitle.textContent = app.name;
    document.querySelector('.app-icon-large').src = app.icon_url || 'https://via.placeholder.com/100?text=Icon';
    document.querySelector('.version').textContent = `v${app.version || '1.0.0'}`;
    document.querySelector('.category').textContent = app.category || 'General';
    document.querySelector('.app-description').textContent = app.description || 'No description available';
    
    // Update download button
    const downloadBtn = document.querySelector('.download-btn');
    downloadBtn.dataset.id = app.id;
    downloadBtn.dataset.type = app.type;
    
    // Update screenshots if available
    const screenshotsContainer = document.querySelector('.screenshots');
    screenshotsContainer.innerHTML = '';
    if (app.screenshots && app.screenshots.length > 0) {
        app.screenshots.forEach(screenshot => {
            const img = document.createElement('img');
            img.src = screenshot;
            img.alt = `${app.name} screenshot`;
            screenshotsContainer.appendChild(img);
        });
    } else {
        const noScreenshots = document.createElement('p');
        noScreenshots.textContent = 'No screenshots available';
        screenshotsContainer.appendChild(noScreenshots);
    }
    
    // Show the modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Filter and sort apps
function filterAndSortApps() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const sortMethod = sortBy.value;
    const minPrice = priceMinInput && priceMinInput.value !== '' ? parseFloat(priceMinInput.value) : null;
    const maxPrice = priceMaxInput && priceMaxInput.value !== '' ? parseFloat(priceMaxInput.value) : null;
    
    let filteredApps = [...apps];
    
    // Filter by search term
    if (searchTerm) {
        filteredApps = filteredApps.filter(app => 
            app.name.toLowerCase().includes(searchTerm) || 
            app.description.toLowerCase().includes(searchTerm) ||
            app.category.includes(searchTerm)
        );
    }
    
    // Filter by category
    if (selectedCategory) {
        filteredApps = filteredApps.filter(app => app.category === selectedCategory);
    }

    // Filter by price range
    if (minPrice !== null) {
        filteredApps = filteredApps.filter(app => parseFloat(app.price || 0) >= minPrice);
    }
    if (maxPrice !== null) {
        filteredApps = filteredApps.filter(app => parseFloat(app.price || 0) <= maxPrice);
    }
    
    // Sort apps
    filteredApps.sort((a, b) => {
        switch(sortMethod) {
            case 'price_desc':
                return parseFloat(b.price || 0) - parseFloat(a.price || 0);
            case 'price_asc':
                return parseFloat(a.price || 0) - parseFloat(b.price || 0);
            case 'newest':
                return new Date(b.updated || b.created_at || 0) - new Date(a.updated || a.created_at || 0);
            case 'popular':
                return parseDownloads(b.download_count || '0') - parseDownloads(a.download_count || '0');
            case 'name':
                return (a.name || '').localeCompare(b.name || '');
            default:
                return 0;
        }
    });
    
    renderApps(filteredApps);
}

// Helper function to parse download counts
function parseDownloads(downloadStr) {
    if (downloadStr.includes('K')) {
        return parseFloat(downloadStr) * 1000;
    } else if (downloadStr.includes('M')) {
        return parseFloat(downloadStr) * 1000000;
    }
    return parseInt(downloadStr) || 0;
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', debounce(filterAndSortApps, 300));
    
    // Filter and sort controls
    categoryFilter.addEventListener('change', filterAndSortApps);
    sortBy.addEventListener('change', filterAndSortApps);
    
    // Close modal
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Handle buy button clicks in the grid
    appGrid.addEventListener('click', (e) => {
        const buyBtn = e.target.closest('.buy-btn');
        if (buyBtn && buyBtn.dataset.id) {
            e.stopPropagation();
            const app = apps.find(a => a.id === parseInt(buyBtn.dataset.id));
            if (app) {
                openPayPalPayment(app);
            }
        }
    });

    // Price range listeners
    if (priceMinInput) priceMinInput.addEventListener('input', debounce(filterAndSortApps, 300));
    if (priceMaxInput) priceMaxInput.addEventListener('input', debounce(filterAndSortApps, 300));
}

// Handle PayPal payment
async function openPayPalPayment(product) {
    try {
        // Record purchase attempt
        const { error } = await supabase
            .from('purchase_attempts')
            .insert([
                { 
                    product_id: product.id,
                    product_name: product.name,
                    product_type: product.type,
                    price: product.price,
                    status: 'initiated',
                    user_agent: navigator.userAgent,
                    ip_address: '' // This would be captured server-side in a real app
                }
            ]);
            
        if (error) {
            console.error('Error recording purchase attempt:', error);
            // Continue with payment flow even if logging fails
        }
        
        // Create a form to submit to PayPal
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://www.paypal.com/cgi-bin/webscr';
        
        // Add PayPal form fields
        const addField = (name, value) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };
        
        // Basic PayPal fields
        addField('cmd', '_s-xclick');
        addField('hosted_button_id', product.paypal_button_id);
        addField('business', 'your-paypal-email@example.com'); // Replace with your PayPal email
        addField('item_name', product.name);
        addField('amount', product.price);
        addField('currency_code', 'USD');
        
        // Custom fields to track the purchase
        addField('custom', JSON.stringify({
            product_id: product.id,
            product_type: product.type,
            user_id: (await supabase.auth.getUser()).data.user?.id || 'guest'
        }));
        
        // Add success and cancel URLs
        const returnUrl = `${window.location.origin}/purchase-success.html?product_id=${product.id}`;
        const cancelUrl = `${window.location.origin}/marketplace.html`;
        
        addField('return', returnUrl);
        addField('cancel_return', cancelUrl);
        addField('notify_url', `${window.location.origin}/api/paypal-ipn`);
        
        // Add the form to the page and submit it
        document.body.appendChild(form);
        form.submit();
        
    } catch (error) {
        console.error('Error in openPayPalPayment:', error);
        alert('There was an error processing your payment. Please try again.');
    }
}

// Function to ensure user is authenticated
async function ensureAuthenticated() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!session || error) {
        // Store the intended URL to redirect after login
        localStorage.setItem('redirectAfterLogin', window.location.href);
        // Redirect to login page
        window.location.href = 'login.html?message=Please sign in to download apps';
        throw new Error('Authentication required');
    }
    return session.user;
}

// Function to record a download in the database
async function recordDownload(productId, userId) {
    try {
        // Record the download in purchases table
        const { error } = await supabase
            .from('purchases')
            .insert([
                { 
                    user_id: userId,
                    product_id: productId,
                    purchase_date: new Date().toISOString(),
                    status: 'completed',
                    amount: 0
                }
            ]);
            
        if (error) throw error;
        
        // Increment download count
        const { error: updateError } = await supabase
            .from('products')
            .update({ download_count: supabase.rpc('increment') })
            .eq('id', productId);
        
        if (updateError) throw updateError;
        
        return true;
    } catch (error) {
        console.error('Error recording download:', error);
        return false;
    }
}

// Function to request secure download URL
async function requestDownload(productId) {
    try {
        // First ensure user is authenticated
        const user = await ensureAuthenticated();
        
        // Get product details
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
            
        if (productError || !product) {
            throw new Error('Product not found');
        if (appError || !app) {
            throw new Error('App not found');
        }
        
        // Check if app is free or paid
        if (app.price > 0) {
            // For paid apps, check if user has purchased it
            const { data: purchase, error: purchaseError } = await supabase
                .from('purchases')
                .select('*')
                .eq('app_id', appId)
                .eq('user_id', user.id)
                .gt('expiry_date', new Date().toISOString())
                .single();
                
            if (purchaseError || !purchase) {
                // Redirect to purchase page if not purchased or expired
                window.location.href = `purchase.html?app_id=${app.id}`;
                return;
            }
        }
        
        // Get secure download URL
        const res = await fetch(
            'https://glplnybcdgbyajdgzjrr.functions.supabase.co/get-download-url',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
                },
                body: JSON.stringify({ 
                    app_id: appId,
                    user_id: user.id 
                })
            }
        );

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Download failed');
        }

        const { url, expires_in = 600 } = await res.json();
        
        // Record the download
        await recordDownload(appId, user.id);
        
        // Show expiry message
        const message = document.createElement('div');
        message.className = 'alert alert-info';
        message.innerHTML = [
            '<i class="fas fa-download"></i>',
            '<span>Download link expires in ', Math.ceil(expires_in / 60), ' minutes. ',
            app.price > 0 ? 'Your purchase is valid for 2 years.' : '',
            '</span>'
        ].join('');
        document.querySelector('.marketplace-container')?.prepend(message);
        setTimeout(() => message.remove(), 10000);

        // Start download
        window.location.href = url;
    } catch (error) {
        console.error('Download error:', error);
        alert(`Error: ${error.message}`);
    }
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Add animation on scroll
function animateOnScroll() {
    const cards = document.querySelectorAll('.app-card');
    cards.forEach(card => {
        const cardPosition = card.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        
        if (cardPosition < screenPosition) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }
    });
}

// Initial animation setup
window.addEventListener('load', () => {
    const cards = document.querySelectorAll('.app-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
    });
    
    // Trigger animation
    setTimeout(animateOnScroll, 100);
});

window.addEventListener('scroll', animateOnScroll);

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

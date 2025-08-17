// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/umd/supabase.min.js';

// Initialize Supabase client with project credentials
const supabase = createClient(
  'https://glplnybcdgbyajdgzjrr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxueWJjZGdi...'
);

// DOM Elements
const appGrid = document.getElementById('appGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortBy = document.getElementById('sortBy');
const modal = document.getElementById('appModal');
const closeBtn = document.querySelector('.close-btn');

// Variable to store apps data fetched from Supabase
let apps = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await fetchApps();
        renderApps(apps);
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing app:', error);
        appGrid.innerHTML = '<div class="error-message">Failed to load apps. Please try again later.</div>';
    }
});

// Fetch apps from Supabase
async function fetchApps() {
    console.log('Fetching apps from Supabase...');
    try {
        const { data, error } = await supabase
            .from('apps')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching apps:', error);
            throw error;
        }
        
        console.log(`Successfully fetched ${data?.length || 0} apps`);
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
        <div class="app-card-image" style="background-image: url('${app.image}')"></div>
        <div class="app-card-content">
            <div class="app-card-header">
                <img src="${app.icon}" alt="${app.name} Icon" class="app-icon">
                <div class="app-card-title">
                    <h3>${app.name}</h3>
                    <span class="app-card-category">${formatCategory(app.category)}</span>
                </div>
            </div>
            <p class="app-card-description">${app.description}</p>
            <div class="app-card-footer">
                <div class="app-rating">
                    ${stars}
                    <span>(${app.downloads})</span>
                </div>
                ${app.is_paid 
                    ? `<button class="buy-btn" data-id="${app.id}" data-button-id="${app.paypal_button_id}" data-price="${app.price}" data-name="${app.name}">
                        <i class="fas fa-shopping-cart"></i> Buy $${app.price.toFixed(2)}
                    </button>`
                    : `<button class="download-btn" data-id="${app.id}">
                        <i class="fas fa-download"></i> Download
                    </button>`
                }
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
    const modalTitle = modal.querySelector('.app-title');
    const modalVersion = modal.querySelector('.version');
    const modalCategory = modal.querySelector('.category');
    const modalRating = modal.querySelector('.rating');
    const modalDescription = modal.querySelector('.app-description');
    const modalPermissions = modal.querySelector('.permissions-list');
    const modalScreenshots = modal.querySelector('.app-screenshots');
    const modalIcon = modal.querySelector('.app-icon-large');
    const downloadBtn = modal.querySelector('.download-btn');
    
    // Set app details
    modalTitle.textContent = app.name;
    modalVersion.textContent = `v${app.version}`;
    modalCategory.textContent = formatCategory(app.category);
    modalDescription.textContent = app.description;
    modalIcon.src = app.icon;
    modalIcon.alt = `${app.name} Icon`;
    
    // Set buy button
    downloadBtn.innerHTML = `<i class="fas fa-shopping-cart"></i> Buy $${app.price.toFixed(2)}`;
    downloadBtn.onclick = () => {
        openPayPalPayment(app);
    };
    
    // Set rating
    const ratingStars = Array(5).fill('').map((_, i) => 
        i < Math.floor(app.rating) ? '<i class="fas fa-star"></i>' : 
        (i < Math.ceil(app.rating) ? '<i class="fas fa-star-half-alt"></i>' : 
        '<i class="far fa-star"></i>')
    ).join('');
    
    modalRating.innerHTML = `${ratingStars}<span class="rating-count">(${app.rating}/5.0, ${app.downloads} downloads)</span>`;
    
    // Set permissions
    modalPermissions.innerHTML = app.permissions
        .map(permission => `<li>${permission}</li>`)
        .join('');
    
    // Set screenshots
    modalScreenshots.innerHTML = app.screenshots
        .map((screenshot, index) => `
            <div class="screenshot">
                <img src="${screenshot}" alt="${app.name} Screenshot ${index + 1}">
            </div>
        `)
        .join('');
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Format category for display
function formatCategory(category) {
    return category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Filter and sort apps
function filterAndSortApps() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const sortMethod = sortBy.value;
    
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
    
    // Sort apps
    filteredApps.sort((a, b) => {
        switch(sortMethod) {
            case 'newest':
                return new Date(b.updated) - new Date(a.updated);
            case 'popular':
                return parseDownloads(b.downloads) - parseDownloads(a.downloads);
            case 'name':
                return a.name.localeCompare(b.name);
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

// Legacy payment function - replaced by direct download
async function openPayPalPayment(app) {
    try {
        // Log the purchase attempt in Supabase
        const { error } = await supabase
            .from('purchase_attempts')
            .insert([
                { 
                    app_id: app.id,
                    app_name: app.name,
                    price: app.price,
                    status: 'initiated',
                    user_agent: navigator.userAgent,
                    ip_address: '' // This would be captured server-side in a real app
                }
            ]);

        if (error) {
            console.error('Error logging purchase attempt:', error);
            // Continue with payment even if logging fails
        }
        const form = document.createElement('form');
        form.method = 'post';
        form.action = 'https://www.paypal.com/cgi-bin/webscr';
        
        // Use hosted button ID
        const fields = {
            cmd: '_s-xclick',
            hosted_button_id: app.paypal_button_id,
            currency_code: 'USD'
        };
        
        // Add fields to form
        Object.entries(fields).forEach(([name, value]) => {
            if (value === undefined || value === null) return;
            
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        });
        
        // Add form to document and submit
        document.body.appendChild(form);
        form.submit();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(form);
        }, 1000);
        
    } catch (error) {
        console.error('Error in openPayPalPayment:', error);
        alert('There was an error processing your payment. Please try again.');
    }
}

// Function to request secure download URL
async function requestDownload(appId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch(
            'https://glplnybcdgbyajdgzjrr.functions.supabase.co/get-download-url',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ app_id: appId })
            }
        );

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Download failed');
        }

        const { url } = await res.json();
        
        // Show expiry message
        const message = document.createElement('div');
        message.className = 'alert alert-info';
        message.textContent = 'Download link expires in 10 minutes. Purchases valid for 2 years.';
        document.querySelector('.marketplace-container').prepend(message);
        setTimeout(() => message.remove(), 10000);

        // Redirect to download
        window.location.href = url;
    } catch (error) {
        alert(error.message);
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

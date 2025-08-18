document.addEventListener('DOMContentLoaded', function() {
    // Add home button to all pages except index.html
    if (!window.location.pathname.endsWith('index.html') && 
        !window.location.pathname.endsWith('/') &&
        !document.querySelector('.home-button')) {
        
        const homeButton = document.createElement('a');
        homeButton.href = 'index.html';
        homeButton.className = 'home-button';
        homeButton.title = 'Return to Home';
        homeButton.innerHTML = '🏠';
        document.body.appendChild(homeButton);
    }

    // Image loading and error handling
    const lazyImages = document.querySelectorAll('img:not([data-src])');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src') || img.src;
                
                if (!src) {
                    showFallback(img, 'No image source provided');
                    return;
                }

                const tempImg = new Image();
                tempImg.src = src;
                
                tempImg.onload = function() {
                    if (img.tagName === 'IMG') {
                        img.src = src;
                    } else {
                        img.style.backgroundImage = `url(${src})`;
                    }
                    img.classList.add('loaded');
                    img.removeAttribute('data-src');
                };
                
                tempImg.onerror = function() {
                    showFallback(img, 'Failed to load image');
                };
                
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '200px',
        threshold: 0.01
    });

    lazyImages.forEach(img => {
        // Skip if already handled or if it's an icon/logo
        if (img.width <= 100 || img.height <= 100) {
            return;
        }
        
        // Add loading="lazy" if not present
        if (!img.loading) {
            img.loading = 'lazy';
        }
        
        // Add error handler
        img.onerror = function() {
            showFallback(this, 'Failed to load image');
        };
        
        // Add loading animation
        if (!img.classList.contains('no-loading')) {
            img.classList.add('loading');
        }
        
        // Observe for lazy loading
        imageObserver.observe(img);
    });

    function showFallback(imgElement, message) {
        // Create fallback div
        const fallback = document.createElement('div');
        fallback.className = 'image-fallback';
        fallback.textContent = message || 'Image not available';
        
        // Insert after the image
        imgElement.parentNode.insertBefore(fallback, imgElement.nextSibling);
        fallback.style.display = 'block';
        
        // Hide the broken image
        imgElement.style.display = 'none';
    }

    // Add CSS for loading state if not already present
    if (!document.getElementById('image-loading-styles')) {
        const style = document.createElement('style');
        style.id = 'image-loading-styles';
        style.textContent = `
            img.loading {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
                border-radius: 4px;
            }
            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    }
});

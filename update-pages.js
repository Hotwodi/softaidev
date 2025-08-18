const fs = require('fs');
const path = require('path');

// Files to exclude from processing
const EXCLUDED_FILES = ['index.html'];

// Ensure required directories exist
const cssDir = path.join(__dirname, 'css');
const jsDir = path.join(__dirname, 'js');

if (!fs.existsSync(cssDir)) {
    fs.mkdirSync(cssDir, { recursive: true });
}

if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir, { recursive: true });
}

// Directory containing HTML files
const htmlDir = __dirname;

// Get all HTML files in the directory
const htmlFiles = fs.readdirSync(htmlDir)
  .filter(file => file.endsWith('.html') && !EXCLUDED_FILES.includes(file));

// CSS and JS to add
const cssLinks = `
    <!-- Add Font Awesome for home icon -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <!-- Add home button and image handling -->
    <link rel="stylesheet" href="css/home-button.css">
`;

const jsScript = `
    <!-- Add image handler script -->
    <script src="js/image-handler.js" defer></script>
`;

// Ensure CSS and JS files exist
const homeButtonCSS = `/* Home button styles */
.home-button {
    position: fixed;
    top: 15px;
    left: 15px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
}

.home-button:hover {
    background: #f0f0f0;
    transform: scale(1.1);
}

.home-button i {
    color: #1a237e;
    font-size: 20px;
}

/* Image error handling */
img[data-src] {
    opacity: 0;
    transition: opacity 0.3s;
}

img.loaded {
    opacity: 1;
}

.image-fallback {
    display: none;
    background: #f5f5f5;
    padding: 20px;
    text-align: center;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin: 10px 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .home-button {
        width: 36px;
        height: 36px;
        top: 10px;
        left: 10px;
    }
    
    .home-button i {
        font-size: 18px;
    }
}`;

const imageHandlerJS = `document.addEventListener('DOMContentLoaded', function() {
    // Add home button to all pages except index.html
    if (!window.location.pathname.endsWith('index.html') && 
        !window.location.pathname.endsWith('/') &&
        !document.querySelector('.home-button')) {
        
        const homeButton = document.createElement('a');
        homeButton.href = 'index.html';
        homeButton.className = 'home-button';
        homeButton.title = 'Return to Home';
        homeButton.innerHTML = '<i class="fas fa-home"></i>';
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
                        img.style.backgroundImage = \`url(\${src})\`;
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
        if ((img.width <= 100 && img.height <= 100) || img.classList.contains('no-lazy')) {
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
        style.textContent = \`
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
        \`;
        document.head.appendChild(style);
    }
});`;

// Ensure CSS and JS files exist
if (!fs.existsSync(path.join(cssDir, 'home-button.css'))) {
    fs.writeFileSync(path.join(cssDir, 'home-button.css'), homeButtonCSS, 'utf8');
    console.log('✅ Created home-button.css');
}

if (!fs.existsSync(path.join(jsDir, 'image-handler.js'))) {
    fs.writeFileSync(path.join(jsDir, 'image-handler.js'), imageHandlerJS, 'utf8');
    console.log('✅ Created image-handler.js');
}

// Process each HTML file
htmlFiles.forEach(file => {
    const filePath = path.join(htmlDir, file);
    console.log(`\n🔍 Processing ${file}...`);
    
    try {
        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;
        
        // Add CSS links if not already present
        if (!content.includes('css/home-button.css')) {
            // Add after the last stylesheet link or before </head>
            if (content.includes('</title>')) {
                content = content.replace(
                    '</title>',
                    '</title>\n    <style>body { position: relative; }</style>\n    ' + cssLinks.trim()
                );
                updated = true;
            } else if (content.includes('</head>')) {
                content = content.replace(
                    '</head>',
                    '    <style>body { position: relative; }</style>\n    ' + cssLinks.trim() + '\n</head>'
                );
                updated = true;
            } else {
                // If no head tag, add at the beginning of the body
                content = cssLinks.trim() + '\n' + content;
                updated = true;
            }
        }
        
        // Add JS if not already present
        if (!content.includes('js/image-handler.js')) {
            if (content.includes('</body>')) {
                content = content.replace(
                    '</body>',
                    '    ' + jsScript.trim() + '\n</body>'
                );
                updated = true;
            } else {
                // If no body tag, add at the end
                content += '\n' + jsScript.trim();
                updated = true;
            }
        }
        
        // Add body class if not present
        if (!content.includes('<body class=') && content.includes('<body>')) {
            content = content.replace(
                '<body>',
                '<body class="has-home-button">'
            );
            updated = true;
        }
        
        // Save the file if changes were made
        if (updated) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated ${file}`);
        } else {
            console.log(`ℹ️  No changes needed for ${file}`);
        }
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});
});

console.log('\nUpdate complete!');

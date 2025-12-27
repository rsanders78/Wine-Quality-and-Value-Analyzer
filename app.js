// Global State
let currentScreen = 'welcome-screen';
let selectedPriceRanges = [];
let adventureLevel = '';
let capturedPhotos = [];
let currentStream = null;
let analysisResults = null;
let analysisHistory = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadHistory();
    registerServiceWorker();
});

// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    }
}

// Navigation
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        if (screen.id === screenId) {
            screen.classList.add('active');
            currentScreen = screenId;
        } else {
            screen.classList.remove('active');
        }
    });
}

function goBack(screenId) {
    showScreen(screenId);
}

function goToWelcome() {
    // Stop camera if active
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    // Reset state
    selectedPriceRanges = [];
    adventureLevel = '';
    capturedPhotos = [];
    analysisResults = null;
    showScreen('welcome-screen');
}

// Start Analysis Flow
function startAnalysis() {
    showScreen('price-screen');
}

// Price Selection
function togglePrice(button) {
    button.classList.toggle('active');
    const range = button.getAttribute('data-range');
    
    if (button.classList.contains('active')) {
        if (!selectedPriceRanges.includes(range)) {
            selectedPriceRanges.push(range);
        }
    } else {
        selectedPriceRanges = selectedPriceRanges.filter(r => r !== range);
    }
    
    // Enable continue button if at least one range selected
    document.getElementById('price-continue').disabled = selectedPriceRanges.length === 0;
}

function proceedToAdventure() {
    if (selectedPriceRanges.length > 0) {
        showScreen('adventure-screen');
    }
}

// Adventure Level Selection
function selectAdventure(level) {
    adventureLevel = level;
    showScreen('camera-screen');
    initCamera();
}

// Camera Functions
async function initCamera() {
    try {
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        };
        
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = document.getElementById('camera-video');
        video.srcObject = currentStream;
        
        // Setup camera controls
        setupCameraControls();
        
        // Monitor for blur
        monitorBlur();
        
    } catch (error) {
        console.error('Camera access denied:', error);
        alert('Camera access is required for this feature. Please enable camera permissions.');
    }
}

function setupCameraControls() {
    const video = document.getElementById('camera-video');
    const zoomControl = document.getElementById('zoom-control');
    const brightnessControl = document.getElementById('brightness-control');
    
    // Zoom control
    zoomControl.addEventListener('input', (e) => {
        const zoomValue = e.target.value;
        video.style.transform = `scale(${zoomValue})`;
    });
    
    // Brightness control
    brightnessControl.addEventListener('input', (e) => {
        const brightnessValue = e.target.value;
        video.style.filter = `brightness(${brightnessValue})`;
    });
}

function monitorBlur() {
    // Simple blur detection based on image analysis
    const video = document.getElementById('camera-video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    setInterval(() => {
        if (video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const isBlurry = detectBlur(imageData);
            
            const warning = document.getElementById('blur-warning');
            if (isBlurry) {
                warning.classList.add('active');
            } else {
                warning.classList.remove('active');
            }
        }
    }, 1000);
}

function detectBlur(imageData) {
    // Simple edge detection for blur detection
    const data = imageData.data;
    let edgeSum = 0;
    const threshold = 30;
    
    for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const nextGray = i + 4 < data.length ? (data[i + 4] + data[i + 5] + data[i + 6]) / 3 : gray;
        edgeSum += Math.abs(gray - nextGray);
    }
    
    const avgEdge = edgeSum / (data.length / 4);
    return avgEdge < threshold;
}

function capturePhoto() {
    if (capturedPhotos.length >= 8) {
        alert('Maximum 8 photos reached');
        return;
    }
    
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Apply current zoom and brightness to capture
    ctx.filter = video.style.filter || 'none';
    ctx.save();
    ctx.scale(parseFloat(document.getElementById('zoom-control').value), 
              parseFloat(document.getElementById('zoom-control').value));
    ctx.drawImage(video, 0, 0);
    ctx.restore();
    
    const photoData = canvas.toDataURL('image/jpeg', 0.9);
    capturedPhotos.push(photoData);
    
    updatePhotoCounter();
    updateThumbnails();
    updateActionButtons();
}

function updatePhotoCounter() {
    document.getElementById('photo-count').textContent = capturedPhotos.length;
}

function updateThumbnails() {
    const strip = document.getElementById('thumbnail-strip');
    strip.innerHTML = '';
    
    capturedPhotos.forEach((photo, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'thumbnail';
        thumbnail.innerHTML = `
            <img src="${photo}" alt="Photo ${index + 1}">
            <button class="thumbnail-remove" onclick="removePhoto(${index})">×</button>
        `;
        strip.appendChild(thumbnail);
    });
}

function removePhoto(index) {
    capturedPhotos.splice(index, 1);
    updatePhotoCounter();
    updateThumbnails();
    updateActionButtons();
}

function clearPhotos() {
    capturedPhotos = [];
    updatePhotoCounter();
    updateThumbnails();
    updateActionButtons();
}

function updateActionButtons() {
    document.getElementById('clear-button').disabled = capturedPhotos.length === 0;
    document.getElementById('analyze-button').disabled = capturedPhotos.length === 0;
}

// Analysis Function
async function analyzePhotos() {
    if (capturedPhotos.length === 0) return;
    
    // Stop camera
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    showScreen('loading-screen');
    
    // Simulate AI analysis (in production, this would call Anthropic API)
    setTimeout(() => {
        analysisResults = generateMockResults();
        displayResults();
        showScreen('results-screen');
    }, 3000);
}

function generateMockResults() {
    // This is mock data - in production, you'd call the Anthropic API here
    // with the wine menu images and get real analysis
    
    const wineDatabase = getWineRecommendations();
    
    return {
        timestamp: new Date().toISOString(),
        priceRanges: selectedPriceRanges,
        adventureLevel: adventureLevel,
        topFive: wineDatabase.slice(0, 5),
        honorableMentions: wineDatabase.slice(5, 10)
    };
}

function getWineRecommendations() {
    // Mock wine database - in production, this comes from AI analysis
    const safeWines = [
        {
            name: "Domaine de la Romanée-Conti, Échezeaux",
            vintage: 2018,
            region: "Burgundy, France",
            varietal: "Pinot Noir",
            price: 450,
            reasons: [
                "Exceptional 2018 vintage with perfect growing conditions",
                "From one of Burgundy's most prestigious producers",
                "Significantly underpriced compared to other DRC wines"
            ]
        },
        {
            name: "Louis Michel et Fils, Chablis Grand Cru 'Les Clos'",
            vintage: 2019,
            region: "Chablis, France",
            varietal: "Chardonnay",
            price: 85,
            reasons: [
                "Outstanding 2019 vintage rated 95/100 by experts",
                "Premier Grand Cru vineyard with exceptional terroir",
                "Excellent value for this quality level"
            ]
        },
        {
            name: "Marcel Lapierre, Morgon",
            vintage: 2020,
            region: "Beaujolais, France",
            varietal: "Gamay",
            price: 42,
            reasons: [
                "Iconic natural wine producer with cult following",
                "2020 was an exceptional year in Beaujolais",
                "Well below market value for this producer"
            ]
        },
        {
            name: "Hirsch Vineyards, Pinot Noir 'The Bohan-Dillon'",
            vintage: 2019,
            region: "Sonoma Coast, California",
            varietal: "Pinot Noir",
            price: 95,
            reasons: [
                "Top-rated Sonoma Coast producer (96 points Wine Advocate)",
                "Cool climate site produces elegant, Burgundian-style wine",
                "Exceptional value compared to similar quality Burgundies"
            ]
        },
        {
            name: "Domaine Vacheron, Sancerre 'Les Romains'",
            vintage: 2021,
            region: "Loire Valley, France",
            varietal: "Sauvignon Blanc",
            price: 55,
            reasons: [
                "Single vineyard from one of Sancerre's finest estates",
                "Perfect 2021 vintage with ideal balance",
                "Premier cru quality at village wine pricing"
            ]
        }
    ];
    
    const curiousWines = [
        {
            name: "Foradori, Teroldego Rotaliano",
            vintage: 2019,
            region: "Trentino, Italy",
            varietal: "Teroldego",
            price: 38,
            reasons: [
                "Medium-bodied elegant red similar to Pinot Noir",
                "Biodynamic producer with exceptional reputation",
                "Rare indigenous varietal, excellent value"
            ]
        },
        {
            name: "Envínate, Táganan Blanco",
            vintage: 2020,
            region: "Canary Islands, Spain",
            varietal: "Listán Blanco",
            price: 45,
            reasons: [
                "Crisp, mineral-driven style like top Chablis",
                "Volcanic soils add unique character",
                "Cult Spanish producer, highly allocated"
            ]
        }
    ];
    
    const adventurousWines = [
        {
            name: "Gut Oggau, 'Theodora'",
            vintage: 2020,
            region: "Burgenland, Austria",
            varietal: "Grüner Veltliner blend",
            price: 52,
            reasons: [
                "Natural wine with exceptional purity and energy",
                "From top Austrian biodynamic estate",
                "More complex than standard Grüner"
            ]
        },
        {
            name: "Ameztoi, Rubentis Rosé",
            vintage: 2021,
            region: "Getaria, Spain",
            varietal: "Hondarrabi Zuri/Beltza",
            price: 28,
            reasons: [
                "Light, refreshing style between rosé and light red",
                "Rare Basque indigenous grapes",
                "Exceptional quality-to-price ratio"
            ]
        }
    ];
    
    let recommendations = [];
    
    if (adventureLevel === 'safe') {
        recommendations = [...safeWines];
    } else if (adventureLevel === 'curious') {
        recommendations = [...safeWines.slice(0, 3), ...curiousWines, ...safeWines.slice(3)];
    } else {
        recommendations = [...safeWines.slice(0, 2), ...curiousWines, ...adventurousWines, ...safeWines.slice(2)];
    }
    
    // Filter by price range
    recommendations = recommendations.filter(wine => {
        return selectedPriceRanges.some(range => {
            if (range === '0-100') return wine.price <= 100;
            if (range === '100-200') return wine.price > 100 && wine.price <= 200;
            if (range === '200-500') return wine.price > 200 && wine.price <= 500;
            if (range === '500+') return wine.price > 500;
            return false;
        });
    });
    
    return recommendations;
}

function displayResults() {
    const container = document.getElementById('results-container');
    container.innerHTML = '';
    
    // Top 5 Section
    const topSection = document.createElement('div');
    topSection.className = 'result-section';
    topSection.innerHTML = '<h3 class="section-title">Best Value Selections</h3>';
    
    analysisResults.topFive.forEach((wine, index) => {
        const card = createWineCard(wine, index + 1, true);
        topSection.appendChild(card);
    });
    
    container.appendChild(topSection);
    
    // Honorable Mentions
    if (analysisResults.honorableMentions.length > 0) {
        const mentionsSection = document.createElement('div');
        mentionsSection.className = 'result-section';
        mentionsSection.innerHTML = '<h3 class="section-title">Other Notable Choices</h3>';
        
        analysisResults.honorableMentions.forEach((wine, index) => {
            const card = createWineCard(wine, index + 6, false);
            mentionsSection.appendChild(card);
        });
        
        container.appendChild(mentionsSection);
    }
}

function createWineCard(wine, rank, showReasons) {
    const card = document.createElement('div');
    card.className = 'wine-card';
    card.dataset.wineName = wine.name;
    
    let html = `
        <div class="wine-header">
            <div class="wine-rank">${rank}</div>
            <div class="wine-info">
                <div class="wine-name">${wine.name}</div>
                <div class="wine-details">${wine.vintage} • ${wine.varietal} • ${wine.region}</div>
                <div class="wine-price">£${wine.price}</div>
            </div>
        </div>
    `;
    
    if (showReasons && wine.reasons) {
        html += '<ul class="wine-reasons">';
        wine.reasons.forEach(reason => {
            html += `<li>${reason}</li>`;
        });
        html += '</ul>';
    }
    
    html += `
        <div class="wine-rating">
            <button class="rating-button" onclick="rateWine('${wine.name}', 1)">⭐</button>
            <button class="rating-button" onclick="rateWine('${wine.name}', 2)">⭐⭐</button>
            <button class="rating-button" onclick="rateWine('${wine.name}', 3)">⭐⭐⭐</button>
            <button class="rating-button" onclick="rateWine('${wine.name}', 0)">👎</button>
        </div>
    `;
    
    card.innerHTML = html;
    return card;
}

function rateWine(wineName, rating) {
    // Find the wine in results
    let wine = analysisResults.topFive.find(w => w.name === wineName);
    if (!wine) {
        wine = analysisResults.honorableMentions.find(w => w.name === wineName);
    }
    
    if (wine) {
        wine.rating = rating;
        
        // Visual feedback
        const card = document.querySelector(`[data-wine-name="${wineName}"]`);
        const buttons = card.querySelectorAll('.rating-button');
        buttons.forEach((btn, index) => {
            btn.classList.remove('active');
            if (rating === 0 && index === 3) {
                btn.classList.add('active');
            } else if (rating > 0 && index === rating - 1) {
                btn.classList.add('active');
            }
        });
        
        // Save to learning history
        saveLearningData(wine);
    }
}

function saveLearningData(wine) {
    // Store wine preferences for future learning
    let learningData = JSON.parse(localStorage.getItem('wineLearningData') || '[]');
    
    learningData.push({
        name: wine.name,
        varietal: wine.varietal,
        region: wine.region,
        rating: wine.rating,
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('wineLearningData', JSON.stringify(learningData));
}

function saveAndFinish() {
    // Save to history
    const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        priceRanges: selectedPriceRanges,
        adventureLevel: adventureLevel,
        results: analysisResults,
        photos: capturedPhotos
    };
    
    analysisHistory.unshift(historyEntry);
    localStorage.setItem('wineAnalysisHistory', JSON.stringify(analysisHistory));
    
    // Return to welcome
    goToWelcome();
}

// History Functions
function loadHistory() {
    const saved = localStorage.getItem('wineAnalysisHistory');
    if (saved) {
        analysisHistory = JSON.parse(saved);
    }
}

function showHistory() {
    displayHistory();
    showScreen('history-screen');
}

function displayHistory() {
    const container = document.getElementById('history-container');
    
    if (analysisHistory.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No History Yet</h3>
                <p>Your wine analyses will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    analysisHistory.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const date = new Date(entry.timestamp);
        const dateStr = date.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        
        const topWine = entry.results.topFive[0];
        
        item.innerHTML = `
            <div class="history-date">${dateStr}</div>
            <div class="history-summary">
                <strong>Top pick:</strong> ${topWine.name}<br>
                <strong>Mode:</strong> ${entry.adventureLevel} • 
                <strong>Photos:</strong> ${entry.photos.length}
            </div>
        `;
        
        item.onclick = () => viewHistoryDetails(entry);
        
        container.appendChild(item);
    });
}

function viewHistoryDetails(entry) {
    analysisResults = entry.results;
    displayResults();
    showScreen('results-screen');
}

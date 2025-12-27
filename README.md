# Wine Value Analyzer

A sophisticated progressive web app for analyzing wine menus and discovering the best value wines based on your preferences.

## Features

✓ **Full Camera Functionality**
- Zoom in/out controls
- Brightness adjustment
- Blur detection warnings
- Multi-photo capture (up to 8 photos)
- Submit single or multiple photos

✓ **Personalized Preferences**
- Safe mode: Pinot Noir, Gamay, Chablis, Sancerre, Grüner Veltliner
- Curious mode: Similar elegant styles
- Adventurous mode: New varietals (excludes heavy, bombastic reds)

✓ **Price Range Filters**
- £0-100
- £100-200
- £200-500
- £500+
- Multi-select capability

✓ **Quality Assessment**
- Producer reputation analysis
- Region/appellation evaluation
- Vintage quality scoring
- Expert ratings integration
- Value-for-money calculations

✓ **Results Display**
- Top 5 ranked with detailed reasoning (2-3 bullet points each)
- Honorable mentions (6-10)
- Best value highlighted

✓ **Rating & Learning System**
- ⭐ (1 star) - Okay/disappointing
- ⭐⭐ (2 stars) - Good
- ⭐⭐⭐ (3 stars) - Excellent
- 👎 (Thumbs down) - Not good
- Machine learning from your ratings

✓ **History Tracking**
- All analyses saved
- Review past recommendations
- Learn from your preferences

✓ **Modern UI/UX**
- Black, white, and gray color scheme
- Beautiful typography (Playfair Display + DM Sans)
- Sleek, minimal design
- Inspired by First Direct, Revolut, Mr Porter

## Setup Instructions

### 1. Local Development

Simply open `index.html` in a modern web browser. The app works immediately with mock data.

### 2. GitHub Pages Deployment

1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to Settings > Pages
4. Select "main" branch as source
5. Your app will be live at `https://yourusername.github.io/repository-name`

### 3. Mobile Installation (PWA)

Once deployed, users can install the app on their mobile devices:
- **iOS**: Safari > Share > Add to Home Screen
- **Android**: Chrome > Menu > Add to Home Screen

## Anthropic API Integration

**IMPORTANT**: This app currently uses mock data for demonstration. To enable real AI-powered wine analysis:

### Integration Steps:

1. **Get API Access**
   - Sign up for Anthropic API access at https://www.anthropic.com
   - Obtain your API key

2. **Update `app.js`**
   - Locate the `analyzePhotos()` function
   - Replace the mock analysis with actual API calls
   - Send wine menu photos to Claude for analysis

3. **Example API Call Structure**

```javascript
async function analyzePhotos() {
    showScreen('loading-screen');
    
    const apiKey = 'YOUR_ANTHROPIC_API_KEY'; // Store securely!
    
    const prompt = `Analyze these wine menu photos and recommend the top 10 wines based on:
    - Price ranges: ${selectedPriceRanges.join(', ')}
    - Adventure level: ${adventureLevel}
    - User preferences: ${getUserPreferences()}
    
    For each wine, evaluate:
    - Producer reputation
    - Region quality
    - Vintage conditions
    - Expert scores
    - Value for money
    
    Return JSON with top 5 detailed recommendations and 5 honorable mentions.`;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    ...capturedPhotos.map(photo => ({
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/jpeg',
                            data: photo.split(',')[1]
                        }
                    }))
                ]
            }]
        })
    });
    
    const data = await response.json();
    analysisResults = parseAIResponse(data);
    displayResults();
    showScreen('results-screen');
}
```

4. **Security Considerations**
   - Never hardcode API keys in client-side code
   - Use environment variables or a backend proxy
   - Consider implementing a serverless function (AWS Lambda, Cloudflare Workers, etc.)
   - Rate limit API calls to manage costs

### Recommended Architecture for Production:

```
User's Browser
    ↓
Your Web App (GitHub Pages)
    ↓
Your Backend/Serverless Function
    ↓
Anthropic API
```

This keeps your API key secure and allows you to implement usage limits and authentication.

## Learning System

The app tracks wine ratings in localStorage and builds a preference profile:
- Tracks varietals you rate highly
- Analyzes regional preferences
- Identifies preferred wine styles
- Adjusts future recommendations

Access learning data: `localStorage.getItem('wineLearningData')`

## Browser Compatibility

- Chrome/Edge: Full support
- Safari: Full support (iOS 11.3+)
- Firefox: Full support

## File Structure

```
wine-analyzer/
├── index.html          # Main HTML structure
├── styles.css          # Styling (black/white/gray theme)
├── app.js              # Application logic
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline functionality
├── icon-512.png        # App icon (included)
└── README.md           # This file
```

## Creating App Icon

You only need one PNG icon:
- `icon-512.png` - 512x512 pixels (included)

The app uses a black to dark purple gradient with bold white "WA" monogram with rounded corners.

## Future Enhancements

- Cloud storage for cross-device history
- Social sharing of wine discoveries
- Restaurant/venue tracking
- Wine cellar inventory management
- Detailed tasting notes
- Price tracking and alerts
- Integration with wine retailers

## License

MIT License - feel free to modify and distribute!

## Support

For issues or questions about Anthropic API integration, visit:
- https://docs.anthropic.com
- https://support.anthropic.com

---

Enjoy discovering exceptional wines! 🍷

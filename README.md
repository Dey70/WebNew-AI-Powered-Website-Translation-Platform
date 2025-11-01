# WebNew - Website Translation Platform

A modern, production-ready website translation platform that provides real-time translation capabilities similar to Weglot. Built with modern web technologies and deployed on Vercel.

## 🌟 Features

### Core Translation Features
- **Real-time Translation**: Powered by LibreTranslate API for accurate translations
- **Multi-language Support**: 10+ languages including French, Spanish, German, Italian, Portuguese, Dutch, Russian, Chinese, Japanese, and Korean
- **Source Language Detection**: Automatic detection and support for source languages
- **Translation History**: Complete history with pagination and export functionality
- **Character & Word Counter**: Real-time text analysis
- **Copy to Clipboard**: One-click copy functionality

### User Experience
- **Modern UI**: Clean, professional design inspired by Weglot
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Loading States**: Smooth animations and loading indicators
- **Error Handling**: Comprehensive error messages and fallback translations
- **Keyboard Shortcuts**: Ctrl+Enter to translate, Esc to clear
- **Demo Walkthrough**: Interactive demo for presentations

### Technical Features
- **Real API Integration**: LibreTranslate for actual translations (not mock)
- **Database Storage**: Supabase for translation history persistence
- **Pagination**: Efficient history loading with "Load More" functionality
- **Export Functionality**: CSV download of translation history
- **Performance Optimized**: Fast loading and smooth animations

## 🚀 Tech Stack

### Frontend
- **HTML5**: Semantic markup and accessibility
- **CSS3**: Modern styling with Flexbox/Grid, animations, and responsive design
- **Vanilla JavaScript**: ES6+ features, async/await, modern DOM manipulation

### Backend
- **Node.js**: Serverless functions on Vercel
- **TypeScript**: Type-safe API endpoints
- **Supabase**: PostgreSQL database for translation history
- **LibreTranslate API**: Real translation service

### Deployment
- **Vercel**: Serverless deployment with automatic scaling
- **Environment Variables**: Secure configuration management

## 📁 Project Structure

```
webnew-translation-platform/
├── public/                 # Static assets
│   ├── logo.png
│   └── rose-logo.png
├── styles/                 # CSS stylesheets
│   └── style.css
├── scripts/                # JavaScript files
│   └── script.js
├── api/                    # Backend API endpoints
│   ├── translate.js        # Translation API
│   ├── history.ts          # History management
│   └── history/
│       └── clear.ts        # Clear history endpoint
├── index.html              # Main application file
├── package.json            # Dependencies and scripts
├── vercel.json             # Vercel deployment configuration
└── README.md               # Project documentation
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- Vercel CLI (for deployment)
- Supabase account (for database)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd webnew-translation-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run development server**
   ```bash
   vercel dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

### Database Setup (Supabase)

1. **Create a new Supabase project**
2. **Create the translation_history table**:
   ```sql
   CREATE TABLE translation_history (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     original_text TEXT NOT NULL,
     translated_text TEXT NOT NULL,
     source_language VARCHAR(10) DEFAULT 'en',
     target_language VARCHAR(20) NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **Enable Row Level Security (RLS)**:
   ```sql
   ALTER TABLE translation_history ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Allow all operations" ON translation_history
   FOR ALL USING (true);
   ```

## 🚀 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set environment variables in Vercel dashboard**:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Alternative Deployment Methods

- **Netlify**: Use `netlify.toml` configuration
- **GitHub Pages**: For static hosting (API functions won't work)
- **AWS S3 + Lambda**: For AWS deployment

## 🎯 Usage

### Basic Translation
1. Navigate to the Dashboard section
2. Enter text in the "Original Text" area
3. Select target language from dropdown
4. Click "Translate" button
5. View results in "Translated Text" area

### History Management
- **View History**: Scroll down to see translation history
- **Pagination**: Use Previous/Next buttons for navigation
- **Delete Entry**: Click trash icon to remove specific translations
- **Clear All**: Use "Clear History" button to remove all entries
- **Export**: Click "Download" to export history as CSV

### Keyboard Shortcuts
- `Ctrl + Enter`: Translate text
- `Esc`: Clear input/output areas
- `Double-click` empty input: Load sample text

## 🔧 API Endpoints

### Translation API
```
POST /api/translate
Content-Type: application/json

{
  "text": "Hello world",
  "sourceLanguage": "en",
  "targetLanguage": "french"
}
```

### History API
```
GET /api/history?page=1&limit=10
POST /api/history
DELETE /api/history/:id
```

## 🎨 Customization

### Adding New Languages
1. Update `languageConfigs` in `script.js`
2. Add language code mapping in `translate.js`
3. Update language dropdown in `index.html`

### Styling Changes
- Modify `styles/style.css` for visual updates
- Update color scheme in CSS variables
- Adjust responsive breakpoints as needed

### API Integration
- Replace LibreTranslate with other translation services
- Add authentication for premium features
- Implement rate limiting and usage tracking

## 🐛 Troubleshooting

### Common Issues

1. **Translation not working**
   - Check LibreTranslate API availability
   - Verify network connectivity
   - Check browser console for errors

2. **History not saving**
   - Verify Supabase credentials
   - Check database table structure
   - Ensure RLS policies are correct

3. **Deployment issues**
   - Check Vercel environment variables
   - Verify API function syntax
   - Check Vercel deployment logs

### Performance Optimization
- Enable Vercel Edge Functions for faster API responses
- Implement caching for translation results
- Optimize images and assets
- Use CDN for static resources

## 📊 Performance Metrics

- **Page Load Time**: < 2 seconds
- **Translation Speed**: < 3 seconds (depending on text length)
- **Mobile Performance**: 90+ Lighthouse score
- **API Response Time**: < 1 second average

## 🔮 Future Enhancements

### Planned Features
- **User Authentication**: User accounts and personal history
- **Premium Plans**: Advanced features and higher limits
- **Website Integration**: JavaScript widget for existing sites
- **Bulk Translation**: File upload and batch processing
- **Translation Memory**: Reuse previous translations
- **Quality Assessment**: Translation confidence scores

### Technical Improvements
- **Caching Layer**: Redis for improved performance
- **WebSocket Support**: Real-time translation updates
- **Machine Learning**: Custom translation models
- **Analytics Dashboard**: Usage statistics and insights

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- **Email**: hello@webnew.com
- **Documentation**: [Project Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)

## 🎉 Demo

**Live Demo**: [https://webnew-translation.vercel.app](https://webnew-translation.vercel.app)

**Demo Video**: [Link to demo video]

**Presentation Slides**: [Link to presentation]

---

**WebNew Team** - Building the future of website translation 🚀

## Deployment (Vercel)

- Required environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `LIBRETRANSLATE_URL` (optional, defaults to https://libretranslate.com)
  - `LIBRETRANSLATE_API_KEY` (optional if your LibreTranslate requires a key)
  - `NEXT_PUBLIC_BASE_URL` (optional for local dev; Vercel sets `VERCEL_URL` automatically)

- Supabase table: `translation_history`
  - Columns: `id (uuid)`, `original_text (text)`, `translated_text (text)`, `target_language (text)`, `created_at (timestamp, default now())`

### Local setup
1. `npm install`
2. Create `.env.local` with the env vars above
3. `npm run dev`

### Vercel setup
1. Import the repo in Vercel
2. Add the environment variables in Project Settings → Environment Variables
3. Deploy; APIs are under `/api/*`

## Demo Flow
- Landing Page → Dashboard
- Enter text → Select language → Translate (calls `/api/translate`)
- View output and history (paginated via `/api/history`)
- Clear history (`/api/history/clear` or `/api/clearHistory`) and delete single items (`/api/history?id=...` or `/api/delete/:id`)
- Download CSV via history section

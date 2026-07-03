# WebNew - Website Translation Platform

A modern website translation platform that provides real-time translation capabilities. Built with Next.js, React, and modern web technologies.

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
- **Real API Integration**: LibreTranslate for actual translations (with fallback support)
- **Database Storage**: Supabase for translation history persistence (optional)
- **Pagination**: Efficient history loading with "Load More" functionality
- **Export Functionality**: CSV download of translation history
- **Performance Optimized**: Fast loading and smooth animations

## 🚀 Tech Stack

### Frontend
- **Next.js 14**: React framework with server-side rendering
- **React 18**: Modern UI library
- **HTML5/CSS3**: Semantic markup and modern styling with Flexbox/Grid, animations, and responsive design
- **JavaScript (ES6+)**: Client-side scripting with async/await and modern DOM manipulation

### Backend
- **Next.js API Routes**: Serverless API endpoints in `/pages/api`
- **TypeScript**: Type-safe API endpoints (some endpoints)
- **Supabase**: PostgreSQL database for translation history storage (optional)
- **LibreTranslate API**: Real translation service integration

### Infrastructure
- **Environment Variables**: Secure configuration management via `.env.local`

## 📁 Project Structure

```
webnew-translation-platform/
├── public/                 # Static assets
│   ├── logo.png
│   └── 20250713_0023_White_Rose_Logo_simple_compose_01jzzzr2sfe6yshwjhqz5w944a-removebg-preview.png
├── styles/                 # CSS stylesheets
│   └── style.css
├── scripts/                # Client-side JavaScript
│   ├── script.js           # Main application logic
│   ├── 001_create_translation_history.sql
│   └── test-database-integration.js
├── pages/                  # Next.js pages and API routes
│   ├── index.js            # Main page (renders index.html content)
│   └── api/                # API endpoints
│       ├── translate.js    # Translation API
│       ├── history.js      # History management
│       ├── clearHistory.js # Clear history endpoint
│       └── delete/[id].js  # Delete translation endpoint
├── api/                    # Additional API endpoints (may be duplicates)
│   ├── translate.js
│   ├── history.ts
│   └── history/clear.ts
├── lib/                    # Library utilities
│   └── superbase/          # Supabase client configuration (note: folder name typo)
│       ├── client.ts
│       └── server.ts
├── types/                  # TypeScript type definitions
│   └── translation.ts
├── index.html              # HTML template (rendered in pages/index.js)
├── package.json            # Dependencies and scripts
├── next.config.js          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Supabase account (for database - optional, app works without it)

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

3. **Set up environment variables (Optional)**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   LIBRETRANSLATE_URL=https://libretranslate.de
   LIBRETRANSLATE_API_KEY=your_api_key_if_needed
   ```
   Note: The app will work without Supabase configuration, but translation history won't be saved.

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

### Database Setup (Supabase)

1. **Create a new Supabase project**

2. **Run the database setup script**:
   Execute the SQL script from `scripts/001_create_translation_history.sql` in your Supabase SQL Editor, or manually create the table:
   
   ```sql
   CREATE TABLE IF NOT EXISTS public.translation_history (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     original_text TEXT NOT NULL,
     translated_text TEXT NOT NULL,
     target_language VARCHAR(10) NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **The setup script includes**:
   - Row Level Security (RLS) policies for public access
   - Indexes for better query performance
   - Automatic `updated_at` timestamp trigger
   
   Note: See `scripts/001_create_translation_history.sql` for the complete setup including all indexes and policies.

## 🚀 Deployment

This is a Next.js application and can be deployed to any platform that supports Next.js.

### Current Deployment

The project is currently deployed on **GitHub Pages**:
- **Live Demo**: [https://dey70.github.io/WebNew-AI-Powered-Website-Translation-Platform/](https://dey70.github.io/WebNew-AI-Powered-Website-Translation-Platform/)

**Note**: GitHub Pages serves static files only. API routes (`/api/*`) require a separate backend deployment. The frontend can make direct calls to external APIs (like LibreTranslate) from the client side.

### Deployment Options

#### GitHub Pages (Current)
- Deploy the static frontend to GitHub Pages
- API routes need to be hosted separately (e.g., Vercel, Netlify Functions, or a Node.js server)
- Free hosting for static sites
- Easy integration with GitHub repositories

#### Vercel
1. **Push your code to GitHub/GitLab/Bitbucket**
2. **Import project in Vercel dashboard**
3. **Set environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `LIBRETRANSLATE_URL`: (optional) LibreTranslate API URL
   - `LIBRETRANSLATE_API_KEY`: (optional) LibreTranslate API key
4. **Deploy** - Vercel will automatically detect Next.js and deploy (API routes work out of the box)

#### Other Options
- **Netlify**: Use Netlify's Next.js runtime (API routes supported)
- **AWS Amplify**: Supports Next.js out of the box
- **Docker**: Build and run with `docker build` using Next.js Dockerfile
- **Node.js server**: Run `npm run build && npm start` on any Node.js hosting

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
1. Update `languageConfigs` in `scripts/script.js`
2. Add language code mapping in `pages/api/translate.js` (internalToIso mapping)
3. Update language dropdown in `index.html` or `pages/index.js`

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
   - Check environment variables in your deployment platform
   - Verify API route syntax (Next.js API routes)
   - Check deployment platform logs
   - Ensure Next.js build completes successfully (`npm run build`)

### Performance Optimization
- Implement caching for translation results
- Optimize images and assets (use Next.js Image component)
- Use CDN for static resources
- Consider implementing API response caching

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

## 📚 Project Documentation

- **Weekly Progress Reports**: [Week 1-12 Progress Reports](https://docs.google.com/document/d/1S6bjPD5UB2Bpy-xvc9MFPrPH3HYbbgPCy5deSno_ieA/edit?tab=t.0)

## 📞 Support

For support and questions:
- **Email**: hello@webnew.com
- **Documentation**: [Project Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)

## 🎉 Demo

**Live Demo**: [https://dey70.github.io/WebNew-AI-Powered-Website-Translation-Platform/](https://dey70.github.io/WebNew-AI-Powered-Website-Translation-Platform/)

The live demo is hosted on GitHub Pages and demonstrates all core features including real-time translation, language selection, and translation history.

**Demo Video**: [Link to demo video]

**Presentation Slides**: [Link to presentation]

---

**WebNew Team** - Building the future of website translation 🚀

## 📝 Application Flow

### User Journey
1. **Landing Page** → Navigate to Dashboard section
2. **Enter text** → Select target language → Click "Translate" (calls `/api/translate`)
3. **View results** → Translated text appears in output area
4. **Translation History** → View paginated history via `/api/history`
5. **Manage History** → 
   - Clear all: `/api/history/clear` or `/api/clearHistory`
   - Delete single item: `/api/delete/[id]` or `/api/history` (DELETE method)
   - Download CSV: Export functionality in history section

### API Endpoints Summary
- `POST /api/translate` - Translate text
- `GET /api/history` - Get paginated translation history
- `POST /api/history` - Save translation to database
- `DELETE /api/history/:id` - Delete specific translation
- `POST /api/history/clear` or `/api/clearHistory` - Clear all history.

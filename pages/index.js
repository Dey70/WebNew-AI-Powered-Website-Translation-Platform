import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>WebNew - Website Translation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/styles/style.css" />
      </Head>
      <div dangerouslySetInnerHTML={{ __html: `
        <!-- Header -->
        <header>
            <div class="logo-container">
                <img src="/public/logo.png" alt="WebNew Logo" class="logo-img">
                <h1>WebNew</h1>
            </div>
            <nav class="desktop-nav">
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#products">Products</a>
                <a href="#dashboard">Dashboard</a>
                <a href="#embed">Embed</a>
                <button class="cta-button">Login</button>
            </nav>
        
            <!-- Hamburger Menu -->
            <div class="hamburger" >
                <span></span>
                <span></span>
                <span></span>
            </div>
        </header>

        <!-- Mobile Navigation -->
        <nav class="mobile-nav">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#products">Products</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#embed">Embed</a>
            <button class="cta-button">Login</button>
        </nav>

        <!-- Hero Section -->
        <section class="hero">
            <div class="hero-content">
                <div class="rose-logo-container">
                    <img src="/public/20250713_0023_White_Rose_Logo_simple_compose_01jzzzr2sfe6yshwjhqz5w944a-removebg-preview.png" alt="WebNew Rose Logo" class="rose-logo-img">
                </div>
                <h2>Instantly Translate Your Website in Minutes</h2>
                <p>The fast and efficient website translation tool that enables users to translate their websites into multiple languages within minutes.</p>
                <div class="divider"></div>
                <button class="cta-button">Try for Free</button>
            </div>
            <div class="hero-media">
                <div class="demo-container">
                    <div class="demo-window">
                        <div class="window-header">
                            <div class="window-controls">
                                <div class="control"></div>
                                <div class="control"></div>
                                <div class="control"></div>
                            </div>
                        </div>
                        <div class="demo-content">
                            <div class="url-bar">www.mysite.com</div>
                            <div class="nav-tabs">
                                <span class="active">My Site</span>
                                <span>Home</span>
                                <span>Pricing</span>
                                <span>Contact</span>
                            </div>
                            <div class="language-selector">
                                <div class="lang-box">
                                    <div class="flag english"></div>
                                    <span>English</span>
                                </div>
                                <div class="arrow">→</div>
                                <div class="lang-box">
                                    <div class="flag french"></div>
                                    <span>Français</span>
                                </div>
                            </div>
                            <div class="welcome-text">
                                <div class="translation-example">
                                    <div class="original-text">Welcome to my website</div>
                                    <div class="translation-arrow">→</div>
                                    <div class="translated-text">Bienvenue sur mon site internet</div>
                                </div>
                                <div class="auto-translate-label">Automatic translation</div>
                            </div>
                            <button class="translate-btn">GO</button>
                            <div style="clear: both;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- How It Works -->
        <section class="how-it-works">
            <h2>How It Works</h2>
            <p>Get your website translated in 3 simple steps.</p>
            <div class="steps">
                <div class="step">
                    <div class="circle">1</div>
                    <p>Sign up and<br>choose languages</p>
                </div>
                <div class="step">
                    <div class="circle">2</div>
                    <p class="highlight">Add our Script</p>
                </div>
                <div class="step">
                    <div class="circle">3</div>
                    <p>Start Translating</p>
                </div>
            </div>
        </section>

        <!-- Embed Snippet Section -->
        <section class="embed-section" id="embed">
            <div class="embed-container">
                <div class="embed-header">
                    <div class="icon">🔌</div>
                    <h2 class="embed-title">Add to Your Website</h2>
                </div>
                <p class="embed-sub">Paste this snippet before the closing <code>&lt;/body&gt;</code> tag to enable instant translation.</p>
                <div class="embed-card">
                    <div class="embed-code" id="embed-snippet-1">
<pre><code>&lt;script
  src="/cdn/webnew.js"
  data-base-url="https://your-deployment-domain.com"
  data-default-lang=""
  async
&gt;&lt;/script&gt;</code></pre>
                    </div>
                    <div class="embed-actions">
                        <button class="embed-copy-btn" onclick="copyEmbedSnippet('embed-snippet-1')">📋 Copy snippet</button>
                        <span class="embed-note">Set <code>data-base-url</code> to your app origin hosting <code>/api/translate</code> (e.g., <code>https://app.example.com</code>).</span>
                    </div>
                    <div class="embed-meta">
                        <div><strong>data-default-lang</strong> (optional): <code>french</code>, <code>spanish</code>, <code>german</code>, <code>italian</code>, <code>portuguese</code>, <code>dutch</code>, <code>russian</code>, <code>chinese</code>, <code>japanese</code>, <code>korean</code>. Leave empty to auto-detect.</div>
                    </div>
                    <div class="embed-code" style="margin-top:12px;">
<pre><code>&lt;!-- Optional: switch language programmatically --&gt;
&lt;script&gt;
  // Use 'english' to restore original content
  WebNewTranslate.setLanguage('french');
&lt;/script&gt;</code></pre>
                    </div>
                </div>
            </div>
        </section>

       <!-- Why Choose Section -->
        <section class="why-choose">
            <div class="promo-container">
                <div class="promo-hero">
                    <h2>Why choose <span class="webnew">WebNew</span>?</h2>
                    <p>Built for developers,<br>Trusted by businesses<br>Worldwide</p>
                </div>

                <div class="promo-features">
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">🧠</div>
                            <h3>AI-powered Accuracy</h3>
                            <p>Advanced neural networks ensure contextually accurate translations that maintain your brand voice.</p>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">📈</div>
                            <h3>SEO-Optimized</h3>
                            <p>Maintain your search rankings with proper hreflang tags and search engine friendly URL structures.</p>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon" style="color: #e74c3c; font-size: 18px; font-weight: bold;">&lt;/&gt;</div>
                            <h3>Easy Integration</h3>
                            <p>Add our CDN snippet to your site and start translating instantly. No complex setup required.</p>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">🌍</div>
                            <h3>Real-Time Language Switching</h3>
                            <p>Allow users to instantly switch languages on your site without page reloads. Enhance user experience with seamless transitions.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <!-- Pricing Section -->
        <section class="pricing" id="pricing">
            <div class="pricing-container">
                <div class="pricing-header">
                    <h2>Choose your plan</h2>
                    <p>Start free and scale as you grow.</p>
                </div>
                
                <div class="pricing-cards">
                    <div class="pricing-card">
                        <div class="plan-name">Free</div>
                        <div class="plan-price">$0<span class="plan-period">/month</span></div>
                        <div class="plan-description">Perfect for small Websites.</div>
                        <ul class="plan-features">
                            <li>1,000 characters/month.</li>
                            <li>5 Languages.</li>
                            <li>Basic Analytics</li>
                        </ul>
                        <button class="plan-button">Get started Free</button>
                    </div>
                    
                    <div class="pricing-card pro-card">
                        <div class="plan-name">Pro</div>
                        <div class="plan-price">$29<span class="plan-period">/month</span></div>
                        <div class="plan-description">For growing Business.</div>
                        <ul class="plan-features">
                            <li>10,000 characters/month.</li>
                            <li>Unlimited Languages.</li>
                            <li>Advanced Analytics</li>
                        </ul>
                        <button class="plan-button">Start Pro Trial</button>
                    </div>
                    
                    <div class="pricing-card">
                        <div class="plan-name">Business</div>
                        <div class="plan-price">$99<span class="plan-period">/month</span></div>
                        <div class="plan-description">For large Enterprises.</div>
                        <ul class="plan-features">
                            <li>1,00,000 characters/month.</li>
                            <li>Unlimited Languages.</li>
                            <li>Advanced Analytics</li>
                        </ul>
                        <button class="plan-button">Start Business Trial</button>
                    </div>
                </div>
            </div>
        </section>
        <!-- Testimonials Section -->
        <section class="testimonials">
            <div class="testimonial-container">
                <h2 class="main-title">What Our Users Are Saying</h2>
                <p class="subtitle">Real Stories of Success from Our Global Community</p>
                
                <div class="testimonials-grid">
                    <div class="testimonial-card">
                        <div class="quote-mark">"</div>
                        <div class="testimonial-text">
                            WebNew's translation tool saved us weeks of manual work. We localized our e-commerce site in 5 languages in under an hour with impressive accuracy.
                        </div>
                        <div class="testimonial-footer">
                            <div class="user-avatar">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
                            <div class="user-name">- Sarah K., E-commerce Manager</div>
                        </div>
                    </div>
                    
                    <div class="testimonial-card">
                        <div class="quote-mark">"</div>
                        <div class="testimonial-text">
                            The AI-powered translations are so natural, our international clients thought we had a team of native speakers working on our documentation.
                        </div>
                        <div class="testimonial-footer">
                            <div class="user-avatar">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
                            <div class="user-name">- Michael T., Tech Startup Founder</div>
                        </div>
                    </div>
                    
                    <div class="testimonial-card">
                        <div class="quote-mark">"</div>
                        <div class="testimonial-text">
                            Implementation was seamless - just added the script and our entire WordPress site became multilingual overnight. The support team is fantastic too.
                        </div>
                        <div class="testimonial-footer">
                            <div class="user-avatar">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
                            <div class="user-name">- David L., Web Developer</div>
                        </div>
                    </div>
                    
                    <div class="testimonial-card">
                        <div class="quote-mark">"</div>
                        <div class="testimonial-text">
                            We saw a 40% increase in international traffic after implementing WebNew. The SEO optimization for multilingual content really works!
                        </div>
                        <div class="testimonial-footer">
                            <div class="user-avatar">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
                            <div class="user-name">- Elena R., Marketing Director</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Dashboard Section -->
        <section class="dashboard" id="dashboard">
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h2>Try Translation Dashboard</h2>
                    <p>Experience our AI-powered translation engine in action</p>
                </div>
                
                <div class="dashboard-content">
                    <div class="translation-panel">
                        <div class="input-section">
                            <div class="input-header">
                                <h3>Original Text</h3>
                                <div class="language-indicator">
                                    <div class="flag english"></div>
                                    <span>English</span>
                                </div>
                            </div>
                            <textarea 
                                id="inputText" 
                                placeholder="Enter text to translate... Try typing 'Welcome to our website' or any other text you'd like to see translated."
                                rows="8"
                            ></textarea>
                            <div class="input-footer">
                                <div class="counter-info">
                                    <span class="char-count">0 characters</span>
                                    <span class="word-count">0 words</span>
                                </div>
                            </div>
                        </div>

                        <div class="translation-controls">
                            <div class="language-dropdown-container">
                                <label for="languageSelector">Translate to:</label>
                                <select id="languageSelector" class="language-dropdown">
                                    <option value="french">🇫🇷 Français</option>
                                    <option value="spanish">🇪🇸 Español</option>
                                    <option value="german">🇩🇪 Deutsch</option>
                                    <option value="italian">🇮🇹 Italiano</option>
                                    <option value="portuguese">🇵🇹 Português</option>
                                    <option value="dutch">🇳🇱 Nederlands</option>
                                    <option value="russian">🇷🇺 Русский</option>
                                    <option value="chinese">🇨🇳 中文</option>
                                    <option value="japanese">🇯🇵 日本語</option>
                                    <option value="korean">🇰🇷 한국어</option>
                                </select>
                            </div>
                            
                            <div class="language-switch">
                                <div class="switch-arrow">→</div>
                            </div>
                            
                            <div class="control-buttons">
                                <button id="translateButton" class="translate-button">
                                    <span class="button-icon">🌍</span>
                                    <span class="button-text">Translate</span>
                                </button>
                                <button id="clearButton" class="clear-button">
                                    <span class="button-icon">🗑️</span>
                                    <span class="button-text">Clear</span>
                                </button>
                            </div>
                        </div>

                        <div class="output-section">
                            <div class="output-header">
                                <h3>Translated Text</h3>
                                <div class="language-indicator" id="targetLanguageIndicator">
                                    <div class="flag french"></div>
                                    <span>Français</span>
                                </div>
                            </div>
                            <textarea 
                                id="outputText" 
                                placeholder="Translation will appear here..."
                                rows="8"
                                readonly
                            ></textarea>
                            <div class="output-footer">
                                <span class="translation-info">Powered by WebNew AI</span>
                                <button id="copyButton" class="copy-output-button">
                                    <span class="button-icon">📋</span>
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="dashboard-features">
                        <div class="feature-item">
                            <div class="feature-icon">⚡</div>
                            <span>Real-time Translation</span>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">🎯</div>
                            <span>Context-Aware AI</span>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">🔒</div>
                            <span>Secure & Private</span>
                        </div>
                    </div>

                    <!-- Adding translation history section -->
                    <div class="translation-history" id="translationHistory">
                        <div class="history-header">
                            <h3>Translation History</h3>
                            <div class="history-actions">
                                <button id="downloadHistoryButton" class="download-history-button" onclick="downloadHistory()">
                                    <span class="button-icon">📥</span>
                                    <span class="button-text">Download</span>
                                </button>
                                <button id="clearHistoryButton" class="clear-history-button">
                                    <span class="button-icon">🗑️</span>
                                    <span class="button-text">Clear History</span>
                                </button>
                            </div>
                        </div>
                        <div class="history-content" id="historyContent">
                            <div class="history-empty">
                                <div class="empty-icon">📝</div>
                                <p>No translations yet. Start translating to see your history here!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Contact Section -->
        <section class="contact">
            <h3>Need Help?</h3>
            <form>
                <input type="text" placeholder="Your Name" required>
                <input type="email" placeholder="Email" required>
                <textarea placeholder="Message" required></textarea>
                <button type="submit" class="cta-button">Send</button>
            </form>
        </section>
        
    <!-- Footer Section -->
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-grid">
          <!-- Column 1 - Logo and Description -->
          <div class="footer-col">
            <div class="footer-logo">
              <img src="/public/logo.png" alt="WebNew Logo" class="logo-img">
              <h3>WebNew</h3>
            </div>
            <p class="footer-description">
              The fastest website translation solution for global businesses. 
              Translate your site in minutes, not weeks.
            </p>
            <div class="social-links">
              <a href="#" class="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#b0b0b0">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                </svg>
              </a>
              <a href="#" class="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#b0b0b0">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" class="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#b0b0b0">
                  <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
                </svg>
              </a>
              <a href="#" class="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#b0b0b0">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Column 2 - Quick Links -->
          <div class="footer-col">
            <h4 class="footer-heading">Quick Links</h4>
            <ul class="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#testimonials">Testimonials</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>

          <!-- Column 3 - Products -->
          <div class="footer-col">
            <h4 class="footer-heading">Products</h4>
            <ul class="footer-links">
              <li><a href="#">Website Translation</a></li>
              <li><a href="#">E-commerce Localization</a></li>
              <li><a href="#">API Integration</a></li>
              <li><a href="#">WordPress Plugin</a></li>
              <li><a href="#">Shopify App</a></li>
            </ul>
          </div>

          <!-- Column 4 - Contact -->
          <div class="footer-col">
            <h4 class="footer-heading">Contact Us</h4>
            <ul class="footer-contact">
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff4444">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>hello@webnew.com</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff4444">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span>123 Tech Street, San Francisco</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff4444">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
                <span>+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="copyright">
            &copy; 2023 WebNew. All rights reserved.
          </div>
          <div class="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
      ` }} />
      <script src="/scripts/script.js"></script>
    </>
  )
}


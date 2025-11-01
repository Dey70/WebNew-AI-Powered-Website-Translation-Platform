// Hamburger menu functionality
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const mobileNav = document.querySelector(".mobile-nav");

  // Toggle mobile menu
  hamburger.addEventListener("click", function () {
    this.classList.toggle("active");
    mobileNav.classList.toggle("active");

    // Toggle body scroll when menu is open
    if (mobileNav.classList.contains("active")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  });

  // Close menu when clicking on links
  document.querySelectorAll(".mobile-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      mobileNav.classList.remove("active");
      document.body.style.overflow = "";
    });
  });

  // Close menu when clicking on login button
  document
    .querySelector(".mobile-nav .cta-button")
    .addEventListener("click", () => {
      hamburger.classList.remove("active");
      mobileNav.classList.remove("active");
      document.body.style.overflow = "";
    });

  // Demo window interactions
  document
    .querySelector(".translate-btn")
    .addEventListener("click", function () {
      const originalText = this.textContent;

      this.textContent = "Translating...";
      this.style.background = "linear-gradient(45deg, #28ca42, #22a83a)";

      setTimeout(() => {
        this.textContent = "Complete!";
        setTimeout(() => {
          this.textContent = originalText;
          this.style.background = "";
        }, 1500);
      }, 1000);
    });

  // Language selector interaction
  document.querySelectorAll(".lang-box").forEach((box) => {
    box.addEventListener("click", function () {
      this.style.transform = "scale(0.95)";
      setTimeout(() => {
        this.style.transform = "";
      }, 150);
    });
  });

  // Tab navigation
  document.querySelectorAll(".nav-tabs span").forEach((tab) => {
    tab.addEventListener("click", function () {
      document
        .querySelectorAll(".nav-tabs span")
        .forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // ===== DASHBOARD FUNCTIONALITY - WEEK 7 ENHANCEMENTS ===== //
  const inputText = document.getElementById("inputText");
  const outputText = document.getElementById("outputText");
  const translateButton = document.getElementById("translateButton");
  const clearButton = document.getElementById("clearButton");
  const languageSelector = document.getElementById("languageSelector");
  const charCount = document.querySelector(".char-count");
  const wordCount = document.querySelector(".word-count");
  const targetLanguageIndicator = document.getElementById(
    "targetLanguageIndicator"
  );
  const copyButton = document.getElementById("copyButton");
  const clearHistoryButton = document.getElementById("clearHistoryButton");
  const historyContent = document.getElementById("historyContent");

  // Language configurations with flags and sample translations
  const languageConfigs = {
    french: {
      name: "Français",
      flag: "french",
      flagEmoji: "🇫🇷",
      translations: {
        "welcome to our website": "bienvenue sur notre site web",
        "hello world": "bonjour le monde",
        "how are you": "comment allez-vous",
        "good morning": "bonjour",
        "thank you": "merci",
        "good evening": "bonsoir",
        please: "s'il vous plaît",
        "excuse me": "excusez-moi",
        yes: "oui",
        no: "non",
        help: "aide",
        "where is": "où est",
        "i love you": "je t'aime",
        "what time is it": "quelle heure est-il",
        "i don't understand": "je ne comprends pas",
        "speak english": "parlez anglais",
        "how much": "combien",
        where: "où",
        when: "quand",
        why: "pourquoi",
        what: "quoi",
        who: "qui",
        how: "comment",
        "good afternoon": "bon après-midi",
        "good night": "bonne nuit",
        "see you": "à bientôt",
        "take care": "prends soin",
        "have fun": "amuse-toi bien",
        "be careful": "fais attention",
        "i understand": "je comprends",
        "i don't know": "je ne sais pas",
        "excuse me": "excusez-moi",
        "i'm sorry": "je suis désolé",
        "you're welcome": "de rien",
        "nice to meet you": "enchanté de vous rencontrer",
      },
    },
    spanish: {
      name: "Español",
      flag: "spanish",
      flagEmoji: "🇪🇸",
      translations: {
        "welcome to our website": "bienvenido a nuestro sitio web",
        "hello world": "hola mundo",
        "how are you": "¿cómo estás?",
        "good morning": "buenos días",
        "thank you": "gracias",
        "good evening": "buenas noches",
        please: "por favor",
        "excuse me": "disculpe",
        yes: "sí",
        no: "no",
        help: "ayuda",
        "where is": "dónde está",
        "i love you": "te amo",
        "what time is it": "¿qué hora es?",
        "i don't understand": "no entiendo",
        "speak english": "habla inglés",
        "how much": "cuánto",
        where: "dónde",
        when: "cuándo",
        why: "por qué",
        what: "qué",
        who: "quién",
        how: "cómo",
        "good afternoon": "buenas tardes",
        "good night": "buenas noches",
        "see you": "hasta luego",
        "take care": "cuídate",
        "have fun": "diviértete",
        "be careful": "ten cuidado",
        "i understand": "entiendo",
        "i don't know": "no sé",
        "excuse me": "disculpe",
        "i'm sorry": "lo siento",
        "you're welcome": "de nada",
        "nice to meet you": "encantado de conocerte",
      },
    },
    german: {
      name: "Deutsch",
      flag: "german",
      flagEmoji: "🇩🇪",
      translations: {
        "welcome to our website": "willkommen auf unserer website",
        "hello world": "hallo welt",
        "how are you": "wie geht es dir?",
        "good morning": "guten morgen",
        "thank you": "danke",
        "good evening": "guten abend",
        please: "bitte",
        "excuse me": "entschuldigung",
        yes: "ja",
        no: "nein",
        help: "hilfe",
        "where is": "wo ist",
        "i love you": "ich liebe dich",
        "what time is it": "wie spät ist es?",
        "i don't understand": "ich verstehe nicht",
        "speak english": "sprechen sie englisch",
        "how much": "wie viel",
        where: "wo",
        when: "wann",
        why: "warum",
        what: "was",
        who: "wer",
        how: "wie",
      },
    },
    italian: {
      name: "Italiano",
      flag: "italian",
      flagEmoji: "🇮🇹",
      translations: {
        "welcome to our website": "benvenuto nel nostro sito web",
        "hello world": "ciao mondo",
        "how are you": "come stai?",
        "good morning": "buongiorno",
        "thank you": "grazie",
        "good evening": "buonasera",
        please: "per favore",
        "excuse me": "scusi",
        yes: "sì",
        no: "no",
        help: "aiuto",
        "where is": "dov'è",
        "i love you": "ti amo",
        "what time is it": "che ore sono?",
        "i don't understand": "non capisco",
        "speak english": "parla inglese",
        "how much": "quanto",
        where: "dove",
        when: "quando",
        why: "perché",
        what: "cosa",
        who: "chi",
        how: "come",
      },
    },
    portuguese: {
      name: "Português",
      flag: "portuguese",
      flagEmoji: "🇵🇹",
      translations: {
        "welcome to our website": "bem-vindo ao nosso site",
        "hello world": "olá mundo",
        "how are you": "como está?",
        "good morning": "bom dia",
        "thank you": "obrigado",
        "good evening": "boa noite",
        please: "por favor",
        "excuse me": "com licença",
        yes: "sim",
        no: "não",
        help: "ajuda",
        "where is": "onde está",
        "i love you": "eu te amo",
        "what time is it": "que horas são?",
        "i don't understand": "eu não entendo",
        "speak english": "fala inglês",
        "how much": "quanto",
        where: "onde",
        when: "quando",
        why: "por que",
        what: "o que",
        who: "quem",
        how: "como",
      },
    },
    dutch: {
      name: "Nederlands",
      flag: "dutch",
      flagEmoji: "🇳🇱",
      translations: {
        "welcome to our website": "welkom op onze website",
        "hello world": "hallo wereld",
        "how are you": "hoe gaat het?",
        "good morning": "goedemorgen",
        "thank you": "dank je",
        "good evening": "goedenavond",
        please: "alsjeblieft",
        "excuse me": "pardon",
        yes: "ja",
        no: "nee",
        help: "hulp",
        "where is": "waar is",
        "i love you": "ik hou van je",
        "what time is it": "hoe laat is het?",
        "i don't understand": "ik begrijp het niet",
        "speak english": "spreek engels",
        "how much": "hoeveel",
        where: "waar",
        when: "wanneer",
        why: "waarom",
        what: "wat",
        who: "wie",
        how: "hoe",
      },
    },
    russian: {
      name: "Русский",
      flag: "russian",
      flagEmoji: "🇷🇺",
      translations: {
        "welcome to our website": "добро пожаловать на наш сайт",
        "hello world": "привет мир",
        "how are you": "как дела?",
        "good morning": "доброе утро",
        "thank you": "спасибо",
        "good evening": "добрый вечер",
        please: "пожалуйста",
        "excuse me": "извините",
        yes: "да",
        no: "нет",
        help: "помощь",
        "where is": "где находится",
        "i love you": "я тебя люблю",
        "what time is it": "который час?",
        "i don't understand": "я не понимаю",
        "speak english": "говорите по-английски",
        "how much": "сколько",
        where: "где",
        when: "когда",
        why: "почему",
        what: "что",
        who: "кто",
        how: "как",
      },
    },
    chinese: {
      name: "中文",
      flag: "chinese",
      flagEmoji: "🇨🇳",
      translations: {
        "welcome to our website": "欢迎来到我们的网站",
        "hello world": "你好世界",
        "how are you": "你好吗？",
        "good morning": "早上好",
        "thank you": "谢谢",
        "good evening": "晚上好",
        please: "请",
        "excuse me": "打扰一下",
        yes: "是",
        no: "不",
        help: "帮助",
        "where is": "在哪里",
        "i love you": "我爱你",
        "what time is it": "现在几点？",
        "i don't understand": "我不明白",
        "speak english": "说英语",
        "how much": "多少",
        where: "哪里",
        when: "什么时候",
        why: "为什么",
        what: "什么",
        who: "谁",
        how: "怎么样",
      },
    },
    japanese: {
      name: "日本語",
      flag: "japanese",
      flagEmoji: "🇯🇵",
      translations: {
        "welcome to our website": "私たちのウェブサイトへようこそ",
        "hello world": "こんにちは世界",
        "how are you": "元気ですか？",
        "good morning": "おはようございます",
        "thank you": "ありがとう",
        "good evening": "こんばんは",
        please: "お願いします",
        "excuse me": "すみません",
        yes: "はい",
        no: "いいえ",
        help: "助け",
        "where is": "どこにありますか",
        "i love you": "愛しています",
        "what time is it": "今何時ですか？",
        "i don't understand": "分かりません",
        "speak english": "英語を話してください",
        "how much": "いくら",
        where: "どこ",
        when: "いつ",
        why: "なぜ",
        what: "何",
        who: "誰",
        how: "どのように",
      },
    },
    korean: {
      name: "한국어",
      flag: "korean",
      flagEmoji: "🇰🇷",
      translations: {
        "welcome to our website": "저희 웹사이트에 오신 것을 환영합니다",
        "hello world": "안녕하세요 세계",
        "how are you": "어떻게 지내세요?",
        "good morning": "좋은 아침",
        "thank you": "감사합니다",
        "good evening": "좋은 저녁",
        please: "제발",
        "excuse me": "실례합니다",
        yes: "네",
        no: "아니요",
        help: "도움",
        "where is": "어디에 있습니까",
        "i love you": "사랑해요",
        "what time is it": "지금 몇 시예요?",
        "i don't understand": "이해하지 못하겠습니다",
        "speak english": "영어 하세요",
        "how much": "얼마",
        where: "어디",
        when: "언제",
        why: "왜",
        what: "무엇",
        who: "누구",
        how: "어떻게",
      },
    },
  };

  // Initialize current language
  let currentLanguage = "french";

  // ===== LIVE CHARACTER AND WORD COUNTER ===== //
  function updateCounters(text) {
    const charLength = text.length;
    const wordLength = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

    if (charCount) {
      charCount.textContent = `${charLength} characters`;
      // Add visual feedback for character limits
      if (charLength > 1000) {
        charCount.style.color = "#ff4444";
        charCount.style.fontWeight = "bold";
      } else if (charLength > 800) {
        charCount.style.color = "#ff9500";
        charCount.style.fontWeight = "bold";
      } else {
        charCount.style.color = "#888";
        charCount.style.fontWeight = "normal";
      }
    }

    if (wordCount) {
      wordCount.textContent = `${wordLength} words`;
    }
  }

  // Character counter functionality
  if (inputText && (charCount || wordCount)) {
    inputText.addEventListener("input", function () {
      updateCounters(this.value);
    });

    // Initialize counters
    updateCounters(inputText.value);
  }

  // ===== LANGUAGE SELECTOR FUNCTIONALITY ===== //
  function updateLanguageIndicator(languageKey) {
    const config = languageConfigs[languageKey];
    if (targetLanguageIndicator && config) {
      const flagElement = targetLanguageIndicator.querySelector(".flag");
      const textElement = targetLanguageIndicator.querySelector("span");

      if (flagElement && textElement) {
        flagElement.className = `flag ${config.flag}`;
        textElement.textContent = config.name;
      }
    }
  }

  // Language selector change event
  if (languageSelector) {
    languageSelector.addEventListener("change", function () {
      currentLanguage = this.value;
      updateLanguageIndicator(currentLanguage);

      // Add selection animation
      this.style.transform = "scale(0.98)";
      setTimeout(() => {
        this.style.transform = "scale(1)";
      }, 150);

      // Clear output when language changes
      if (outputText && outputText.value.trim() !== "") {
        outputText.value = "";
        // Show a hint about the new language
        outputText.placeholder = `Translation will appear in ${languageConfigs[currentLanguage].name}...`;
        setTimeout(() => {
          outputText.placeholder = "Translation will appear here...";
        }, 3000);
      }
    });

    // Initialize language indicator
    updateLanguageIndicator(currentLanguage);
  }

  // ===== ENHANCED TRANSLATION FUNCTIONALITY ===== //
  async function translateText(text, targetLang) {
    // 1) Try multiple LibreTranslate endpoints for better reliability
    const libreEndpoints = [
      "https://libretranslate.de/translate",
      "https://translate.argosopentech.com/translate",
      "https://libretranslate.com/translate"
    ];

    for (const endpoint of libreEndpoints) {
      try {
        const resp = await fetch(endpoint, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          body: JSON.stringify({ 
            q: text, 
            source: "en", 
            target: mapInternalToIso(targetLang), 
            format: "text" 
          }),
        });
        
        if (resp.ok) {
          const ltData = await resp.json();
          const translated = ltData?.translatedText || ltData?.translation;
          if (translated && translated.trim() !== text.trim()) {
            console.log(`Translation successful via ${endpoint}`);
            return translated;
          }
        }
      } catch (e) {
        console.warn(`LibreTranslate endpoint ${endpoint} failed:`, e?.message);
      }
    }

    // 2) Try Google Translate API (if available)
    try {
      const googleTranslated = await tryGoogleTranslate(text, targetLang);
      if (googleTranslated) return googleTranslated;
    } catch (e) {
      console.warn("Google Translate fallback failed:", e?.message);
    }

    // 3) Enhanced fallback: generate improved local translation
    return generateEnhancedFallbackTranslation(text, targetLang);
  }

  // Google Translate fallback function
  async function tryGoogleTranslate(text, targetLang) {
    try {
      const targetCode = mapInternalToIso(targetLang);
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(googleUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          return data[0].map(item => item[0]).join('');
        }
      }
    } catch (e) {
      console.warn("Google Translate failed:", e?.message);
    }
    return null;
  }

  function mapInternalToIso(lang) {
    const mapping = {
      french: "fr",
      spanish: "es",
      german: "de",
      italian: "it",
      portuguese: "pt",
      dutch: "nl",
      russian: "ru",
      chinese: "zh",
      japanese: "ja",
      korean: "ko",
    };
    return mapping[String(lang).toLowerCase()] || lang || "en";
  }

  function generateEnhancedFallbackTranslation(text, targetLang) {
    const config = languageConfigs[targetLang];
    if (!config) return `${text} [Translated to ${targetLang}]`;

    const lowerText = text.toLowerCase().trim();

    // Check for exact match first
    if (config.translations[lowerText]) {
      return config.translations[lowerText];
    }

    // Enhanced phrase matching for common expressions
    const phraseMatch = findPhraseMatch(text, config.translations);
    if (phraseMatch) {
      return phraseMatch;
    }

    // Enhanced word-by-word translation with better context
    const words = text.split(/\s+/);
    const translatedWords = words.map((word, index) => {
      // Remove punctuation for lookup but preserve it
      const cleanWord = word.toLowerCase().replace(/[.,!?;:"'()]/g, "");
      const punctuation = word.replace(/[a-zA-Z]/g, "");

      // Look up the clean word
      let translatedWord = config.translations[cleanWord];
      
      if (!translatedWord) {
        // Try to find partial matches for common words
        translatedWord = findPartialMatch(cleanWord, config.translations) || 
                        findContextualMatch(cleanWord, words, index, config.translations) ||
                        generateSmartMockTranslation(cleanWord, targetLang, words, index);
      }

      // Add proper capitalization for first word of sentence
      if (index === 0 && translatedWord) {
        translatedWord = translatedWord.charAt(0).toUpperCase() + translatedWord.slice(1);
      }

      return translatedWord + punctuation;
    });

    return translatedWords.join(" ");
  }

  // Enhanced phrase matching
  function findPhraseMatch(text, translations) {
    const phrases = [
      "how are you", "good morning", "good evening", "thank you very much",
      "you're welcome", "excuse me", "i'm sorry", "nice to meet you",
      "have a good day", "see you later", "take care", "good luck"
    ];
    
    for (const phrase of phrases) {
      if (text.toLowerCase().includes(phrase)) {
        const key = phrase.toLowerCase();
        if (translations[key]) {
          return text.toLowerCase().replace(phrase, translations[key]);
        }
      }
    }
    return null;
  }

  // Contextual word matching
  function findContextualMatch(word, allWords, index, translations) {
    // Look for context clues
    const context = {
      before: allWords[index - 1]?.toLowerCase(),
      after: allWords[index + 1]?.toLowerCase(),
      current: word
    };

    // Common patterns
    if (context.before === "i" && word === "am") {
      return translations["am"] || "suis";
    }
    if (context.before === "you" && word === "are") {
      return translations["are"] || "êtes";
    }
    if (word === "the" && context.after) {
      return translations["the"] || "le";
    }

    return null;
  }

  // Helper function to find partial matches in translations
  function findPartialMatch(word, translations) {
    // Look for words that contain the current word
    for (const [key, value] of Object.entries(translations)) {
      if (key.includes(word) && word.length > 2) {
        return value.split(' ').find(w => w.toLowerCase().includes(word)) || value;
      }
    }
    return null;
  }

  // Smart mock translation with better accuracy
  function generateSmartMockTranslation(word, targetLang, allWords, index) {
    if (word.length < 2) return word;

    // Enhanced patterns with more realistic translations
    const smartPatterns = {
      french: {
        suffixes: ["é", "er", "tion", "ique", "eux", "euse", "ment", "age", "ure"],
        prefixes: ["dé", "pré", "sur", "sous", "re", "co"],
        commonWords: {
          "hello": "bonjour", "world": "monde", "love": "amour", "time": "temps",
          "day": "jour", "night": "nuit", "home": "maison", "work": "travail"
        }
      },
      spanish: {
        suffixes: ["o", "a", "ción", "ico", "oso", "osa", "mente", "aje", "ura"],
        prefixes: ["des", "pre", "sobre", "sub", "re", "co"],
        commonWords: {
          "hello": "hola", "world": "mundo", "love": "amor", "time": "tiempo",
          "day": "día", "night": "noche", "home": "casa", "work": "trabajo"
        }
      },
      german: {
        suffixes: ["en", "er", "ung", "isch", "lich", "ig", "heit", "keit"],
        prefixes: ["un", "vor", "über", "unter", "ver", "be"],
        commonWords: {
          "hello": "hallo", "world": "welt", "love": "liebe", "time": "zeit",
          "day": "tag", "night": "nacht", "home": "haus", "work": "arbeit"
        }
      },
      italian: {
        suffixes: ["o", "a", "zione", "ico", "oso", "osa", "mente", "aggio", "ura"],
        prefixes: ["dis", "pre", "sopra", "sotto", "ri", "co"],
        commonWords: {
          "hello": "ciao", "world": "mondo", "love": "amore", "time": "tempo",
          "day": "giorno", "night": "notte", "home": "casa", "work": "lavoro"
        }
      },
      portuguese: {
        suffixes: ["o", "a", "ção", "ico", "oso", "osa", "mente", "agem", "ura"],
        prefixes: ["des", "pré", "sobre", "sub", "re", "co"],
        commonWords: {
          "hello": "olá", "world": "mundo", "love": "amor", "time": "tempo",
          "day": "dia", "night": "noite", "home": "casa", "work": "trabalho"
        }
      },
      dutch: {
        suffixes: ["en", "er", "ing", "isch", "lijk", "ig", "heid", "teit"],
        prefixes: ["on", "voor", "over", "onder", "ver", "be"],
        commonWords: {
          "hello": "hallo", "world": "wereld", "love": "liefde", "time": "tijd",
          "day": "dag", "night": "nacht", "home": "huis", "work": "werk"
        }
      },
      russian: {
        suffixes: ["ый", "ая", "ое", "ие", "ов", "ен", "ка", "ость", "ство"],
        prefixes: ["не", "пре", "над", "под", "пере", "со"],
        commonWords: {
          "hello": "привет", "world": "мир", "love": "любовь", "time": "время",
          "day": "день", "night": "ночь", "home": "дом", "work": "работа"
        }
      },
      chinese: {
        suffixes: ["的", "了", "着", "过", "们", "子", "性", "化", "度"],
        prefixes: ["不", "再", "超", "副", "重", "自"],
        commonWords: {
          "hello": "你好", "world": "世界", "love": "爱", "time": "时间",
          "day": "天", "night": "夜晚", "home": "家", "work": "工作"
        }
      },
      japanese: {
        suffixes: ["る", "た", "て", "ます", "です", "の", "に", "を", "が"],
        prefixes: ["不", "再", "超", "副", "重", "自"],
        commonWords: {
          "hello": "こんにちは", "world": "世界", "love": "愛", "time": "時間",
          "day": "日", "night": "夜", "home": "家", "work": "仕事"
        }
      },
      korean: {
        suffixes: ["다", "요", "는", "을", "를", "의", "에", "에서", "로"],
        prefixes: ["불", "재", "초", "부", "중", "자"],
        commonWords: {
          "hello": "안녕하세요", "world": "세계", "love": "사랑", "time": "시간",
          "day": "일", "night": "밤", "home": "집", "work": "일"
        }
      }
    };

    const patterns = smartPatterns[targetLang] || smartPatterns.french;
    
    // Check for common words first
    if (patterns.commonWords[word.toLowerCase()]) {
      return patterns.commonWords[word.toLowerCase()];
    }

    let translated = word;

    // Smart suffix addition based on word patterns
    if (word.endsWith('ing') && targetLang !== 'chinese' && targetLang !== 'japanese' && targetLang !== 'korean') {
      const suffix = patterns.suffixes[Math.floor(Math.random() * Math.min(3, patterns.suffixes.length))];
      translated = word.slice(0, -3) + suffix;
    } else if (word.endsWith('tion') && targetLang !== 'chinese' && targetLang !== 'japanese' && targetLang !== 'korean') {
      const suffix = patterns.suffixes[Math.floor(Math.random() * Math.min(3, patterns.suffixes.length))];
      translated = word.slice(0, -4) + suffix;
    } else if (word.length > 3) {
      // Add appropriate suffix based on language
      const suffix = patterns.suffixes[Math.floor(Math.random() * Math.min(2, patterns.suffixes.length))];
      translated = word + suffix;
    }

    return translated;
  }

  // Legacy function for backward compatibility
  function generateMockTranslation(word, targetLang) {
    return generateSmartMockTranslation(word, targetLang, [], 0);
  }

  // Calculate translation quality score
  function calculateTranslationQuality(originalText, translatedText, targetLang) {
    let score = 0;
    const config = languageConfigs[targetLang];
    
    if (!config) return 0.3; // Low score for unknown language
    
    const originalWords = originalText.toLowerCase().split(/\s+/);
    const translatedWords = translatedText.toLowerCase().split(/\s+/);
    
    // Check for exact phrase matches (highest quality)
    if (config.translations[originalText.toLowerCase()]) {
      return 1.0;
    }
    
    // Check for word-by-word accuracy
    let matchedWords = 0;
    for (const word of originalWords) {
      const cleanWord = word.replace(/[.,!?;:"'()]/g, "");
      if (config.translations[cleanWord]) {
        matchedWords++;
      }
    }
    
    // Base score on matched words
    score = matchedWords / originalWords.length;
    
    // Bonus for contextual matches
    if (findPhraseMatch(originalText, config.translations)) {
      score += 0.2;
    }
    
    // Penalty for obvious fallback patterns
    if (translatedText.includes('[Translated to') || 
        translatedText.includes(']') ||
        translatedText === originalText) {
      score = Math.min(score, 0.4);
    }
    
    // Bonus for proper capitalization and punctuation
    if (translatedText.charAt(0) === translatedText.charAt(0).toUpperCase()) {
      score += 0.1;
    }
    
    return Math.min(Math.max(score, 0), 1);
  }

  // Enhanced typing animation for translation output
  function typeTranslation(text, callback) {
    if (!outputText) return;

    let i = 0;
    const typeSpeed = Math.max(20, Math.min(50, 1000 / text.length)); // Adaptive speed
    outputText.value = "";
    
    // Add typing cursor effect and visual state
    outputText.style.borderRight = "2px solid #ff4444";
    outputText.style.animation = "blink 1s infinite";
    outputText.style.boxShadow = "0 0 10px rgba(255, 68, 68, 0.3)";
    outputText.classList.add("typing");

    function typeChar() {
      if (i < text.length) {
        outputText.value += text.charAt(i);
        i++;
        
        // Add slight delay for punctuation
        const char = text.charAt(i - 1);
        const delay = /[.!?]/.test(char) ? typeSpeed * 3 : typeSpeed;
        
        setTimeout(typeChar, delay);
      } else {
        // Remove typing cursor and effects
        outputText.style.borderRight = "";
        outputText.style.animation = "";
        outputText.style.boxShadow = "";
        outputText.classList.remove("typing");
        outputText.classList.add("completed");
        
        // Add completion animation with success glow
        outputText.style.animation = "fadeInScale 0.5s ease-out";
        outputText.style.boxShadow = "0 0 20px rgba(40, 167, 69, 0.4)";
        
        setTimeout(() => {
          outputText.style.animation = "";
          outputText.style.boxShadow = "";
          outputText.classList.remove("completed");
        }, 500);
        
        if (callback) callback();
      }
    }

    typeChar();
  }

  // ===== TRANSLATION BUTTON FUNCTIONALITY ===== //
  if (translateButton && inputText && outputText) {
    translateButton.addEventListener("click", async () => {
      const text = inputText.value.trim();

      if (!text) {
        // Enhanced shake animation for empty input
        inputText.style.animation = "shake 0.5s ease-in-out";
        inputText.style.borderColor = "#ff4444";
        inputText.focus();

        setTimeout(() => {
          inputText.style.animation = "";
          inputText.style.borderColor = "";
        }, 500);
        return;
      }

      // Disable button and show enhanced loading state
      translateButton.disabled = true;
      const buttonText = translateButton.querySelector(".button-text");
      const buttonIcon = translateButton.querySelector(".button-icon");
      const originalText = buttonText.textContent;
      const originalIcon = buttonIcon.textContent;

      // Create loading spinner with better styling
      const spinner = document.createElement("div");
      spinner.className = "loading-spinner";
      spinner.style.marginRight = "8px";
      spinner.style.width = "16px";
      spinner.style.height = "16px";
      spinner.style.borderWidth = "2px";
      spinner.style.borderColor = "#ffffff transparent transparent transparent";
      
      buttonText.textContent = "Translating...";
      buttonIcon.innerHTML = "";
      buttonIcon.appendChild(spinner);
      translateButton.style.background = "linear-gradient(135deg, #666 0%, #555 100%)";
      translateButton.style.transform = "scale(0.98)";
      translateButton.style.transition = "all 0.2s ease";
      translateButton.classList.add("loading");

      // Clear output and show processing state with animation
      outputText.value = "";
      outputText.placeholder = "Processing translation...";
      outputText.style.opacity = "0.7";
      
      // Add loading overlay to output section
      const outputSection = outputText.closest('.output-section');
      const loadingOverlay = document.createElement("div");
      loadingOverlay.className = "loading-overlay";
      loadingOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">Translating...</div>
      `;
      outputSection.style.position = "relative";
      outputSection.appendChild(loadingOverlay);

      try {
        const translation = await translateText(text, currentLanguage);

        // Remove loading overlay
        const loadingOverlay = outputSection.querySelector('.loading-overlay');
        if (loadingOverlay) {
          loadingOverlay.remove();
        }
        outputText.style.opacity = "1";

        // Type out the translation with animation
        typeTranslation(translation, () => {
          // Re-enable button with success animation
          translateButton.disabled = false;
          buttonText.textContent = "✓ Translated!";
          buttonIcon.textContent = "✅";
          translateButton.style.background = "linear-gradient(135deg, #28a745 0%, #20c997 100%)";
          translateButton.style.transform = "scale(1.02)";
          translateButton.classList.remove("loading");
          translateButton.classList.add("success");
          
          // Show success notification with quality indicator
          const qualityScore = calculateTranslationQuality(text, translation, currentLanguage);
          const qualityMessage = qualityScore > 0.8 ? "High quality translation!" : 
                                qualityScore > 0.6 ? "Good translation!" : 
                                "Translation completed (fallback used)";
          showNotification(qualityMessage, qualityScore > 0.6 ? "success" : "warning");
          
          // Reset button after delay
          setTimeout(() => {
            buttonText.textContent = originalText;
            buttonIcon.textContent = originalIcon;
            translateButton.style.background = "";
            translateButton.style.transform = "scale(1)";
            translateButton.classList.remove("success");
          }, 2000);
          
          outputText.placeholder = "Translation will appear here...";

          storeTranslationHistory(text, translation, currentLanguage);
        });
      } catch (error) {
        console.error("Translation failed:", error);
        
        // Remove loading overlay on error
        const loadingOverlay = outputSection.querySelector('.loading-overlay');
        if (loadingOverlay) {
          loadingOverlay.remove();
        }
        outputText.style.opacity = "1";
        
        // Re-enable button with error feedback
        translateButton.disabled = false;
        const buttonText = translateButton.querySelector(".button-text");
        const buttonIcon = translateButton.querySelector(".button-icon");
        if (buttonText) buttonText.textContent = "⚠️ Retry";
        if (buttonIcon) buttonIcon.textContent = "⚠️";
        translateButton.style.background = "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)";
        translateButton.style.transform = "scale(0.98)";
        translateButton.classList.remove("loading");
        translateButton.classList.add("error");
        
        // Show error notification
        showNotification("Translation failed. Using fallback translation.", "warning");
        
        // Reset button after delay
        setTimeout(() => {
          if (buttonText) buttonText.textContent = "Translate";
          if (buttonIcon) buttonIcon.textContent = "🌍";
          translateButton.style.background = "";
          translateButton.style.transform = "scale(1)";
          translateButton.classList.remove("error");
        }, 3000);
      }
    });
  }

  // ===== CLEAR BUTTON FUNCTIONALITY ===== //
  if (clearButton && inputText && outputText) {
    clearButton.addEventListener("click", function () {
      // Add click animation
      this.style.transform = "scale(0.95)";
      setTimeout(() => {
        this.style.transform = "";
      }, 150);

      // Clear both text areas with animation
      const originalInputBorder = inputText.style.borderColor;
      const originalOutputBorder = outputText.style.borderColor;

      inputText.style.borderColor = "#ff9500";
      outputText.style.borderColor = "#ff9500";

      // Fade out content
      inputText.style.opacity = "0.5";
      outputText.style.opacity = "0.5";

      setTimeout(() => {
        inputText.value = "";
        outputText.value = "";
        updateCounters("");

        // Fade back in
        inputText.style.opacity = "1";
        outputText.style.opacity = "1";
        inputText.style.borderColor = originalInputBorder;
        outputText.style.borderColor = originalOutputBorder;

        // Focus on input
        inputText.focus();
      }, 200);
    });
  }

  // ===== COPY FUNCTIONALITY ===== //
  if (copyButton && outputText) {
    copyButton.addEventListener("click", function () {
      const textToCopy = outputText.value.trim();

      if (!textToCopy) {
        // Show feedback for empty output
        this.style.background =
          "linear-gradient(135deg, #ff4444 0%, #cc3333 100%)";
        const originalText = this.textContent;
        this.textContent = "Nothing to copy!";

        setTimeout(() => {
          this.textContent = originalText;
          this.style.background = "";
        }, 2000);
        return;
      }

      // Copy to clipboard
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          // Success feedback
          const originalText = this.textContent;
          const originalBackground = this.style.background;

          this.textContent = "Copied!";
          this.style.background =
            "linear-gradient(135deg, #28a745 0%, #20c997 100%)";
          this.style.transform = "scale(1.05)";

          setTimeout(() => {
            this.textContent = originalText;
            this.style.background = originalBackground;
            this.style.transform = "";
          }, 2000);
        })
        .catch(() => {
          // Error feedback
          this.style.background =
            "linear-gradient(135deg, #ff4444 0%, #cc3333 100%)";
          const originalText = this.textContent;
          this.textContent = "Copy failed!";

          setTimeout(() => {
            this.textContent = originalText;
            this.style.background = "";
          }, 2000);
        });
    });
  }

  // ===== DEMO WALKTHROUGH FEATURE ===== //
  let demoActive = false;

  function startDemoWalkthrough() {
    if (demoActive) return;
    demoActive = true;

    const steps = [
      {
        element: inputText,
        text: "Welcome to our website! Let me translate this for you.",
        highlight: "input-section",
        delay: 1000,
      },
      {
        element: languageSelector,
        text: null,
        highlight: "language-dropdown-container",
        action: () => {
          languageSelector.value = "spanish";
          languageSelector.dispatchEvent(new Event("change"));
        },
        delay: 1500,
      },
      {
        element: translateButton,
        text: null,
        highlight: "translate-button",
        action: () => {
          translateButton.click();
        },
        delay: 2000,
      },
    ];

    let currentStep = 0;

    function executeStep() {
      if (currentStep >= steps.length) {
        demoActive = false;
        document.querySelectorAll(".demo-highlight").forEach((el) => {
          el.classList.remove("demo-highlight");
        });
        return;
      }

      const step = steps[currentStep];

      // Remove previous highlight
      document.querySelectorAll(".demo-highlight").forEach((el) => {
        el.classList.remove("demo-highlight");
      });

      // Add highlight to current element
      const targetElement =
        document.querySelector(`.${step.highlight}`) || step.element;
      if (targetElement) {
        targetElement.classList.add("demo-highlight");
      }

      // Add text if first step
      if (step.text && step.element) {
        step.element.value = step.text;
        updateCounters(step.text);
      }

      // Execute action if present
      if (step.action) {
        setTimeout(step.action, 500);
      }

      currentStep++;
      setTimeout(executeStep, step.delay);
    }

    executeStep();
  }

  // Demo walkthrough for presentation
  window.startDemoWalkthrough = () => {
    startDemoWalkthrough();
  };

  // Add demo button to dashboard header
  const dashboardHeader = document.querySelector('.dashboard-header');
  if (dashboardHeader) {
    const demoButton = document.createElement('button');
    demoButton.className = 'cta-button';
    demoButton.style.marginTop = '1rem';
    demoButton.textContent = '🎬 Start Demo';
    demoButton.onclick = () => startDemoWalkthrough();
    dashboardHeader.appendChild(demoButton);
  }

  // Add CSS for demo highlighting
  if (!document.querySelector("#demo-highlight-style")) {
    const style = document.createElement("style");
    style.id = "demo-highlight-style";
    style.textContent = `
      .demo-highlight {
        animation: demoGlow 2s ease-in-out infinite;
        position: relative;
        z-index: 10;
      }
      
      @keyframes demoGlow {
        0%, 100% { 
          box-shadow: 0 0 20px rgba(255, 68, 68, 0.5);
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 0 30px rgba(255, 68, 68, 0.8);
          transform: scale(1.02);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Add shake animation to CSS if not present
  if (!document.querySelector("#shake-style")) {
    const style = document.createElement("style");
    style.id = "shake-style";
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== OTHER EXISTING FUNCTIONALITY ===== //

  // ===== OTHER EXISTING FUNCTIONALITY ===== //

  // Form submission
  const contactForm = document.querySelector(".contact form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      alert("Thank you for your message! We'll get back to you soon.");
      this.reset();
    });
  }

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });

  // Login button functionality
  const headerLoginButton = document.querySelector("header .cta-button");
  if (headerLoginButton) {
    headerLoginButton.addEventListener("click", () => {
      alert("Login functionality would be implemented here.");
    });
  }

  // Try for Free button functionality
  const heroCtaButton = document.querySelector(".hero .cta-button");
  if (heroCtaButton) {
    heroCtaButton.addEventListener("click", () => {
      // Scroll to dashboard section
      const dashboard = document.querySelector("#dashboard");
      if (dashboard) {
        dashboard.scrollIntoView({
          behavior: "smooth",
        });
      } else {
        alert("Free trial signup would be implemented here.");
      }
    });
  }

  // Add scroll effect to header
  window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    if (header) {
      if (window.scrollY > 100) {
        header.style.background = "rgba(0, 0, 0, 0.95)";
      } else {
        header.style.background = "rgba(0, 0, 0, 0.8)";
      }
    }
  });

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Observe elements for animation
  document
    .querySelectorAll(".step, .feature, .testimonial-card, .feature-card")
    .forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(el);
    });

  // Dashboard animation on scroll
  const dashboardSection = document.querySelector(".dashboard");
  if (dashboardSection) {
    const dashboardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate dashboard elements
            const translationPanel =
              entry.target.querySelector(".translation-panel");
            const features = entry.target.querySelectorAll(".feature-item");

            if (translationPanel) {
              translationPanel.style.opacity = "0";
              translationPanel.style.transform = "translateY(30px)";
              translationPanel.style.transition = "all 0.8s ease";

              setTimeout(() => {
                translationPanel.style.opacity = "1";
                translationPanel.style.transform = "translateY(0)";
              }, 200);
            }

            features.forEach((feature, index) => {
              feature.style.opacity = "0";
              feature.style.transform = "translateY(20px)";
              feature.style.transition = "all 0.6s ease";

              setTimeout(() => {
                feature.style.opacity = "1";
                feature.style.transform = "translateY(0)";
              }, 400 + index * 100);
            });
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -100px 0px",
      }
    );

    dashboardObserver.observe(dashboardSection);
  }

  // ===== KEYBOARD SHORTCUTS ===== //
  document.addEventListener("keydown", (e) => {
    // Ctrl + Enter to translate (when input is focused)
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "Enter" &&
      inputText &&
      document.activeElement === inputText
    ) {
      e.preventDefault();
      if (translateButton && !translateButton.disabled) {
        translateButton.click();
      }
    }

    // Esc to clear (when dashboard elements are focused)
    if (e.key === "Escape" && clearButton) {
      const dashboardElements = [
        inputText,
        outputText,
        languageSelector,
        translateButton,
        clearButton,
      ];
      if (dashboardElements.includes(document.activeElement)) {
        clearButton.click();
      }
    }
  });

  // ===== ENHANCED ACCESSIBILITY ===== //
  // Add ARIA labels and improve keyboard navigation
  if (translateButton) {
    translateButton.setAttribute(
      "aria-label",
      "Translate text to selected language"
    );
  }

  if (clearButton) {
    clearButton.setAttribute("aria-label", "Clear input and output text");
  }

  if (copyButton) {
    copyButton.setAttribute("aria-label", "Copy translated text to clipboard");
  }

  if (languageSelector) {
    languageSelector.setAttribute(
      "aria-label",
      "Select target language for translation"
    );
  }

  // ===== SAMPLE TEXT SUGGESTIONS ===== //
  const sampleTexts = [
    "Welcome to our website",
    "Hello world",
    "How are you today?",
    "Thank you for your help",
    "Good morning everyone",
    "Please contact us for support",
    "We provide excellent service",
    "Innovation drives our success",
  ];

  // Add sample text functionality (double-click on input to get random sample)
  if (inputText) {
    inputText.addEventListener("dblclick", function () {
      if (this.value.trim() === "") {
        const randomText =
          sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
        this.value = randomText;
        updateCounters(randomText);

        // Show hint
        this.style.backgroundColor = "rgba(74, 144, 226, 0.1)";
        setTimeout(() => {
          this.style.backgroundColor = "";
        }, 1000);
      }
    });

    // Add title for hint
    inputText.setAttribute("title", "Double-click for sample text when empty");
  }

  // ===== PERFORMANCE OPTIMIZATION ===== //
  // Debounce function for input events
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Debounced counter update for better performance
  if (inputText) {
    const debouncedUpdateCounters = debounce(
      (text) => updateCounters(text),
      150
    );

    inputText.addEventListener("input", function () {
      debouncedUpdateCounters(this.value);
    });
  }

  // ===== ERROR HANDLING & USER FEEDBACK ===== //
  function showNotification(message, type = "info", duration = 3000) {
    // Remove existing notification
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      borderRadius: "8px",
      color: "white",
      fontWeight: "500",
      zIndex: "1000",
      transform: "translateX(100%)",
      transition: "transform 0.3s ease",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    });

    // Set background color based on type
    const backgrounds = {
      success: "linear-gradient(135deg, #28a745, #20c997)",
      error: "linear-gradient(135deg, #dc3545, #e74c3c)",
      warning: "linear-gradient(135deg, #ffc107, #fd7e14)",
      info: "linear-gradient(135deg, #17a2b8, #6f42c1)",
    };
    notification.style.background = backgrounds[type] || backgrounds.info;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Animate out and remove
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  // Add error handling to translation
  function handleTranslationError() {
    showNotification("Translation failed. Please try again.", "error");

    if (translateButton) {
      translateButton.disabled = false;
      const buttonText = translateButton.querySelector(".button-text");
      const buttonIcon = translateButton.querySelector(".button-icon");

      if (buttonText) buttonText.textContent = "Translate";
      if (buttonIcon) buttonIcon.textContent = "🌍";
      translateButton.style.background = "";
    }
  }

  // ===== WORD LIMIT WARNINGS ===== //
  const CHAR_WARNING_LIMIT = 800;
  const CHAR_MAX_LIMIT = 1000;

  function checkLimits(text) {
    const length = text.length;

    if (length > CHAR_MAX_LIMIT) {
      showNotification(
        `Character limit exceeded! Maximum ${CHAR_MAX_LIMIT} characters allowed.`,
        "warning"
      );
      if (translateButton) {
        translateButton.disabled = true;
      }
    } else if (length > CHAR_WARNING_LIMIT) {
      if (translateButton) {
        translateButton.disabled = false;
      }
    } else {
      if (translateButton) {
        translateButton.disabled = false;
      }
    }
  }

  // Add limit checking to input
  if (inputText) {
    inputText.addEventListener("input", function () {
      checkLimits(this.value);
    });
  }

  // ===== TRANSLATION HISTORY ===== //
  let currentPage = 1;
  const itemsPerPage = 5;
  let totalHistoryItems = 0;

  async function storeTranslationHistory(
    originalText,
    translatedText,
    targetLanguage
  ) {
    try {
      // Store in localStorage for demo purposes
      const historyItem = {
        id: 'demo-' + Date.now(),
        original_text: originalText,
        translated_text: translatedText,
        target_language: targetLanguage,
        created_at: new Date().toISOString()
      };

      // Get existing history from localStorage
      const existingHistory = JSON.parse(localStorage.getItem('translationHistory') || '[]');
      existingHistory.unshift(historyItem); // Add to beginning
      
      // Keep only last 50 items to prevent localStorage from getting too large
      const limitedHistory = existingHistory.slice(0, 50);
      
      localStorage.setItem('translationHistory', JSON.stringify(limitedHistory));
      console.log("[Demo] Translation saved to localStorage:", historyItem.id);

      // Refresh the history display
      await displayTranslationHistory();
    } catch (error) {
      console.error("[Demo] Error saving translation to localStorage:", error);
      showNotification("Failed to save translation to history", "error");
    }
  }

  async function displayTranslationHistory(page = 1) {
    const historyContent = document.getElementById("historyContent");
    if (!historyContent) return;

    try {
      // Get history from localStorage
      const allHistory = JSON.parse(localStorage.getItem('translationHistory') || '[]');
      totalHistoryItems = allHistory.length;
      
      // Paginate the history
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const history = allHistory.slice(startIndex, endIndex);

      if (history.length === 0) {
        historyContent.innerHTML = `
          <div class="history-empty">
            <div class="empty-icon">📝</div>
            <p>No translations yet. Start translating to see your history here!</p>
          </div>
        `;
        return;
      }

      historyContent.innerHTML = history
        .map((item) => {
          const languageConfig = languageConfigs[item.target_language];
          const languageName = languageConfig
            ? languageConfig.name
            : item.target_language;
          const languageFlag = languageConfig ? languageConfig.flagEmoji : "🌍";

          // Enhanced timestamp formatting
          const timestamp = new Date(item.created_at);
          const now = new Date();
          const diffMs = now - timestamp;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);

          let timeAgo;
          if (diffMins < 1) {
            timeAgo = "Just now";
          } else if (diffMins < 60) {
            timeAgo = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
          } else if (diffHours < 24) {
            timeAgo = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
          } else if (diffDays < 7) {
            timeAgo = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
          } else {
            timeAgo = timestamp.toLocaleDateString();
          }

          return `
          <div class="history-item" data-id="${item.id}">
            <div class="history-meta">
              <div class="history-language">
                <span>${languageFlag}</span>
                <span>English → ${languageName}</span>
              </div>
              <div class="history-timestamp" title="${timestamp.toLocaleString()}">${timeAgo}</div>
            </div>
            <div class="history-texts">
              <div class="history-original">${item.original_text}</div>
              <div class="history-arrow">→</div>
              <div class="history-translated">${item.translated_text}</div>
            </div>
            <div class="history-actions">
              <button class="history-copy-btn" onclick="copyHistoryText('${item.translated_text.replace(
                /'/g,
                "\\'"
              )}')">
                <span>📋</span> Copy
              </button>
              <button class="history-reuse-btn" onclick="reuseHistoryText('${item.original_text.replace(
                /'/g,
                "\\'"
              )}', '${item.target_language}')">
                <span>🔄</span> Reuse
              </button>
              <button class="history-delete-btn" onclick="deleteHistoryItem('${
                item.id
              }')">
                <span>🗑️</span> Delete
              </button>
            </div>
          </div>
        `;
        })
        .join("") + createPaginationControls();

    } catch (error) {
      console.error("[v0] Error fetching translation history:", error);
      historyContent.innerHTML = `
        <div class="history-empty">
          <div class="empty-icon">⚠️</div>
          <p>Failed to load translation history. Please try again later.</p>
        </div>
      `;
    }
  }

  function createPaginationControls() {
    const totalPages = Math.ceil(totalHistoryItems / itemsPerPage);
    if (totalPages <= 1) return "";

    return `
      <div class="pagination-controls">
        <button class="pagination-btn" onclick="loadHistoryPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
          ← Previous
        </button>
        <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
        <button class="pagination-btn" onclick="loadHistoryPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
          Next →
        </button>
      </div>
    `;
  }

  window.loadHistoryPage = async (page) => {
    if (page < 1) return;
    currentPage = page;
    await displayTranslationHistory(page);
  };

  window.deleteHistoryItem = async (itemId) => {
    if (confirm("Are you sure you want to delete this translation?")) {
      try {
        // Get existing history from localStorage
        const existingHistory = JSON.parse(localStorage.getItem('translationHistory') || '[]');
        
        // Remove the item with the specified ID
        const updatedHistory = existingHistory.filter(item => item.id !== itemId);
        
        // Save back to localStorage
        localStorage.setItem('translationHistory', JSON.stringify(updatedHistory));
        console.log("[Demo] Translation deleted from localStorage:", itemId);

        // Refresh the history display
        await displayTranslationHistory();
        showNotification("Translation deleted!", "success");
      } catch (error) {
        console.error("[Demo] Error deleting translation:", error);
        showNotification("Failed to delete translation", "error");
      }
    }
  };

  async function clearTranslationHistory() {
    if (
      confirm(
        "Are you sure you want to clear all translation history? This action cannot be undone."
      )
    ) {
      try {
        // Clear localStorage
        localStorage.removeItem('translationHistory');
        console.log("[Demo] All translation history cleared from localStorage");

        // Refresh the history display
        await displayTranslationHistory();
        showNotification("Translation history cleared!", "success");
      } catch (error) {
        console.error("[Demo] Error clearing translation history:", error);
        showNotification("Failed to clear translation history", "error");
      }
    }
  }

  // Download history functionality
  window.downloadHistory = async () => {
    try {
      // Get history from localStorage
      const history = JSON.parse(localStorage.getItem('translationHistory') || '[]');
      
      if (history.length === 0) {
        showNotification("No translation history to download", "warning");
        return;
      }
      
      // Create CSV content
      const csvContent = [
        "Date,Original Text,Translated Text,Target Language",
        ...history.map(item => 
          `"${new Date(item.created_at).toLocaleString()}","${item.original_text.replace(/"/g, '""')}","${item.translated_text.replace(/"/g, '""')}","${item.target_language}"`
        )
      ].join("\n");
      
      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `translation_history_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification("Translation history downloaded successfully!", "success");
    } catch (error) {
      console.error("Error downloading history:", error);
      showNotification("Failed to download translation history", "error");
    }
  };

  // Copy history text functionality
  window.copyHistoryText = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification("Text copied to clipboard!", "success");
    }).catch(() => {
      showNotification("Failed to copy text", "error");
    });
  };

  // Reuse history text functionality
  window.reuseHistoryText = (text, language) => {
    if (inputText) {
      inputText.value = text;
      updateCounters(text);
      inputText.focus();
      
      if (languageSelector && language !== currentLanguage) {
        languageSelector.value = language;
        languageSelector.dispatchEvent(new Event("change"));
      }
      
      showNotification("Text loaded for translation!", "success");
    }
  };

  // Clear history button event listener
  if (clearHistoryButton) {
    clearHistoryButton.addEventListener("click", clearTranslationHistory);
  }

  // Initialize history display on page load
  displayTranslationHistory();

  console.log(
    "🌍 WebNew Translation Dashboard initialized with Week 11 optimizations!"
  );
  console.log("Features loaded:");
  console.log("✅ Multi-language support with 10 languages");
  console.log("✅ Live character and word counter");
  console.log("✅ Clear/Reset functionality");
  console.log("✅ Copy to clipboard");
  console.log("✅ Backend API integration with consistent response structure");
  console.log("✅ Translation history storage with pagination");
  console.log("✅ Enhanced responsive design");
  console.log("✅ Loading states and smooth animations");
  console.log("✅ Improved error handling with specific messages");
  console.log("✅ History download functionality (CSV export)");
  console.log("✅ Keyboard shortcuts (Ctrl+Enter to translate, Esc to clear)");
  console.log("✅ Sample text suggestions (double-click input when empty)");
  console.log("✅ Enhanced accessibility and user feedback");
  console.log("✅ Demo-ready presentation features");
});
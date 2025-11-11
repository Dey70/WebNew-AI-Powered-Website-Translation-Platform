/*! WebNew Instant Translate (client) v0.1.0 */
;(function () {
  const DEFAULT_LANG = 'french'
  const SUPPORTED_INTERNAL = [
    'french',
    'spanish',
    'german',
    'italian',
    'portuguese',
    'dutch',
    'russian',
    'chinese',
    'japanese',
    'korean',
  ]

  const STATE = {
    initialized: false,
    baseUrl: '',
    targetLanguage: null,
    cacheKey: 'webnew_cache_v1',
    cache: {},
    nodesMeta: new WeakMap(), // node -> { originalText, appliedText }
    observer: null,
    translating: false,
  }

  function getCurrentScript() {
    // Prefer currentScript when available, fallback to last <script> tag
    return document.currentScript || (function () {
      const scripts = document.getElementsByTagName('script')
      return scripts[scripts.length - 1]
    })()
  }

  function readOptions() {
    const script = getCurrentScript()
    const attr = (name, fallback = null) => (script && script.getAttribute(name)) || fallback
    const baseUrl = attr('data-base-url') || window.__WEBNEW_BASE_URL__ || window.location.origin
    let targetLanguage = attr('data-default-lang') || window.__WEBNEW_DEFAULT_LANG__ || null
    if (targetLanguage) {
      targetLanguage = String(targetLanguage).toLowerCase()
    }
    return { baseUrl, targetLanguage }
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(STATE.cacheKey)
      STATE.cache = raw ? JSON.parse(raw) : {}
    } catch {
      STATE.cache = {}
    }
  }

  function saveCacheSoon() {
    // Debounced-ish write
    if (STATE._saveTimer) window.clearTimeout(STATE._saveTimer)
    STATE._saveTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(STATE.cacheKey, JSON.stringify(STATE.cache))
      } catch {}
    }, 300)
  }

  function cacheKeyFor(text, lang) {
    // Simple key: lang::text (avoid hashing to keep size reasonable for short strings)
    return `${lang}::${text}`
  }

  function isVisibleNode(node) {
    if (!node || !node.parentElement) return false
    const style = window.getComputedStyle(node.parentElement)
    return style && style.display !== 'none' && style.visibility !== 'hidden'
  }

  function isTranslatableText(text) {
    if (!text) return false
    const trimmed = text.trim()
    if (!trimmed) return false
    // Skip pure punctuation/whitespace or super short fragments
    if (/^[\s\p{P}\p{S}]+$/u.test(trimmed)) return false
    if (trimmed.length < 2) return false
    return true
  }

  function walkTextNodes(root, onTextNode) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        // ignore script/style and elements marked to skip
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        if (parent.closest('[data-webnew-skip]')) return NodeFilter.FILTER_REJECT
        if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.tagName === 'NOSCRIPT') {
          return NodeFilter.FILTER_REJECT
        }
        if (!isVisibleNode(node)) return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      }
    })
    let current
    while ((current = walker.nextNode())) {
      onTextNode(current)
    }
  }

  async function translateText(text, targetLanguage) {
    const key = cacheKeyFor(text, targetLanguage)
    if (STATE.cache[key]) return STATE.cache[key]
    const endpoint = STATE.baseUrl.replace(/\/$/, '') + '/api/translate'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage })
    }).catch(() => null)
    if (!res || !res.ok) return null
    const data = await res.json().catch(() => null)
    const translated = data && data.data && data.data.translatedText
    if (translated) {
      STATE.cache[key] = translated
      saveCacheSoon()
      return translated
    }
    return null
  }

  async function translateMany(uniqueStrings, targetLanguage) {
    // Sequential with micro-batching could be added; keep simple and robust
    const results = {}
    for (const s of uniqueStrings) {
      const t = await translateText(s, targetLanguage)
      if (t) results[s] = t
    }
    return results
  }

  function collectTranslatableTextNodes(root) {
    const nodes = []
    walkTextNodes(root, (n) => {
      const value = n.nodeValue || ''
      if (!isTranslatableText(value)) return
      nodes.push(n)
      if (!STATE.nodesMeta.has(n)) {
        STATE.nodesMeta.set(n, { originalText: value, appliedText: null })
      }
    })
    return nodes
  }

  async function applyLanguage(targetLanguage) {
    if (!targetLanguage || SUPPORTED_INTERNAL.indexOf(targetLanguage) === -1) return
    if (STATE.translating) return
    STATE.translating = true
    try {
      const nodes = collectTranslatableTextNodes(document.body)
      const originals = nodes.map((n) => (STATE.nodesMeta.get(n) || {}).originalText || n.nodeValue || '')
      const unique = Array.from(new Set(originals.filter(Boolean)))

      const map = await translateMany(unique, targetLanguage)

      nodes.forEach((n, idx) => {
        const meta = STATE.nodesMeta.get(n) || {}
        const original = meta.originalText || originals[idx]
        const translated = map[original]
        if (translated && n.nodeValue !== translated) {
          n.nodeValue = translated
          STATE.nodesMeta.set(n, { originalText: original, appliedText: translated })
        }
      })
    } finally {
      STATE.translating = false
    }
  }

  function restoreOriginals() {
    walkTextNodes(document.body, (n) => {
      const meta = STATE.nodesMeta.get(n)
      if (meta && typeof meta.originalText === 'string' && n.nodeValue !== meta.originalText) {
        n.nodeValue = meta.originalText
        STATE.nodesMeta.set(n, { originalText: meta.originalText, appliedText: null })
      }
    })
  }

  function persistLanguage(lang) {
    try {
      localStorage.setItem('webnew_lang', lang || '')
      document.cookie = `webnew_lang=${encodeURIComponent(lang || '')};path=/;max-age=31536000`
    } catch {}
  }

  function getPersistedLanguage() {
    try {
      const ls = localStorage.getItem('webnew_lang')
      if (ls) return ls
    } catch {}
    const m = document.cookie.match(/(?:^|;\s*)webnew_lang=([^;]+)/)
    return m ? decodeURIComponent(m[1]) : null
  }

  function detectBrowserLanguage() {
    const nav = navigator.language || (navigator.languages && navigator.languages[0]) || ''
    const iso = String(nav).slice(0, 2).toLowerCase()
    // Map ISO to our internal supported languages
    const isoToInternal = {
      fr: 'french',
      es: 'spanish',
      de: 'german',
      it: 'italian',
      pt: 'portuguese',
      nl: 'dutch',
      ru: 'russian',
      zh: 'chinese',
      ja: 'japanese',
      ko: 'korean',
    }
    return isoToInternal[iso] || null
  }

  function createSwitcher() {
    const root = document.createElement('div')
    root.setAttribute('data-webnew-switcher', 'true')
    root.style.position = 'fixed'
    root.style.bottom = '16px'
    root.style.right = '16px'
    root.style.zIndex = '2147483647'
    root.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'

    const btn = document.createElement('button')
    btn.textContent = '🌍 Language'
    btn.style.padding = '8px 12px'
    btn.style.borderRadius = '8px'
    btn.style.border = '1px solid rgba(0,0,0,0.15)'
    btn.style.background = '#fff'
    btn.style.cursor = 'pointer'
    btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
    btn.style.fontSize = '14px'

    const panel = document.createElement('div')
    panel.style.position = 'absolute'
    panel.style.bottom = '42px'
    panel.style.right = '0'
    panel.style.border = '1px solid rgba(0,0,0,0.15)'
    panel.style.background = '#fff'
    panel.style.borderRadius = '8px'
    panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
    panel.style.padding = '6px'
    panel.style.display = 'none'

    const langs = [
      ['english', 'English'],
      ['french', 'Français'],
      ['spanish', 'Español'],
      ['german', 'Deutsch'],
      ['italian', 'Italiano'],
      ['portuguese', 'Português'],
      ['dutch', 'Nederlands'],
      ['russian', 'Русский'],
      ['chinese', '中文'],
      ['japanese', '日本語'],
      ['korean', '한국어'],
    ]

    langs.forEach(([val, label]) => {
      const item = document.createElement('button')
      item.textContent = label
      item.style.display = 'block'
      item.style.width = '100%'
      item.style.textAlign = 'left'
      item.style.padding = '8px 10px'
      item.style.border = '0'
      item.style.background = 'transparent'
      item.style.cursor = 'pointer'
      item.style.fontSize = '14px'
      item.onmouseenter = () => { item.style.background = '#f5f5f5' }
      item.onmouseleave = () => { item.style.background = 'transparent' }
      item.addEventListener('click', async () => {
        panel.style.display = 'none'
        if (val === 'english') {
          STATE.targetLanguage = null
          persistLanguage('')
          restoreOriginals()
          return
        }
        STATE.targetLanguage = val
        persistLanguage(val)
        await applyLanguage(val)
      })
      panel.appendChild(item)
    })

    btn.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none'
    })

    root.appendChild(btn)
    root.appendChild(panel)
    document.body.appendChild(root)
  }

  function ensureObserver() {
    if (STATE.observer) return
    STATE.observer = new MutationObserver(async (mutations) => {
      if (!STATE.targetLanguage) return
      let needsTranslate = false
      for (const m of mutations) {
        if (m.type === 'childList' && (m.addedNodes && m.addedNodes.length)) {
          needsTranslate = true
          break
        }
        if (m.type === 'characterData') {
          needsTranslate = true
          break
        }
      }
      if (needsTranslate) {
        // Small delay to let batches settle
        window.clearTimeout(STATE._obsTimer)
        STATE._obsTimer = window.setTimeout(() => {
          applyLanguage(STATE.targetLanguage)
        }, 150)
      }
    })
    STATE.observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
    })
  }

  async function init() {
    if (STATE.initialized) return
    STATE.initialized = true
    const opts = readOptions()
    STATE.baseUrl = opts.baseUrl
    loadCache()
    createSwitcher()
    ensureObserver()

    // Decide initial language: persisted -> data-default-lang -> browser detection
    let startLang = getPersistedLanguage() || opts.targetLanguage || detectBrowserLanguage()
    if (startLang && SUPPORTED_INTERNAL.indexOf(startLang) !== -1) {
      STATE.targetLanguage = startLang
      await applyLanguage(startLang)
    }
  }

  // Expose minimal API
  window.WebNewTranslate = {
    init,
    setLanguage: async function (lang) {
      if (!lang || String(lang).toLowerCase() === 'english') {
        STATE.targetLanguage = null
        persistLanguage('')
        restoreOriginals()
        return
      }
      const lower = String(lang).toLowerCase()
      if (SUPPORTED_INTERNAL.indexOf(lower) === -1) return
      STATE.targetLanguage = lower
      persistLanguage(lower)
      await applyLanguage(lower)
    },
    getLanguage: function () {
      return STATE.targetLanguage || 'english'
    },
    clearCache: function () {
      STATE.cache = {}
      saveCacheSoon()
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()



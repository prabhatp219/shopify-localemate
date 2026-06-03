/**
 * LocaleMate Language Switcher
 * Handles open/close, keyboard navigation, position,
 * and locale switching for the floating widget.
 */
(function () {
  'use strict';

  const widget   = document.getElementById('localemate-switcher');
  const trigger  = document.getElementById('localemate-trigger');
  const dropdown = document.getElementById('localemate-dropdown');

  if (!widget || !trigger || !dropdown) return;

  // ─── Read settings injected by Liquid via data attributes ───
  // These are written by the Liquid block from schema settings.
  // Fallback to sensible defaults so the widget works even without them.
  const settings = {
    position    : widget.dataset.position    || 'bottom-right',
    buttonBg    : widget.dataset.buttonBg    || '#1a1a2e',
    buttonText  : widget.dataset.buttonText  || '#ffffff',
    accentColor : widget.dataset.accentColor || '#6366f1',
    borderRadius: widget.dataset.borderRadius || '50',
  };

  // ─── Apply CSS custom properties from merchant settings ─────
  const root = widget.style;
  root.setProperty('--lm-btn-bg',      settings.buttonBg);
  root.setProperty('--lm-btn-text',    settings.buttonText);
  root.setProperty('--lm-accent',      settings.accentColor);
  root.setProperty('--lm-radius',      settings.borderRadius + 'px');

  // ─── Apply position class ────────────────────────────────────
  widget.classList.add('localemate-' + settings.position);

  // ─── Toggle dropdown open / close ───────────────────────────
  function openDropdown() {
    dropdown.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    widget.classList.add('localemate-open');
    // focus first item
    const firstLink = dropdown.querySelector('.localemate-link');
    if (firstLink) firstLink.focus();
  }

  function closeDropdown() {
    dropdown.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    widget.classList.remove('localemate-open');
  }

  function toggleDropdown() {
    dropdown.hidden ? openDropdown() : closeDropdown();
  }

  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleDropdown();
  });

  // ─── Close when clicking outside ────────────────────────────
  document.addEventListener('click', function (e) {
    if (!widget.contains(e.target)) {
      closeDropdown();
    }
  });

  // ─── Keyboard navigation ─────────────────────────────────────
  widget.addEventListener('keydown', function (e) {
    const items = Array.from(dropdown.querySelectorAll('.localemate-link'));
    const focused = document.activeElement;
    const idx = items.indexOf(focused);

    switch (e.key) {
      case 'Escape':
        closeDropdown();
        trigger.focus();
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (dropdown.hidden) {
          openDropdown();
        } else if (idx < items.length - 1) {
          items[idx + 1].focus();
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (idx > 0) {
          items[idx - 1].focus();
        } else {
          closeDropdown();
          trigger.focus();
        }
        break;

      case 'Tab':
        // Close if tabbing away from the widget entirely
        if (!widget.contains(document.activeElement)) {
          closeDropdown();
        }
        break;
    }
  });

  // Helper to trigger Google Translate dropdown
  function changeLanguage(langCode) {
    const selectField = document.querySelector('.goog-te-combo');
    if (selectField) {
      // Find if there is an option with value matching langCode
      const hasOption = Array.from(selectField.options).some(opt => opt.value === langCode);
      if (hasOption) {
        selectField.value = langCode;
      } else if (langCode === 'en') {
        // Fallback to empty string for original language (English)
        selectField.value = '';
      } else {
        selectField.value = langCode;
      }
      selectField.dispatchEvent(new Event('change'));
    }
  }

  // Update active states in our custom dropdown widget
  function updateWidgetActiveLocale(locale) {
    dropdown.querySelectorAll('.localemate-item').forEach(function (item) {
      const link = item.querySelector('.localemate-link');
      if (link && link.getAttribute('data-locale') === locale) {
        item.classList.add('localemate-item--active');
        item.setAttribute('aria-selected', 'true');
        link.setAttribute('aria-current', 'page');
        
        // Update trigger text
        const textNode = trigger.querySelector('.localemate-current-lang');
        const endonym = link.querySelector('.localemate-lang-name')?.textContent;
        if (textNode && endonym) {
          textNode.textContent = endonym;
        }

        // Add checkmark dynamically if not already present
        if (!link.querySelector('.localemate-check')) {
          const checkSpan = document.createElement('span');
          checkSpan.className = 'localemate-check';
          checkSpan.setAttribute('aria-hidden', 'true');
          checkSpan.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          `;
          link.appendChild(checkSpan);
        }
      } else {
        item.classList.remove('localemate-item--active');
        item.setAttribute('aria-selected', 'false');
        link.removeAttribute('aria-current');
        const checkSpan = link.querySelector('.localemate-check');
        if (checkSpan) checkSpan.remove();
      }
    });
  }

  // ─── Locale switch: save preference & translate client-side ───
  dropdown.querySelectorAll('.localemate-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const locale = link.getAttribute('data-locale');
      if (!locale) return;

      // Save preference in localStorage
      try {
        localStorage.setItem('localemate_locale', locale);
      } catch (_) {}

      // Trigger client-side Google translation on-the-fly
      changeLanguage(locale);
      updateWidgetActiveLocale(locale);
      applyAllReplacements(locale);

      closeDropdown();
    });
  });

  // ─── On page load: restore saved locale preference ───────────
  try {
    const saved = localStorage.getItem('localemate_locale');
    if (saved && saved !== 'en') {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        const selectField = document.querySelector('.goog-te-combo');
        if (selectField) {
          changeLanguage(saved);
          updateWidgetActiveLocale(saved);
          applyAllReplacements(saved);
          clearInterval(checkInterval);
        }
        attempts++;
        if (attempts > 50) clearInterval(checkInterval); // Stop after 5 seconds
      }, 100);
    }
  } catch (_) { /* ignore */ }

  // ─── Shift up if Shopify Preview Bar is present ────────────────
  function checkPreviewBar() {
    const previewBar = document.getElementById('preview-bar-iframe') || 
                       document.querySelector('.shopify-preview-bar') ||
                       document.querySelector('[id*="preview-bar"]');
    if (previewBar) {
      widget.classList.add('localemate-with-preview-bar');
    }
  }
  checkPreviewBar();
  setTimeout(checkPreviewBar, 1000);
  setTimeout(checkPreviewBar, 3000);

  // ─── AI Suggestions Integration ─────────────────────────────
  const API_BASE = 'https://shopify-localemate.onrender.com/api';
  let appliedSuggestions = [];

  const langToMarket = {
    'ja': 'japan',
    'hi': 'india',
    'de': 'germany',
    'en': 'usa',
    'es': 'spain',
    'fr': 'france'
  };

  async function loadAppliedSuggestions() {
    try {
      const res = await fetch(`${API_BASE}/suggestions/applied`);
      const data = await res.json();
      if (data.success && data.suggestions) {
        appliedSuggestions = data.suggestions;
        markElementsToLocalize();
        // Initial run
        const saved = localStorage.getItem('localemate_locale') || 'en';
        applyAllReplacements(saved);
      }
    } catch (e) {
      console.error('[LocaleMate] Failed to load applied suggestions:', e);
    }
  }

  function markElementsToLocalize() {
    if (!appliedSuggestions.length) return;

    appliedSuggestions.forEach(s => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      let node;
      while (node = walker.nextNode()) {
        const textVal = node.nodeValue.trim();
        if (s.currentHeadline && textVal.toLowerCase() === s.currentHeadline.toLowerCase()) {
          const parent = node.parentElement;
          if (parent && !parent.hasAttribute('data-lm-original')) {
            parent.setAttribute('data-lm-original', textVal);
            // Store AI translation for the market key
            const marketKey = s.market.toLowerCase();
            parent.setAttribute(`data-lm-trans-${marketKey}`, s.suggestedHeadline);
          }
         }
      }
    });
  }

  function applyAllReplacements(locale) {
    document.querySelectorAll('[data-lm-original]').forEach(el => {
      applyReplacement(el, locale);
    });
  }

  const countryToMarket = {
    'US': 'usa',
    'IN': 'india',
    'DE': 'germany',
    'JP': 'japan',
    'GB': 'uk',
    'FR': 'france',
    'BR': 'brazil',
    'SA': 'saudi arabia',
    'KR': 'south korea',
    'AU': 'australia',
    'CA': 'canada',
    'MX': 'mexico',
    'IT': 'italy',
    'ES': 'spain',
    'AE': 'uae'
  };

  function applyReplacement(el, locale) {
    let marketKey = langToMarket[locale];

    // If English is selected, check if there is an applied suggestion for the active storefront country
    const currentCountryCode = (widget.dataset.currentCountry || 'US').toUpperCase();
    const countryMarketKey = countryToMarket[currentCountryCode];
    if (locale === 'en' && countryMarketKey) {
      marketKey = countryMarketKey;
    }

    const transAttr = `data-lm-trans-${marketKey}`;
    const original = el.getAttribute('data-lm-original');

    if (marketKey && el.hasAttribute(transAttr)) {
      const translation = el.getAttribute(transAttr);
      el.classList.add('notranslate');
      if (el.textContent !== translation) {
        el.textContent = translation;
      }
    } else {
      el.classList.remove('notranslate');
      if (el.textContent !== original) {
        el.textContent = original;
      }
    }
  }

  // Setup MutationObserver to continuously watch for translations
  function initObserver() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        let target = mutation.target;
        if (target.nodeType === Node.TEXT_NODE) {
          target = target.parentElement;
        }
        if (target) {
          const marked = target.closest('[data-lm-original]');
          if (marked) {
            const saved = localStorage.getItem('localemate_locale') || 'en';
            applyReplacement(marked, saved);
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // Load suggestions and start observer on page load
  loadAppliedSuggestions();
  initObserver();

})();

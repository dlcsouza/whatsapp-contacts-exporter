// Content script for WhatsApp Contacts Exporter
// This runs in the context of WhatsApp Web

(function() {
  'use strict';

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContacts') {
      const contacts = extractAllContacts();
      sendResponse({ success: true, contacts: contacts });
    }
    return true; // Keep message channel open for async response
  });

  // Main extraction function
  function extractAllContacts() {
    const contacts = [];
    const seen = new Set();

    // Multiple selector strategies for resilience
    const chatListSelectors = [
      '[data-testid="cell-frame-container"]',
      '[data-testid="list-item-container"]',
      '[role="listitem"]',
      '._8nE1Y',
      '.zoWT4',
      '[data-testid="chat-list"] > div > div'
    ];

    let chatElements = [];
    for (const selector of chatListSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > chatElements.length) {
        chatElements = elements;
      }
    }

    console.log(`[WhatsApp Exporter] Found ${chatElements.length} chat elements`);

    chatElements.forEach((element, index) => {
      try {
        const contact = parseContactElement(element);
        if (contact && !seen.has(contact.name)) {
          seen.add(contact.name);
          contacts.push(contact);
        }
      } catch (error) {
        console.error(`[WhatsApp Exporter] Error parsing element ${index}:`, error);
      }
    });

    console.log(`[WhatsApp Exporter] Extracted ${contacts.length} unique contacts`);
    return contacts;
  }

  // Parse individual contact element
  function parseContactElement(element) {
    // Name extraction strategies
    const nameSelectors = [
      '[data-testid="cell-frame-title"] span[title]',
      'span[title]:not([title=""])',
      '[data-testid="conversation-info-header-chat-title"]',
      '._21S-L span[title]',
      '.zoWT4 span[dir="auto"]',
      'span[dir="auto"][title]'
    ];

    let name = '';
    for (const selector of nameSelectors) {
      const el = element.querySelector(selector);
      if (el) {
        name = el.getAttribute('title') || el.textContent;
        if (name && name.trim()) break;
      }
    }

    if (!name || !name.trim()) return null;
    name = name.trim();

    // Group detection
    const isGroup = detectIfGroup(element, name);

    // Phone number extraction
    const phoneNumber = extractPhoneNumber(name, element);

    // Last seen/message time
    const lastSeen = extractLastSeen(element);

    // Unread count
    const unreadCount = extractUnreadCount(element);

    return {
      name: name,
      phoneNumber: phoneNumber,
      isGroup: isGroup,
      type: isGroup ? 'Group' : 'Contact',
      lastSeen: lastSeen,
      unreadCount: unreadCount,
      exportedAt: new Date().toISOString()
    };
  }

  // Detect if element represents a group
  function detectIfGroup(element, name) {
    const groupIndicators = [
      '[data-testid="default-group"]',
      '[data-icon="default-group"]',
      '[data-testid="group"]',
      'span[data-icon="default-group"]'
    ];

    for (const selector of groupIndicators) {
      if (element.querySelector(selector)) return true;
    }

    // Check for group-like patterns in name
    if (name.includes('👥')) return true;

    // Check inner HTML for group indicators
    const html = element.innerHTML.toLowerCase();
    if (html.includes('default-group') || html.includes('participants')) {
      return true;
    }

    return false;
  }

  // Extract phone number from name or element
  function extractPhoneNumber(name, element) {
    // Try to find phone number pattern in name
    const phonePatterns = [
      /\+\d{1,4}[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,4}/,
      /\+?\d{10,15}/,
      /\d{2,4}[\s\-]\d{4,5}[\s\-]\d{4,5}/
    ];

    for (const pattern of phonePatterns) {
      const match = name.match(pattern);
      if (match) {
        return match[0].replace(/[\s\-()]/g, '');
      }
    }

    // Try to find in element's data attributes or other places
    const phoneElement = element.querySelector('[data-testid="cell-frame-secondary"]');
    if (phoneElement) {
      const text = phoneElement.textContent;
      for (const pattern of phonePatterns) {
        const match = text.match(pattern);
        if (match) {
          return match[0].replace(/[\s\-()]/g, '');
        }
      }
    }

    return '';
  }

  // Extract last seen or message time
  function extractLastSeen(element) {
    const timeSelectors = [
      '[data-testid="cell-frame-primary-detail"]',
      '[data-testid="last-msg-time"]',
      '._3Bxar',
      '.aprpv95t',
      'div[class*="time"]'
    ];

    for (const selector of timeSelectors) {
      const el = element.querySelector(selector);
      if (el && el.textContent.trim()) {
        return el.textContent.trim();
      }
    }

    return '';
  }

  // Extract unread message count
  function extractUnreadCount(element) {
    const unreadSelectors = [
      '[data-testid="icon-unread-count"]',
      '[data-testid="unread-count"]',
      'span[aria-label*="unread"]',
      '.P6z4j'
    ];

    for (const selector of unreadSelectors) {
      const el = element.querySelector(selector);
      if (el) {
        const count = parseInt(el.textContent, 10);
        return isNaN(count) ? 0 : count;
      }
    }

    return 0;
  }

  // Auto-scroll helper for loading more contacts
  window.whatsappExporterScrollToLoadMore = async function(duration = 5000) {
    const scrollContainer = document.querySelector('[data-testid="chat-list"]') || 
                           document.querySelector('#pane-side') ||
                           document.querySelector('[role="list"]');
    
    if (!scrollContainer) {
      console.error('[WhatsApp Exporter] Could not find scroll container');
      return;
    }

    const startTime = Date.now();
    const scrollStep = 300;

    return new Promise(resolve => {
      const scrollInterval = setInterval(() => {
        scrollContainer.scrollTop += scrollStep;
        
        if (Date.now() - startTime >= duration) {
          clearInterval(scrollInterval);
          resolve(extractAllContacts());
        }
      }, 100);
    });
  };

  console.log('[WhatsApp Exporter] Content script loaded');
})();

// DOM Elements
const statusDot = document.querySelector('.status-dot');
const statusText = document.getElementById('status-text');
const exportCSVBtn = document.getElementById('exportCSV');
const exportJSONBtn = document.getElementById('exportJSON');
const includeContactsCheckbox = document.getElementById('includeContacts');
const includeGroupsCheckbox = document.getElementById('includeGroups');
const resultsDiv = document.getElementById('results');
const contactCountSpan = document.getElementById('contactCount');

let extractedContacts = [];

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await checkWhatsAppTab();
});

// Check if we're on WhatsApp Web
async function checkWhatsAppTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('web.whatsapp.com')) {
      setStatus('error', 'Please open WhatsApp Web first');
      return;
    }

    // Try to extract contacts
    await extractContacts();
  } catch (error) {
    console.error('Error:', error);
    setStatus('error', 'Error connecting to WhatsApp');
  }
}

// Set status indicator
function setStatus(type, message) {
  statusDot.className = 'status-dot';
  if (type === 'connected') {
    statusDot.classList.add('connected');
  } else if (type === 'error') {
    statusDot.classList.add('error');
  }
  statusText.textContent = message;
}

// Extract contacts from WhatsApp Web
async function extractContacts() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: scrapeContacts
    });

    if (results && results[0] && results[0].result) {
      extractedContacts = results[0].result;
      updateUI();
    } else {
      setStatus('error', 'Could not extract contacts');
    }
  } catch (error) {
    console.error('Extraction error:', error);
    setStatus('error', 'Error extracting contacts');
  }
}

// Update UI with results
function updateUI() {
  const filtered = getFilteredContacts();
  
  if (filtered.length > 0) {
    setStatus('connected', `Ready to export ${filtered.length} items`);
    exportCSVBtn.disabled = false;
    exportJSONBtn.disabled = false;
    resultsDiv.style.display = 'block';
    contactCountSpan.textContent = filtered.length;
  } else {
    setStatus('error', 'No contacts found. Try scrolling your chat list.');
    exportCSVBtn.disabled = true;
    exportJSONBtn.disabled = true;
    resultsDiv.style.display = 'none';
  }
}

// Get filtered contacts based on checkboxes
function getFilteredContacts() {
  const includeContacts = includeContactsCheckbox.checked;
  const includeGroups = includeGroupsCheckbox.checked;

  return extractedContacts.filter(contact => {
    if (contact.isGroup && includeGroups) return true;
    if (!contact.isGroup && includeContacts) return true;
    return false;
  });
}

// Function injected into the page to scroll + scrape contacts
function scrapeContacts() {
  // ── Step 1: Scroll chat list to load ALL contacts ──
  // WhatsApp Web uses virtual scrolling; contacts not in viewport are not in DOM
  const scrollContainer =
    document.querySelector('[data-testid="chat-list"]') ||
    document.querySelector('#pane-side') ||
    document.querySelector('[role="list"]') ||
    document.querySelector('div[tabindex="-1"] > div > div > div');

  if (scrollContainer) {
    // Scroll in steps to trigger lazy loading
    const scrollStep = 400;
    const scrollDelay = 100;
    const maxScrolls = 80;
    let lastScrollTop = -1;
    let scrollCount = 0;

    // Scroll até o fim da lista
    for (let i = 0; i < maxScrolls; i++) {
      scrollContainer.scrollTop += scrollStep;
      scrollCount++;
      // Pequena pausa artificial via loop (executeScript é síncrono)
      const now = Date.now();
      while (Date.now() - now < scrollDelay) {
        // wait
      }
      const currentTop = scrollContainer.scrollTop;
      if (currentTop === lastScrollTop) break; // chegou ao fim
      lastScrollTop = currentTop;
    }

    // Volta ao topo
    scrollContainer.scrollTop = 0;
  }

  // ── Step 2: Collect ALL contacts from DOM ──
  const contacts = [];
  const seen = new Set();

  const chatListSelectors = [
    '[data-testid="cell-frame-container"]',
    '[data-testid="list-item-container"]',
    '._8nE1Y',
    '.zoWT4'
  ];

  let chatElements = [];
  for (const selector of chatListSelectors) {
    chatElements = document.querySelectorAll(selector);
    if (chatElements.length > 0) break;
  }

  chatElements.forEach(element => {
    try {
      const nameSelectors = [
        '[data-testid="cell-frame-title"] span[title]',
        '._21S-L span[title]',
        'span[title]',
        '.zoWT4 span[dir="auto"]'
      ];

      let name = '';
      let nameElement = null;

      for (const selector of nameSelectors) {
        nameElement = element.querySelector(selector);
        if (nameElement) {
          name = nameElement.getAttribute('title') || nameElement.textContent;
          break;
        }
      }

      if (!name || seen.has(name)) return;
      seen.add(name);

      const isGroup = 
        element.querySelector('[data-testid="default-group"]') !== null ||
        element.querySelector('[data-icon="default-group"]') !== null ||
        name.includes('👥') ||
        element.innerHTML.includes('participants');

      let phoneNumber = '';
      const phoneMatch = name.match(/\+?\d[\d\s\-()]{8,}/);
      if (phoneMatch) {
        phoneNumber = phoneMatch[0].replace(/[\s\-()]/g, '');
      }

      const timeSelectors = [
        '[data-testid="cell-frame-primary-detail"]',
        '._3Bxar',
        '.aprpv95t'
      ];

      let lastSeen = '';
      for (const selector of timeSelectors) {
        const timeElement = element.querySelector(selector);
        if (timeElement) {
          lastSeen = timeElement.textContent.trim();
          break;
        }
      }

      contacts.push({
        name: name.trim(),
        phoneNumber: phoneNumber,
        isGroup: isGroup,
        type: isGroup ? 'Group' : 'Contact',
        lastSeen: lastSeen,
        exportedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error parsing contact:', e);
    }
  });

  return contacts;
}

// Export handlers
exportCSVBtn.addEventListener('click', () => {
  const filtered = getFilteredContacts();
  if (filtered.length === 0) return;

  const csv = CSVGenerator.generate(filtered, ['name', 'phoneNumber', 'type', 'lastSeen', 'exportedAt']);
  downloadFile(csv, 'whatsapp-contacts.csv', 'text/csv');
});

exportJSONBtn.addEventListener('click', () => {
  const filtered = getFilteredContacts();
  if (filtered.length === 0) return;

  const json = JSON.stringify(filtered, null, 2);
  downloadFile(json, 'whatsapp-contacts.json', 'application/json');
});

// Checkbox change handlers
includeContactsCheckbox.addEventListener('change', updateUI);
includeGroupsCheckbox.addEventListener('change', updateUI);

// Download helper
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

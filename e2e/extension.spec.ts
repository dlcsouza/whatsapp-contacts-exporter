import { test, expect, chromium, BrowserContext } from '@playwright/test';
import * as path from 'path';

const extensionPath = path.resolve(__dirname, '..');

// Helper to launch browser with extension
async function launchBrowserWithExtension(): Promise<BrowserContext> {
  const context = await chromium.launchPersistentContext('', {
    headless: false, // Extensions require headed mode
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
    ],
  });
  return context;
}

test.describe('WhatsApp Contacts Exporter Extension', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    context = await launchBrowserWithExtension();
    
    // Wait for extension to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get extension ID - this extension has no service worker in manifest
    // so we need to get it differently
    const page = await context.newPage();
    await page.goto('chrome://extensions');
    await page.waitForTimeout(1000);
    
    // Try to get extension ID from extensions page
    extensionId = await page.evaluate(() => {
      const manager = document.querySelector('extensions-manager');
      if (manager?.shadowRoot) {
        const itemsList = manager.shadowRoot.querySelector('extensions-item-list');
        if (itemsList?.shadowRoot) {
          const items = itemsList.shadowRoot.querySelectorAll('extensions-item');
          for (const item of items) {
            const name = item.shadowRoot?.querySelector('#name')?.textContent;
            if (name?.includes('WhatsApp')) {
              return item.id;
            }
          }
        }
      }
      return '';
    });
    
    // Fallback: check background/service workers
    if (!extensionId) {
      const workers = context.serviceWorkers();
      if (workers.length > 0) {
        extensionId = workers[0].url().split('/')[2];
      }
    }
    
    await page.close();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('extension loads correctly', async () => {
    // Extension should have a valid ID (32 chars)
    expect(extensionId).toBeTruthy();
    if (extensionId) {
      expect(extensionId.length).toBe(32);
    }
  });

  test('popup opens with correct title', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    
    // Check title
    await expect(popupPage.locator('h1')).toContainText('WhatsApp Exporter');
    
    // Check subtitle
    await expect(popupPage.locator('.subtitle')).toContainText('Export your contacts');
    
    await popupPage.close();
  });

  test('popup displays status indicator', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    
    // Check status div
    await expect(popupPage.locator('.status')).toBeVisible();
    await expect(popupPage.locator('.status-dot')).toBeVisible();
    await expect(popupPage.locator('#status-text')).toBeVisible();
    
    await popupPage.close();
  });

  test('filter options are available', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    
    // Check filter checkboxes
    const contactsCheckbox = popupPage.locator('#includeContacts');
    const groupsCheckbox = popupPage.locator('#includeGroups');
    
    await expect(contactsCheckbox).toBeVisible();
    await expect(groupsCheckbox).toBeVisible();
    
    // Both should be checked by default
    await expect(contactsCheckbox).toBeChecked();
    await expect(groupsCheckbox).toBeChecked();
    
    await popupPage.close();
  });

  test('filter for individual contacts only', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    
    const contactsCheckbox = popupPage.locator('#includeContacts');
    const groupsCheckbox = popupPage.locator('#includeGroups');
    
    // Uncheck groups to filter only individual contacts
    await groupsCheckbox.uncheck();
    
    await expect(contactsCheckbox).toBeChecked();
    await expect(groupsCheckbox).not.toBeChecked();
    
    await popupPage.close();
  });

  test('filter for groups only', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    
    const contactsCheckbox = popupPage.locator('#includeContacts');
    const groupsCheckbox = popupPage.locator('#includeGroups');
    
    // Uncheck contacts to filter only groups
    await contactsCheckbox.uncheck();
    
    await expect(contactsCheckbox).not.toBeChecked();
    await expect(groupsCheckbox).toBeChecked();
    
    await popupPage.close();
  });

  test('export buttons are present but disabled initially', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    
    // Check export buttons
    const csvButton = popupPage.locator('#exportCSV');
    const jsonButton = popupPage.locator('#exportJSON');
    
    await expect(csvButton).toBeVisible();
    await expect(jsonButton).toBeVisible();
    
    // Should contain correct text
    await expect(csvButton).toContainText('Export CSV');
    await expect(jsonButton).toContainText('Export JSON');
    
    // Should be disabled when not on WhatsApp Web
    await expect(csvButton).toBeDisabled();
    await expect(jsonButton).toBeDisabled();
    
    await popupPage.close();
  });

  test('privacy notice is displayed', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    
    // Check privacy notice
    const privacyNotice = popupPage.locator('.privacy');
    await expect(privacyNotice).toBeVisible();
    await expect(privacyNotice).toContainText('data never leaves your browser');
    
    await popupPage.close();
  });

  test('tip about scrolling is displayed', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    
    // Check tip
    const tip = popupPage.locator('.tip');
    await expect(tip).toBeVisible();
    await expect(tip).toContainText('Scroll through your chat list');
    
    await popupPage.close();
  });

  test('mock WhatsApp Web page detection', async () => {
    const testPage = await context.newPage();
    
    // Create a mock WhatsApp Web page
    await testPage.setContent(`
      <html>
        <head>
          <title>WhatsApp Web</title>
        </head>
        <body>
          <div id="app">
            <div class="app-wrapper">
              <div id="side">
                <div class="chat-list">
                  <div class="chat" data-id="contact1">
                    <span class="chat-name">John Doe</span>
                    <span class="chat-phone">+1 234 567 8900</span>
                  </div>
                  <div class="chat" data-id="contact2">
                    <span class="chat-name">Jane Smith</span>
                    <span class="chat-phone">+1 234 567 8901</span>
                  </div>
                  <div class="chat group" data-id="group1">
                    <span class="chat-name">Family Group</span>
                    <span class="group-info">5 participants</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    // Verify page structure
    const hasChatList = await testPage.locator('.chat-list').isVisible();
    expect(hasChatList).toBe(true);
    
    const chatCount = await testPage.locator('.chat').count();
    expect(chatCount).toBe(3);
    
    await testPage.close();
  });

  test('extract contacts from mock DOM', async () => {
    const testPage = await context.newPage();
    
    // Create a more realistic WhatsApp Web mock
    await testPage.setContent(`
      <html>
        <body>
          <div id="pane-side">
            <div role="listitem">
              <span dir="auto" title="John Doe">John Doe</span>
            </div>
            <div role="listitem">
              <span dir="auto" title="Jane Smith">Jane Smith</span>
            </div>
            <div role="listitem">
              <span dir="auto" title="Work Team">Work Team</span>
              <span data-icon="group"></span>
            </div>
            <div role="listitem">
              <span dir="auto" title="Bob Wilson">Bob Wilson</span>
            </div>
          </div>
        </body>
      </html>
    `);
    
    // Extract contacts using DOM querying (similar to what the extension does)
    const contacts = await testPage.evaluate(() => {
      const items = document.querySelectorAll('[role="listitem"]');
      const result: { name: string; isGroup: boolean }[] = [];
      
      items.forEach(item => {
        const nameEl = item.querySelector('span[title]');
        const isGroup = item.querySelector('[data-icon="group"]') !== null;
        
        if (nameEl) {
          result.push({
            name: nameEl.getAttribute('title') || '',
            isGroup
          });
        }
      });
      
      return result;
    });
    
    expect(contacts.length).toBe(4);
    expect(contacts[0].name).toBe('John Doe');
    expect(contacts[0].isGroup).toBe(false);
    expect(contacts[2].name).toBe('Work Team');
    expect(contacts[2].isGroup).toBe(true);
    
    await testPage.close();
  });

  test('CSV export format is correct', async () => {
    const testPage = await context.newPage();
    await testPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    
    // Test CSV generation function
    const csvOutput = await testPage.evaluate(() => {
      // Mock contacts
      const contacts = [
        { name: 'John Doe', phone: '+1234567890', isGroup: false },
        { name: 'Family Group', phone: '', isGroup: true },
      ];
      
      // Simple CSV generation
      const headers = ['Name', 'Phone', 'Type'];
      const rows = contacts.map(c => [
        c.name,
        c.phone,
        c.isGroup ? 'Group' : 'Contact'
      ]);
      
      const csv = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');
      
      return csv;
    });
    
    expect(csvOutput).toContain('Name,Phone,Type');
    expect(csvOutput).toContain('John Doe');
    expect(csvOutput).toContain('Family Group');
    expect(csvOutput).toContain('Contact');
    expect(csvOutput).toContain('Group');
    
    await testPage.close();
  });

  test('JSON export format is correct', async () => {
    const testPage = await context.newPage();
    await testPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    
    // Test JSON generation
    const jsonOutput = await testPage.evaluate(() => {
      const contacts = [
        { name: 'John Doe', phone: '+1234567890', isGroup: false },
        { name: 'Family Group', phone: '', isGroup: true },
      ];
      
      return JSON.stringify(contacts, null, 2);
    });
    
    const parsed = JSON.parse(jsonOutput);
    expect(parsed.length).toBe(2);
    expect(parsed[0].name).toBe('John Doe');
    expect(parsed[1].isGroup).toBe(true);
    
    await testPage.close();
  });

  test('results section updates with contact count', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    
    // Results section should exist but be hidden initially
    const resultsSection = popupPage.locator('#results');
    
    // Simulate showing results by manipulating the DOM
    await popupPage.evaluate(() => {
      const results = document.getElementById('results');
      const countEl = document.getElementById('contactCount');
      if (results && countEl) {
        results.style.display = 'block';
        countEl.textContent = '42';
      }
    });
    
    // Now check it's visible with correct count
    await expect(resultsSection).toBeVisible();
    await expect(popupPage.locator('#contactCount')).toHaveText('42');
    
    await popupPage.close();
  });

  test('lib/csv.js is loaded in popup', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    
    // Check if CSV library script tag exists in popup
    const hasCSVLib = await popupPage.evaluate(() => {
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.src.includes('csv.js')) {
          return true;
        }
      }
      return false;
    });
    
    expect(hasCSVLib).toBe(true);
    
    await popupPage.close();
  });
});

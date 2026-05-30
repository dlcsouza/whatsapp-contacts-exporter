# 📱 WhatsApp Contacts Exporter

A Chrome extension to export your WhatsApp Web contacts and groups to CSV or JSON format with just one click.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?logo=google-chrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Version](https://img.shields.io/badge/version-1.0.1-purple)
![License MIT](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- 📤 **One-click export** - Export all visible contacts instantly
- 📊 **Multiple formats** - Choose between CSV (Excel-compatible) or JSON
- 🎯 **Smart filtering** - Export only contacts, only groups, or both
- 🔒 **100% Private** - All processing happens locally in your browser
- 🚀 **Lightweight** - No external dependencies or background processes

## 📸 Screenshots

| Popup Interface | Export Options |
|-----------------|----------------|
| ![Popup](assets/screenshot-popup.png) | ![Options](assets/screenshot-options.png) |

> *Screenshots coming soon*

## 🔧 Installation

### From Source (Developer Mode)

1. **Download the extension**
   ```bash
   git clone https://github.com/dlcsouza/whatsapp-contacts-exporter.git
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

3. **Load the extension**
   - Click "Load unpacked"
   - Select the `whatsapp-contacts-exporter` folder

4. **Start using**
   - Open [WhatsApp Web](https://web.whatsapp.com)
   - Click the extension icon in your toolbar
   - Export your contacts!

## 📖 How to Use

1. **Open WhatsApp Web** and log in
2. **Scroll through your chat list** to load all contacts you want to export
3. **Click the extension icon** in your Chrome toolbar
4. **Select your filter options**:
   - ✅ Individual Contacts
   - ✅ Groups
5. **Choose your export format**:
   - 📄 CSV (opens in Excel/Google Sheets)
   - 📋 JSON (for developers)

## 📁 Export Formats

### CSV Output
```csv
Name,Phone Number,Type,Last Seen,Exported At
John Doe,+1234567890,Contact,Today,2024-01-15T10:30:00.000Z
Family Group,,Group,Yesterday,2024-01-15T10:30:00.000Z
```

### JSON Output
```json
[
  {
    "name": "John Doe",
    "phoneNumber": "+1234567890",
    "isGroup": false,
    "type": "Contact",
    "lastSeen": "Today",
    "exportedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

## ⚠️ Limitations

- **Only visible contacts** - The extension can only export contacts that are currently loaded in your chat list
- **Scroll required** - You need to manually scroll through your chat list to load more contacts before exporting
- **Phone numbers** - Phone numbers are only available for unsaved contacts (saved contacts show names instead)
- **WhatsApp updates** - WhatsApp may change their interface, which could temporarily break extraction

## 🔒 Privacy & Security

Your data is **100% safe**:

- ✅ All processing happens **locally in your browser**
- ✅ **No data is sent** to any external server
- ✅ **No analytics** or tracking of any kind
- ✅ **No account required**
- ✅ Works completely **offline** (after installation)

The extension only requests permission to:
- Access WhatsApp Web pages (to read your contact list)
- Execute scripts on the page (to extract contact information)

## 🛠️ Technical Details

- **Manifest Version**: V3 (latest Chrome extension standard)
- **Permissions**: `activeTab`, `scripting`
- **Host Permissions**: `https://web.whatsapp.com/*` only
- **Dependencies**: None (pure vanilla JavaScript)

## 🐛 Troubleshooting

### "No contacts found"
1. Make sure you're on `web.whatsapp.com`
2. Wait for WhatsApp to fully load (green checkmark on phone icon)
3. Scroll through your chat list to load contacts
4. Try clicking the extension icon again

### "Extension not working after WhatsApp update"
WhatsApp occasionally updates their web interface. If extraction stops working:
1. Check for extension updates
2. Report the issue on GitHub

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors and users
- Inspired by the need for simple, privacy-respecting contact export

---

<p align="center">
  Made with ❤️ for the WhatsApp community
</p>

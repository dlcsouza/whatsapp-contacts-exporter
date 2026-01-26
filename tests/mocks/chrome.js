global.chrome = {
  runtime: {
    sendMessage: jest.fn((msg, cb) => cb && cb({ success: true })),
    onMessage: { addListener: jest.fn() }
  },
  tabs: {
    query: jest.fn((opts, cb) => cb([{ id: 1, url: 'https://web.whatsapp.com' }])),
    sendMessage: jest.fn((tabId, msg, cb) => cb && cb({ contacts: [] }))
  },
  downloads: {
    download: jest.fn((opts, cb) => cb && cb(1))
  }
};

global.URL.createObjectURL = jest.fn(() => 'blob:test');
global.URL.revokeObjectURL = jest.fn();

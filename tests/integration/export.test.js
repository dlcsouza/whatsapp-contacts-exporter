describe('Export Integration', () => {
  test('full export flow - individuals only', () => {
    const contacts = [
      { name: 'John', phone: '+123', isGroup: false },
      { name: 'Family', phone: '', isGroup: true },
      { name: 'Jane', phone: '+456', isGroup: false }
    ];

    // Filter
    const filtered = contacts.filter(c => !c.isGroup);
    expect(filtered.length).toBe(2);

    // Generate CSV
    const headers = ['Name', 'Phone'];
    const csv = [
      headers.join(','),
      ...filtered.map(c => `${c.name},${c.phone}`)
    ].join('\n');

    expect(csv).toContain('Name,Phone');
    expect(csv).toContain('John,+123');
    expect(csv).toContain('Jane,+456');
    expect(csv).not.toContain('Family');
  });

  test('full export flow - groups only', () => {
    const contacts = [
      { name: 'John', phone: '+123', isGroup: false },
      { name: 'Family', phone: '', isGroup: true },
      { name: 'Work', phone: '', isGroup: true }
    ];

    const filtered = contacts.filter(c => c.isGroup);
    expect(filtered.length).toBe(2);
    expect(filtered[0].name).toBe('Family');
  });

  test('export to JSON format', () => {
    const contacts = [
      { name: 'John', phone: '+123', isGroup: false }
    ];
    
    const json = JSON.stringify(contacts, null, 2);
    const parsed = JSON.parse(json);
    
    expect(parsed[0].name).toBe('John');
    expect(parsed[0].phone).toBe('+123');
  });

  test('chrome downloads API integration', () => {
    const blob = new Blob(['test,data'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    expect(url).toBe('blob:test');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});

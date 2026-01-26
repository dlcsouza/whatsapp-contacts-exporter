describe('Contact Filter', () => {
  const contacts = [
    { name: 'John', phone: '+123', isGroup: false },
    { name: 'Family', phone: '', isGroup: true },
    { name: 'Jane', phone: '+456', isGroup: false },
    { name: 'Work Team', phone: '', isGroup: true },
    { name: 'Bob', phone: '+789', isGroup: false }
  ];

  test('should filter only individual contacts', () => {
    const individuals = contacts.filter(c => !c.isGroup);
    expect(individuals.length).toBe(3);
    expect(individuals.every(c => !c.isGroup)).toBe(true);
  });

  test('should filter only groups', () => {
    const groups = contacts.filter(c => c.isGroup);
    expect(groups.length).toBe(2);
    expect(groups.every(c => c.isGroup)).toBe(true);
  });

  test('should return all contacts when no filter', () => {
    expect(contacts.length).toBe(5);
  });

  test('should filter contacts with phone numbers', () => {
    const withPhone = contacts.filter(c => c.phone);
    expect(withPhone.length).toBe(3);
  });

  test('should search by name', () => {
    const search = 'john';
    const results = contacts.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase())
    );
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('John');
  });
});

describe('CSV Generator', () => {
  const generateCSV = (data, headers) => {
    const headerRow = headers.join(',');
    const rows = data.map(row => 
      headers.map(h => {
        const val = row[h] || '';
        // Escape quotes and wrap in quotes if contains comma
        if (val.includes(',') || val.includes('"')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    );
    return [headerRow, ...rows].join('\n');
  };

  test('should generate valid CSV header', () => {
    const csv = generateCSV([], ['Name', 'Phone', 'Type']);
    expect(csv).toBe('Name,Phone,Type');
  });

  test('should generate CSV with data rows', () => {
    const data = [
      { Name: 'John', Phone: '+1234567890', Type: 'Contact' },
      { Name: 'Jane', Phone: '+0987654321', Type: 'Contact' }
    ];
    const csv = generateCSV(data, ['Name', 'Phone', 'Type']);
    
    expect(csv).toContain('Name,Phone,Type');
    expect(csv).toContain('John,+1234567890,Contact');
    expect(csv).toContain('Jane,+0987654321,Contact');
  });

  test('should escape commas in values', () => {
    const data = [{ Name: 'Doe, John', Phone: '+123' }];
    const csv = generateCSV(data, ['Name', 'Phone']);
    
    expect(csv).toContain('"Doe, John"');
  });

  test('should escape quotes in values', () => {
    const data = [{ Name: 'John "Johnny" Doe', Phone: '+123' }];
    const csv = generateCSV(data, ['Name', 'Phone']);
    
    expect(csv).toContain('"John ""Johnny"" Doe"');
  });

  test('should handle empty values', () => {
    const data = [{ Name: 'John', Phone: '' }];
    const csv = generateCSV(data, ['Name', 'Phone']);
    
    expect(csv).toContain('John,');
  });
});

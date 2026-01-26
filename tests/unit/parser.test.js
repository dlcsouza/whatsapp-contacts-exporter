describe('Contact Parser', () => {
  const parseContact = (element) => {
    const name = element.querySelector('[data-name]')?.textContent || 
                 element.querySelector('.contact-name')?.textContent || '';
    const phone = element.querySelector('[data-phone]')?.textContent || '';
    const isGroup = element.classList.contains('group') || 
                    element.querySelector('.group-icon') !== null;
    
    return { name: name.trim(), phone: phone.trim(), isGroup };
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('should parse contact name', () => {
    document.body.innerHTML = '<div><span class="contact-name">John Doe</span></div>';
    const contact = parseContact(document.body.firstChild);
    expect(contact.name).toBe('John Doe');
  });

  test('should parse contact with data attributes', () => {
    document.body.innerHTML = '<div><span data-name>Jane Smith</span><span data-phone>+1234</span></div>';
    const contact = parseContact(document.body.firstChild);
    expect(contact.name).toBe('Jane Smith');
    expect(contact.phone).toBe('+1234');
  });

  test('should detect group chats', () => {
    document.body.innerHTML = '<div class="group"><span class="contact-name">Family Group</span></div>';
    const contact = parseContact(document.body.firstChild);
    expect(contact.isGroup).toBe(true);
  });

  test('should detect individual contacts', () => {
    document.body.innerHTML = '<div><span class="contact-name">John</span></div>';
    const contact = parseContact(document.body.firstChild);
    expect(contact.isGroup).toBe(false);
  });

  test('should trim whitespace from names', () => {
    document.body.innerHTML = '<div><span class="contact-name">  John Doe  </span></div>';
    const contact = parseContact(document.body.firstChild);
    expect(contact.name).toBe('John Doe');
  });
});

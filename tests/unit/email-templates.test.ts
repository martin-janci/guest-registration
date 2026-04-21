import { describe, it, expect } from 'vitest';
import { adminRegistrationTemplate } from '@/modules/email/templates/admin-registration';
import { guestConfirmationTemplate } from '@/modules/email/templates/guest-confirmation';
import { guestApprovedTemplate } from '@/modules/email/templates/guest-approved';

describe('email templates', () => {
  it('adminRegistrationTemplate includes the review URL and escapes HTML', () => {
    const t = adminRegistrationTemplate({
      adminName: 'Martin <owner>',
      tripTitle: 'Anna\'s stay',
      propertyName: 'Tatranská Perla',
      guestCount: 3,
      reviewUrl: 'https://example.com/admin/registrations/42',
      submittedAt: new Date('2026-05-10T14:30:00Z'),
    });
    expect(t.subject).toContain('Tatranská Perla');
    expect(t.html).toContain('https://example.com/admin/registrations/42');
    expect(t.html).toContain('Martin &lt;owner&gt;');
    expect(t.html).toContain('Anna&#39;s stay');
    expect(t.text).toContain('Guests: 3');
  });

  it('guestConfirmationTemplate greets by first name', () => {
    const t = guestConfirmationTemplate({
      guestFirstName: 'Anna',
      tripTitle: 'May stay',
      propertyName: 'Donovaly',
    });
    expect(t.subject).toContain('Donovaly');
    expect(t.text).toContain('Hi Anna,');
  });

  it('guestApprovedTemplate includes admin comment when provided', () => {
    const withNote = guestApprovedTemplate({
      guestFirstName: 'Lukas',
      tripTitle: 'stay',
      propertyName: 'P',
      adminComment: 'Parking code is 1234.',
    });
    expect(withNote.html).toContain('Parking code is 1234.');

    const withoutNote = guestApprovedTemplate({
      guestFirstName: 'Lukas',
      tripTitle: 'stay',
      propertyName: 'P',
      adminComment: null,
    });
    expect(withoutNote.html).not.toContain('Note from host');
  });
});

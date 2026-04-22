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
      locale: 'en',
    });
    expect(t.subject).toContain('Tatranská Perla');
    expect(t.html).toContain('https://example.com/admin/registrations/42');
    expect(t.html).toContain('Martin &lt;owner&gt;');
    expect(t.html).toContain('Anna&#39;s stay');
    expect(t.text).toContain('Guests: 3');
  });

  it('adminRegistrationTemplate uses Slovak when locale is sk', () => {
    const t = adminRegistrationTemplate({
      adminName: 'Martin',
      tripTitle: 'May trip',
      propertyName: 'Perla',
      guestCount: 2,
      reviewUrl: 'https://example.com/admin/registrations/1',
      submittedAt: new Date('2026-05-10T14:30:00Z'),
      locale: 'sk',
    });
    expect(t.subject).toContain('Nová registrácia');
    expect(t.html).toContain('Skontrolovať registráciu');
  });

  it('guestConfirmationTemplate greets by first name', () => {
    const t = guestConfirmationTemplate({
      guestFirstName: 'Anna',
      tripTitle: 'May stay',
      propertyName: 'Donovaly',
      locale: 'en',
    });
    expect(t.subject).toContain('Donovaly');
    expect(t.text).toContain('Hi Anna,');
  });

  it('guestConfirmationTemplate uses Slovak when locale is sk', () => {
    const t = guestConfirmationTemplate({
      guestFirstName: 'Anna',
      tripTitle: 'May stay',
      propertyName: 'Donovaly',
      locale: 'sk',
    });
    expect(t.subject).toContain('Registrácia prijatá');
    expect(t.text).toContain('Anna');
  });

  it('guestApprovedTemplate includes admin comment when provided', () => {
    const withNote = guestApprovedTemplate({
      guestFirstName: 'Lukas',
      tripTitle: 'stay',
      propertyName: 'P',
      adminComment: 'Parking code is 1234.',
      locale: 'en',
    });
    expect(withNote.html).toContain('Parking code is 1234.');

    const withoutNote = guestApprovedTemplate({
      guestFirstName: 'Lukas',
      tripTitle: 'stay',
      propertyName: 'P',
      adminComment: null,
      locale: 'en',
    });
    expect(withoutNote.html).not.toContain('Note from host');
  });

  it('guestApprovedTemplate uses Slovak when locale is sk', () => {
    const t = guestApprovedTemplate({
      guestFirstName: 'Lukas',
      tripTitle: 'stay',
      propertyName: 'P',
      adminComment: null,
      locale: 'sk',
    });
    expect(t.subject).toContain('Registrácia schválená');
    expect(t.text).toContain('Tešíme sa na vás');
  });

  it('guestApprovedTemplate uses default locale when locale is omitted', () => {
    // defaultLocale is sk
    const t = guestApprovedTemplate({
      guestFirstName: 'Lukas',
      tripTitle: 'stay',
      propertyName: 'P',
      adminComment: null,
    });
    expect(t.subject).toContain('Registrácia schválená');
  });
});

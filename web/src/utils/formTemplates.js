import { v4 as uuidv4 } from 'uuid';

const makeId = (prefix) => `${prefix}_${uuidv4().slice(0, 8)}`;

const page = (title) => ({ id: makeId('page'), title });

const field = ({
  type,
  label,
  pageId,
  required = false,
  placeholder = 'Type your answer…',
  meta = {},
}) => ({
  id: makeId('field'),
  type,
  label,
  placeholder,
  required,
  validation: {},
  meta: {
    hidden: false,
    width: 'full',
    pageId,
    ...meta,
  },
});

const withBase = ({ title, settings, theme, pages, fields, logicRules }) => ({
  id: makeId('form'),
  title,
  version: 1,
  settings: {
    mode: 'typeform',
    showProgressBar: true,
    submitLabel: 'Submit',
    thankYouMessage: 'Thank you!',
    allowAnonymousEntries: true,
    deadlineAt: null,
    timedResponseEnabled: false,
    timedResponseSeconds: 0,
    pages,
    mailingListEmails: [],
    publishEmailMessage: 'We just published a new form. Please take a look and submit a response.',
    ...(settings || {}),
  },
  theme: {
    preset: 'custom',
    primaryColor: '#4F46E5',
    fontFamily: 'Inter',
    customCSS: '',
    ...(theme || {}),
  },
  fields,
  logicRules: logicRules || [],
});

function buildRestaurantTemplate() {
  const p1 = page('Dietary Profile');
  const p2 = page('Vegetarian Menu');
  const p3 = page('Non-Veg Menu');
  const p4 = page('Reservation Details');

  const dietary = field({
    type: 'choice',
    label: 'Choose your diet preference',
    pageId: p1.id,
    required: true,
    meta: { options: ['Vegetarian', 'Vegan', 'Non-Vegetarian'] },
  });

  const vegDish = field({
    type: 'checkbox',
    label: 'Pick your vegetarian options',
    pageId: p2.id,
    required: true,
    meta: { options: ['Paneer Tikka', 'Mushroom Risotto', 'Garden Lasagna', 'Falafel Bowl'] },
  });

  const nonVegDish = field({
    type: 'checkbox',
    label: 'Pick your non-veg options',
    pageId: p3.id,
    required: true,
    meta: { options: ['Lemon Herb Chicken', 'Smoked Salmon', 'Lamb Chops', 'Beef Tenderloin'] },
  });

  const guestCount = field({ type: 'number', label: 'Number of guests', pageId: p4.id, required: true, placeholder: 'e.g. 4' });
  const datePick = field({ type: 'date', label: 'Preferred date', pageId: p4.id, required: true, placeholder: 'Select date' });

  return withBase({
    title: 'Signature Dining Reservation',
    pages: [p1, p2, p3, p4],
    fields: [dietary, vegDish, nonVegDish, guestCount, datePick],
    logicRules: [
      {
        id: makeId('rule'),
        conditionOperator: 'AND',
        conditions: [{ fieldId: dietary.id, operator: 'equals', value: 'Vegetarian' }],
        action: { type: 'jump_to_page', sourcePageId: p1.id, targetPageId: p2.id },
      },
      {
        id: makeId('rule'),
        conditionOperator: 'AND',
        conditions: [{ fieldId: dietary.id, operator: 'equals', value: 'Vegan' }],
        action: { type: 'jump_to_page', sourcePageId: p1.id, targetPageId: p2.id },
      },
      {
        id: makeId('rule'),
        conditionOperator: 'AND',
        conditions: [{ fieldId: dietary.id, operator: 'equals', value: 'Non-Vegetarian' }],
        action: { type: 'jump_to_page', sourcePageId: p1.id, targetPageId: p3.id },
      },
      {
        id: makeId('rule'),
        conditionOperator: 'OR',
        conditions: [
          { fieldId: vegDish.id, operator: 'contains', value: 'Paneer Tikka' },
          { fieldId: vegDish.id, operator: 'contains', value: 'Mushroom Risotto' },
        ],
        action: { type: 'jump_to_page', sourcePageId: p2.id, targetPageId: p4.id },
      },
      {
        id: makeId('rule'),
        conditionOperator: 'OR',
        conditions: [
          { fieldId: nonVegDish.id, operator: 'contains', value: 'Lemon Herb Chicken' },
          { fieldId: nonVegDish.id, operator: 'contains', value: 'Smoked Salmon' },
        ],
        action: { type: 'jump_to_page', sourcePageId: p3.id, targetPageId: p4.id },
      },
    ],
    theme: {
      customCSS: `
:root {
  --color-bg-base: #FBF8F3;
  --color-bg-surface: #FFF9F1;
  --color-bg-hover: #F4EBE0;
  --color-border-warm: #E6D7C8;
  --color-text-primary: #231B14;
  --color-text-secondary: #6A5647;
  --color-text-tertiary: #9A8676;
  --color-accent: #A35B33;
  --color-accent-soft: #F5E5D7;
}
.display-font { letter-spacing: -0.03em; }
.btn-primary { box-shadow: 0 16px 30px rgba(163,91,51,.18); }
.card, .input-base { border-radius: 16px; }
.card { background-image: linear-gradient(180deg, rgba(255,255,255,.9), rgba(251,248,243,.98)); }
.min-h-screen { background-image: radial-gradient(circle at 85% 15%, rgba(163,91,51,.10) 0, transparent 38%), radial-gradient(circle at 0% 100%, rgba(74,124,89,.10) 0, transparent 28%); }
.template-orb { position: fixed; inset: auto -120px -120px auto; width: 360px; height: 360px; border-radius: 999px; background: radial-gradient(circle, rgba(163,91,51,.12), rgba(163,91,51,0) 70%); pointer-events: none; }
`,
    },
  });
}

function buildHiringTemplate() {
  const p1 = page('Candidate Basics');
  const p2 = page('Engineer Track');
  const p3 = page('Design Track');
  const p4 = page('Portfolio & Resume');

  const role = field({
    type: 'choice',
    label: 'Which role are you applying for?',
    pageId: p1.id,
    required: true,
    meta: { options: ['Frontend Engineer', 'Backend Engineer', 'Product Designer'] },
  });
  const exp = field({ type: 'number', label: 'Years of experience', pageId: p1.id, required: true, placeholder: 'e.g. 3' });

  const stack = field({
    type: 'checkbox',
    label: 'Tech stack strengths',
    pageId: p2.id,
    meta: { options: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Python'] },
  });

  const designType = field({
    type: 'choice',
    label: 'Primary design specialty',
    pageId: p3.id,
    meta: { options: ['UX Research', 'Interaction Design', 'Visual Design', 'Design Systems'] },
  });

  const resume = field({ type: 'upload', label: 'Upload your resume', pageId: p4.id, required: true, meta: { acceptedTypes: '.pdf,.doc,.docx' } });
  const portfolio = field({ type: 'text', label: 'Portfolio / GitHub URL', pageId: p4.id, placeholder: 'https://...', required: true });

  return withBase({
    title: 'Elite Team Application',
    pages: [p1, p2, p3, p4],
    fields: [role, exp, stack, designType, resume, portfolio],
    logicRules: [
      {
        id: makeId('rule'),
        conditionOperator: 'OR',
        conditions: [
          { fieldId: role.id, operator: 'equals', value: 'Frontend Engineer' },
          { fieldId: role.id, operator: 'equals', value: 'Backend Engineer' },
        ],
        action: { type: 'jump_to_page', sourcePageId: p1.id, targetPageId: p2.id },
      },
      {
        id: makeId('rule'),
        conditionOperator: 'AND',
        conditions: [{ fieldId: role.id, operator: 'equals', value: 'Product Designer' }],
        action: { type: 'jump_to_page', sourcePageId: p1.id, targetPageId: p3.id },
      },
      {
        id: makeId('rule'),
        conditionOperator: 'AND',
        conditions: [{ fieldId: stack.id, operator: 'contains', value: 'React' }],
        action: { type: 'jump_to_page', sourcePageId: p2.id, targetPageId: p4.id },
      },
      {
        id: makeId('rule'),
        conditionOperator: 'AND',
        conditions: [{ fieldId: designType.id, operator: 'contains', value: 'Design Systems' }],
        action: { type: 'jump_to_page', sourcePageId: p3.id, targetPageId: p4.id },
      },
    ],
    settings: {
      submitLabel: 'Submit Application',
      thankYouMessage: 'Application received — our team will reach out shortly.',
      allowAnonymousEntries: false,
    },
    theme: {
      customCSS: `
:root {
  --color-bg-base: #F4F7FF;
  --color-bg-surface: #EDF2FF;
  --color-bg-hover: #E1E8FF;
  --color-border-warm: #B9C7F7;
  --color-text-primary: #101C40;
  --color-text-secondary: #40528E;
  --color-text-tertiary: #7586BD;
  --color-accent: #4F6DFF;
  --color-accent-soft: #DDE4FF;
}
.card, .input-base { border-color: #B9C7F7; }
.btn-primary { background: linear-gradient(135deg,#4F6DFF,#58C5FF); color:#FFFFFF; border:none; box-shadow: 0 16px 34px rgba(79,109,255,.24); }
.min-h-screen { background-image: radial-gradient(circle at 10% 10%, rgba(79,109,255,.16) 0, transparent 38%), radial-gradient(circle at 95% 88%, rgba(88,197,255,.18) 0, transparent 36%); }
.template-orb { position: fixed; inset: auto auto -100px -90px; width: 300px; height: 300px; border-radius: 999px; background: radial-gradient(circle, rgba(79,109,255,.14), rgba(79,109,255,0) 70%); pointer-events: none; }
`,
    },
  });
}

function buildEventTemplate() {
  const p1 = page('Attendee Profile');
  const p2 = page('Workshop Track');
  const p3 = page('VIP Concierge');
  const p4 = page('Final Logistics');

  const ticket = field({
    type: 'choice',
    label: 'Choose your pass tier',
    pageId: p1.id,
    required: true,
    meta: { options: ['General', 'VIP'] },
  });
  const interests = field({
    type: 'checkbox',
    label: 'Topic interests',
    pageId: p2.id,
    meta: { options: ['AI Product', 'Growth', 'Design Ops', 'Founder Playbooks'] },
  });
  const concierge = field({ type: 'binary', label: 'Need hotel concierge assistance?', pageId: p3.id, meta: { leftLabel: 'Yes', rightLabel: 'No' } });
  const contact = field({ type: 'email', label: 'Best contact email', pageId: p4.id, required: true, placeholder: 'you@company.com' });

  return withBase({
    title: 'Summit Registration Experience',
    pages: [p1, p2, p3, p4],
    fields: [ticket, interests, concierge, contact],
    logicRules: [
      {
        id: makeId('rule'),
        conditionOperator: 'AND',
        conditions: [{ fieldId: ticket.id, operator: 'equals', value: 'General' }],
        action: { type: 'jump_to_page', sourcePageId: p1.id, targetPageId: p2.id },
      },
      {
        id: makeId('rule'),
        conditionOperator: 'AND',
        conditions: [{ fieldId: ticket.id, operator: 'equals', value: 'VIP' }],
        action: { type: 'jump_to_page', sourcePageId: p1.id, targetPageId: p3.id },
      },
      {
        id: makeId('rule'),
        conditionOperator: 'OR',
        conditions: [
          { fieldId: interests.id, operator: 'contains', value: 'AI Product' },
          { fieldId: interests.id, operator: 'contains', value: 'Founder Playbooks' },
        ],
        action: { type: 'jump_to_page', sourcePageId: p2.id, targetPageId: p4.id },
      },
      {
        id: makeId('rule'),
        conditionOperator: 'OR',
        conditions: [
          { fieldId: concierge.id, operator: 'equals', value: 'Yes' },
          { fieldId: concierge.id, operator: 'equals', value: 'No' },
        ],
        action: { type: 'jump_to_page', sourcePageId: p3.id, targetPageId: p4.id },
      },
    ],
    settings: {
      submitLabel: 'Complete Registration',
      thankYouMessage: 'You are officially in. See you at the summit.',
    },
    theme: {
      customCSS: `
:root {
  --color-bg-base: #F3F6FF;
  --color-bg-surface: #E9EEFF;
  --color-bg-hover: #DFE6FF;
  --color-border-warm: #CCD7FF;
  --color-text-primary: #13203E;
  --color-text-secondary: #4F5F8F;
  --color-text-tertiary: #7D8DBE;
  --color-accent: #4B6BFF;
  --color-accent-soft: #E0E7FF;
}
h1.display-font { text-shadow: 0 12px 40px rgba(75,107,255,.18); }
.btn-primary { border-radius: 999px; box-shadow: 0 12px 30px rgba(75,107,255,.25); }
.min-h-screen { background-image: radial-gradient(circle at 78% 12%, rgba(75,107,255,.14) 0, transparent 40%), radial-gradient(circle at 5% 85%, rgba(88,197,255,.14) 0, transparent 32%); }
.template-orb { position: fixed; inset: auto 20px 20px auto; width: 230px; height: 230px; border-radius: 999px; background: radial-gradient(circle, rgba(75,107,255,.15), rgba(75,107,255,0) 70%); pointer-events: none; }
`,
    },
  });
}

export const FORM_TEMPLATES = [
  {
    id: 'scratch',
    name: 'Start from scratch',
    description: 'Blank canvas for custom workflows.',
    badge: 'Custom',
    gradient: 'from-[#F6F1E7] to-[#F1E8D6]',
  },
  {
    id: 'restaurant',
    name: 'Dining Reservation',
    description: 'Luxury reservation flow with vegetarian/non-veg branching.',
    badge: 'Logic + Design',
    gradient: 'from-[#FAEDE3] to-[#F6DCC7]',
  },
  {
    id: 'hiring',
    name: 'Hiring Funnel',
    description: 'Role-based application flow with resume upload.',
    badge: 'Logic + Upload',
    gradient: 'from-[#E6EEFF] to-[#D8E4FF]',
  },
  {
    id: 'event',
    name: 'Event Registration',
    description: 'Pass-tier branching with polished event aesthetic.',
    badge: 'Logic + UX',
    gradient: 'from-[#EAF0FF] to-[#DFE8FF]',
  },
];

export function createTemplateSchema(templateId) {
  switch (templateId) {
    case 'restaurant':
      return buildRestaurantTemplate();
    case 'hiring':
      return buildHiringTemplate();
    case 'event':
      return buildEventTemplate();
    default:
      return null;
  }
}

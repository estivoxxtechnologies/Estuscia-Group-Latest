// Site configuration. Values below come from the owner's brief for estusciagroup.com.
export const SITE = {
  url: 'https://www.estusciagroup.com/',
  logo: '/images/logo.png',   // put your logo file at public/images/logo.png (or change this path, e.g. logo.svg / logo.webp)
  email: 'support@estuscia.com',
  phones: [{ label: '(+91) 9633329669', tel: '+919633329669' }, { label: '9633359669', tel: '+919633359669' }],
  office: ['Estuscia Group', 'Hilite Business Park, Calicut'],
  hours: '',            // TODO: paste the business-hours text exactly as on estusciagroup.com
  formEndpoint: '',     // TODO: POST endpoint (backend / Formspree-style). Empty = form validates but is NOT sent.
  social: [] as { label: string; href: string }[],
  legal: [] as { label: string; href: string }[],
};

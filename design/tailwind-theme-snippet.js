// Tailwind theme snippet (paste into tailwind.config.js `theme.extend`)
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#0B0B0B',
        beige: '#E8DCCB',
        gold: '#D4AF37',
        neutral: '#F5F5F5',
        muted: '#6B6B6B',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"Work Sans"', 'Inter', 'system-ui']
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '40px'
      }
    }
  }
}

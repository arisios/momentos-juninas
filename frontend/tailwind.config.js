/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          magenta:      '#C21874',
          purple:       '#6F2DA8',
          'purple-dark':'#4B1E6D',
          teal:         '#007C91',
          'teal-dark':  '#1F5F6B',
          orange:       '#D96C2F',
          beige:        '#E9D1B5',
          brown:        '#3A1F14',
          cream:        '#F5E7D3',
          gold:         '#C79A3B',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #C21874 0%, #6F2DA8 100%)',
        'brand-bg':       'linear-gradient(160deg, #F5E7D3 0%, #E9D1B5 100%)',
        'teal-gradient':  'linear-gradient(135deg, #007C91 0%, #1F5F6B 100%)',
      },
      animation: {
        'float':       'float 3s ease-in-out infinite',
        'slide-up':    'slideUp 0.3s ease-out',
        'fade-in':     'fadeIn 0.25s ease-out',
        'pop':         'pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        pop:     { '0%': { transform: 'scale(0.8)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
      },
    },
  },
  plugins: [],
}

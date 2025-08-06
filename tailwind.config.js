/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#00A651', // Surya Abadi brand green
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                'brand-green': '#00A651',
                'brand-green-light': '#00C85F',
                'brand-green-dark': '#008542'
            }
        },
    },
    plugins: [],
}

project-root/
│── public/ # Static assets (favicon, images, robots.txt, etc.)
│── src/
│ ├── assets/ # Images, fonts, global styles
│ ├── components/ # Reusable UI components
│ │ ├── common/ # Shared components (Button, Modal, Loader, etc.)
│ │ └── layout/ # Layout components (Navbar, Sidebar, Footer)
│ ├── pages/ # Page-level components (Home, About, Dashboard, etc.)
│ ├── hooks/ # Custom React hooks (useAuth, useFetch, etc.)
│ ├── context/ # React context providers (AuthContext, ThemeContext)
│ ├── services/ # API calls, external services
│ │ └── api.ts # Example: Axios/Fetch wrapper
│ ├── types/ # TypeScript types/interfaces
│ ├── utils/ # Helper functions (formatDate, validators, constants)
│ ├── styles/ # Global CSS/SCSS or Tailwind config
│ ├── App.tsx # Root component
│ ├── main.tsx # Entry point (renders <App />)
│ └── vite-env.d.ts # Vite types
│
├── .gitignore
├── eslint.config.js
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md

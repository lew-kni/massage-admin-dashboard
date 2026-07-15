# Getting Started - Admin Dashboard

Quick setup guide to get the admin dashboard running locally.

## Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:3000`
- API key from backend configuration

## 5-Minute Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env
```

**File: `.env`**
```
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=Fettleworks Admin
```

### 3. Start Development Server

```bash
npm run dev
```

Opens at **`http://localhost:5173`**

### 4. Login

1. Go to http://localhost:5173/login
2. Enter your API key (from backend `.env` file)
3. Click "Login"

You're in! 🎉

## Common Tasks

### Run Type Checking

```bash
npm run type-check
```

### Build for Production

```bash
npm run build
```

Output: `dist/` directory ready for deployment

### Preview Production Build

```bash
npm run preview
```

## Backend Integration

The dashboard connects to the backend API on the configured `VITE_API_BASE_URL`.

### Check Backend is Running

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok"}
```

### Test API with Dashboard

1. Login to dashboard
2. Go to Clients page
3. You should see any existing clients from the backend

If you see errors:
- Check backend is running
- Verify API key is correct
- Check browser console (F12) for errors

## Project Structure Overview

```
src/
├── components/          # Reusable UI components
│   └── StatCard.vue    # Dashboard stat card
├── views/              # Page components (one per route)
│   ├── LoginView.vue
│   ├── DashboardView.vue
│   ├── ClientsView.vue
│   └── ...
├── stores/             # Pinia state management
│   ├── auth.ts         # Authentication
│   └── clients.ts      # Client data
├── services/           # API client
│   └── api.ts          # All API methods
├── router/             # Vue Router config
├── types/              # TypeScript types
├── style.css           # Global styles
└── main.ts             # Entry point
```

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| **Authentication** | ✅ Complete | API key login |
| **Dashboard** | ✅ Partial | Stats and recent activity |
| **Clients** | ✅ Partial | List and detail views |
| **Bookings** | ⏳ Skeleton | Calendar view needed |
| **Availability** | ⏳ Skeleton | Hours and blocking needed |
| **Emails** | ⏳ Skeleton | Composer and templates needed |

## Next: Building Features

See **README.md** for detailed feature development guide.

Quick example - adding a client create form:

1. Create `src/components/ClientForm.vue`
2. Import in `ClientsView.vue`
3. Use `clientsStore.createClient(data)`
4. Handle success/error

## Troubleshooting

### "Cannot connect to API"

- Is backend running? `npm run dev` in backend directory
- Is frontend pointing to correct URL? Check `.env`
- Any CORS errors in browser console?

### "Invalid API Key"

- Double-check key from backend `.env`
- Make sure it's not wrapped in quotes
- Try a fresh login

### "Page not loading"

- Check browser console (F12)
- Run `npm run type-check` for type errors
- Clear browser cache

### "npm install fails"

```bash
rm -rf node_modules package-lock.json
npm install
```

## IDE Setup

### VS Code

Install extensions:
- Volar (Vue 3)
- TypeScript Vue Plugin
- Tailwind CSS IntelliSense
- ESLint

## Learn More

- [Vue 3 Docs](https://vuejs.org/)
- [Vite Docs](https://vitejs.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Pinia (State Management)](https://pinia.vuejs.org/)

## Next Steps

1. ✅ Get local development working
2. ⏳ Build client management features
3. ⏳ Build booking calendar
4. ⏳ Build email management
5. ⏳ Deploy to EC2

Happy coding! 🚀

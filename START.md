# How to Run the Project

## Quick Start

You need to run **TWO commands in separate terminals**:

### Terminal 1 - Laravel Server
```bash
php artisan serve
```
This will start Laravel on http://localhost:8000

### Terminal 2 - Vite Dev Server
```bash
npm run dev
```
This will start Vite for hot module replacement (HMR) for React

## Then Visit:
Open your browser and go to: **http://localhost:8000**

## Troubleshooting

### If you see a blank page:
1. Make sure both servers are running (Terminal 1 and Terminal 2)
2. Check browser console for errors (F12)
3. Make sure npm dependencies are installed: `npm install`
4. Check if React is compiling: Look at Terminal 2 for Vite output

### If you see "Vite manifest not found":
- Make sure `npm run dev` is running in Terminal 2
- The Vite server must be running for development

### If API calls fail:
- Check that Laravel server is running
- Visit http://localhost:8000/api/ directly to test

## Build for Production

If you want to build for production (without dev server):
```bash
npm run build
php artisan serve
```

## Current Status

✅ Laravel installed and configured
✅ React 18 installed
✅ Tailwind CSS v4 configured
✅ Vite configured
✅ Routes configured
✅ API endpoints ready


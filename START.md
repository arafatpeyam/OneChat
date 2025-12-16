# How to Run the Project

## First Time Setup (New PC / After Transfer)

If you just transferred this project or it's your first time setting it up:

```bash
# Run the automated setup (recommended)
composer run setup

# OR manually:
composer install
copy .env.example .env
php artisan key:generate
php artisan db:create
php artisan migrate --force
php artisan db:seed --class=AdminSeeder
npm install
```

**Default Admin Login:**
- Email: `admin@gmail.com`
- Password: `12345678`

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

## Transferring to Another PC

### For SQLite Database:

**Before creating zip:**
1. Run `prepare-for-transfer.bat` (Windows) or `prepare-for-transfer.sh` (Linux/Mac)
2. This stops servers and checks database file
3. Make sure `database/database.sqlite` is included in the zip

**On new PC:**
1. Extract the zip file
2. Run `composer run setup` (see First Time Setup above)
3. Database will be created automatically if missing

### For MySQL Database:

**Before creating zip:**
1. Run `prepare-for-transfer.bat` (Windows) or `prepare-for-transfer.sh` (Linux/Mac)
2. **Export your database:**
   - Windows: Run `export-database.bat`
   - Linux/Mac: Run `./export-database.sh`
   - Or export manually using phpMyAdmin (see DATABASE_TRANSFER_MYSQL.md)
3. Make sure `database/exports/*.sql` files are included in the zip

**On new PC:**
1. Extract the zip file
2. Run `composer run setup` - this will automatically import the database if export files exist
3. Or manually run `php artisan db:import` or use the import scripts

**See `DATABASE_TRANSFER_MYSQL.md` for detailed MySQL transfer instructions.**

See `TRANSFER_INSTRUCTIONS.md` for detailed instructions.

## Current Status

✅ Laravel installed and configured
✅ React 18 installed
✅ Tailwind CSS v4 configured
✅ Vite configured
✅ Routes configured
✅ API endpoints ready
✅ Database auto-creation command added


# Setup Instructions for New PC

## Quick Setup Steps

1. **Extract the zip file** to your desired location

2. **Open terminal/command prompt** in the project folder

3. **Run the setup script:**
   ```bash
   composer run setup
   ```
   OR manually run these commands:
   ```bash
   # Install PHP dependencies
   composer install
   
   # Create .env file if it doesn't exist
   copy .env.example .env
   # OR on Linux/Mac: cp .env.example .env
   
   # Generate application key
   php artisan key:generate
   
   # Create database file (if it doesn't exist)
   php artisan db:create
   
   # Run migrations
   php artisan migrate --force
   
   # Seed admin user
   php artisan db:seed --class=AdminSeeder
   
   # Install Node dependencies
   npm install
   
   # Build assets (optional, for production)
   npm run build
   ```

4. **Start the servers:**
   - Terminal 1: `php artisan serve`
   - Terminal 2: `npm run dev`

5. **Access the application:**
   - Open browser: http://localhost:8000
   - Login with: admin@gmail.com / 12345678

## If Database File is Missing

If the `database/database.sqlite` file is not in the zip:

1. The database file will be created automatically when you run migrations
2. OR manually create it:
   ```bash
   # Windows
   type nul > database\database.sqlite
   
   # Linux/Mac
   touch database/database.sqlite
   ```

## Troubleshooting

- **Database locked error**: Make sure Laravel server is not running
- **Permission denied**: Check file permissions on database folder
- **Migration errors**: Run `php artisan migrate:fresh --seed` to reset database


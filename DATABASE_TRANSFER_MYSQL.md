# MySQL Database Transfer Guide

## Problem
When transferring the OneChat project with MySQL database, the database data is not included in the zip file.

## Solution

### Method 1: Export Database Before Transfer (Recommended)

#### On Old PC (Before Transfer):

1. **Stop Laravel servers** (close terminals running `php artisan serve`)

2. **Export the database:**
   
   **Windows:**
   ```bash
   export-database.bat
   ```
   
   **Linux/Mac:**
   ```bash
   chmod +x export-database.sh
   ./export-database.sh
   ```
   
   This will create a SQL export file in `database/exports/` folder.

3. **Or export manually using phpMyAdmin:**
   - Open phpMyAdmin
   - Select your database (e.g., `peyam`)
   - Click "Export" tab
   - Choose "Quick" method
   - Click "Go" and save the file
   - Place the SQL file in: `database/exports/`

4. **Create zip file:**
   - Include the entire project folder
   - **IMPORTANT:** Include `database/exports/*.sql` files
   - Exclude: `node_modules`, `vendor`, `.env`

#### On New PC (After Transfer):

1. **Extract the zip file**

2. **Run setup:**
   ```bash
   composer run setup
   ```
   
   This will:
   - Install dependencies
   - Create .env file
   - Generate app key
   - **Import database** (if export file exists)
   - Run migrations
   - Seed admin user
   - Install npm packages

3. **Or import manually:**
   
   **Windows:**
   ```bash
   import-database.bat
   ```
   
   **Linux/Mac:**
   ```bash
   chmod +x import-database.sh
   ./import-database.sh
   ```
   
   **Or using phpMyAdmin:**
   - Open phpMyAdmin
   - Create database (if not exists)
   - Select the database
   - Click "Import" tab
   - Choose the SQL file from `database/exports/`
   - Click "Go"

### Method 2: Recreate Database Using Migrations

If you don't need the existing data:

1. **On new PC, after extracting:**
   ```bash
   composer run setup
   ```

2. **This will:**
   - Create database automatically
   - Run all migrations
   - Seed admin user

## Database Configuration

Make sure your `.env` file has correct MySQL settings:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=peyam
DB_USERNAME=root
DB_PASSWORD=your_password
```

## Troubleshooting

### Export Failed
- **mysqldump not found:** Install MySQL client tools or use phpMyAdmin
- **Access denied:** Check database credentials in `.env`
- **Database not found:** Verify database name in `.env`

### Import Failed
- **mysql client not found:** Install MySQL client tools or use phpMyAdmin
- **Database exists:** The script will skip import if database already has data
- **Permission denied:** Check MySQL user permissions

### Database Not Created
- Run migrations: `php artisan migrate --force`
- Or create manually in phpMyAdmin

## Files Created

- `export-database.bat` - Windows export script
- `export-database.sh` - Linux/Mac export script
- `import-database.bat` - Windows import script
- `import-database.sh` - Linux/Mac import script

## Notes

- Export files are saved in `database/exports/` folder
- Export files are named: `{database_name}_export_{timestamp}.sql`
- The import script automatically finds the latest export file
- If no export file exists, migrations will create a fresh database


@echo off
echo ========================================
echo OneChat - Import MySQL Database
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Please run: composer run setup
    pause
    exit /b 1
)

REM Read database credentials from .env
for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_CONNECTION=" .env') do set DB_CONNECTION=%%a
for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_DATABASE=" .env') do set DB_DATABASE=%%a
for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_USERNAME=" .env') do set DB_USERNAME=%%a
for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_PASSWORD=" .env') do set DB_PASSWORD=%%a
for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_HOST=" .env') do set DB_HOST=%%a
for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_PORT=" .env') do set DB_PORT=%%a

REM Set defaults if not found
if "%DB_CONNECTION%"=="" set DB_CONNECTION=mysql
if "%DB_HOST%"=="" set DB_HOST=127.0.0.1
if "%DB_PORT%"=="" set DB_PORT=3306

echo [INFO] Database Configuration:
echo        Connection: %DB_CONNECTION%
echo        Database: %DB_DATABASE%
echo        Host: %DB_HOST%
echo        Port: %DB_PORT%
echo        Username: %DB_USERNAME%
echo.

if "%DB_CONNECTION%"=="sqlite" (
    echo [INFO] Using SQLite - no import needed.
    echo        Database file will be created automatically.
    echo.
    pause
    exit /b 0
)

if "%DB_DATABASE%"=="" (
    echo [ERROR] DB_DATABASE not set in .env file!
    pause
    exit /b 1
)

echo [1/3] Checking for database export files...
if not exist database\exports (
    echo [WARNING] database\exports folder not found!
    echo           No database import needed - will use migrations.
    echo.
    pause
    exit /b 0
)

REM Find the most recent SQL file
set LATEST_FILE=
for %%f in (database\exports\*.sql) do (
    set LATEST_FILE=%%f
)

if "%LATEST_FILE%"=="" (
    echo [WARNING] No SQL export files found in database\exports\
    echo           Database will be created using migrations.
    echo.
    pause
    exit /b 0
)

echo [OK] Found export file: %LATEST_FILE%
echo.

echo [2/3] Creating database (if not exists)...
REM Check if mysql is available
where mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] mysql client not found!
    echo           Please create the database manually:
    echo           1. Open phpMyAdmin or MySQL client
    echo           2. Create database: %DB_DATABASE%
    echo           3. Then run this script again
    echo.
    pause
    exit /b 1
)

REM Create database
if "%DB_PASSWORD%"=="" (
    mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USERNAME% -e "CREATE DATABASE IF NOT EXISTS %DB_DATABASE% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
) else (
    mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USERNAME% -p%DB_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS %DB_DATABASE% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
)

if %errorlevel% neq 0 (
    echo [WARNING] Could not create database automatically.
    echo           Please create it manually: %DB_DATABASE%
    echo.
)

echo [3/3] Importing database...
if "%DB_PASSWORD%"=="" (
    mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USERNAME% %DB_DATABASE% < "%LATEST_FILE%"
) else (
    mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USERNAME% -p%DB_PASSWORD% %DB_DATABASE% < "%LATEST_FILE%"
)

if %errorlevel% equ 0 (
    echo [OK] Database imported successfully!
    echo.
    echo [INFO] You may want to run migrations to ensure schema is up to date:
    echo        php artisan migrate --force
) else (
    echo [ERROR] Database import failed!
    echo         Please import manually using phpMyAdmin:
    echo         1. Open phpMyAdmin
    echo         2. Select database: %DB_DATABASE%
    echo         3. Click "Import" tab
    echo         4. Choose file: %LATEST_FILE%
    echo         5. Click "Go"
    echo.
)

echo.
pause


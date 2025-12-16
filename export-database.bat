@echo off
echo ========================================
echo OneChat - Export MySQL Database
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Please create .env file first or copy from .env.example
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
    echo [INFO] Using SQLite - checking database file...
    if exist database\database.sqlite (
        echo [OK] SQLite database file found: database\database.sqlite
        echo       Make sure to include this file in your zip!
    ) else (
        echo [WARNING] SQLite database file NOT found!
        echo           It will be created automatically on the new PC.
    )
    echo.
    pause
    exit /b 0
)

if "%DB_DATABASE%"=="" (
    echo [ERROR] DB_DATABASE not set in .env file!
    pause
    exit /b 1
)

echo [1/2] Creating database export directory...
if not exist database\exports mkdir database\exports
echo [OK] Directory created: database\exports
echo.

echo [2/2] Exporting MySQL database...
set EXPORT_FILE=database\exports\%DB_DATABASE%_export_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set EXPORT_FILE=%EXPORT_FILE: =0%

REM Check if mysqldump is available
where mysqldump >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] mysqldump not found!
    echo.
    echo Please install MySQL client tools or use phpMyAdmin to export:
    echo   1. Open phpMyAdmin
    echo   2. Select database: %DB_DATABASE%
    echo   3. Click "Export" tab
    echo   4. Choose "Quick" method
    echo   5. Click "Go" and save the file
    echo   6. Place the SQL file in: database\exports\
    echo.
    pause
    exit /b 1
)

REM Export database
if "%DB_PASSWORD%"=="" (
    mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USERNAME% %DB_DATABASE% > "%EXPORT_FILE%"
) else (
    mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USERNAME% -p%DB_PASSWORD% %DB_DATABASE% > "%EXPORT_FILE%"
)

if %errorlevel% equ 0 (
    echo [OK] Database exported successfully!
    echo       File: %EXPORT_FILE%
    echo.
    echo [IMPORTANT] Include this file in your zip transfer!
    echo             Path: database\exports\
) else (
    echo [ERROR] Database export failed!
    echo.
    echo Please export manually using phpMyAdmin:
    echo   1. Open phpMyAdmin
    echo   2. Select database: %DB_DATABASE%
    echo   3. Click "Export" tab
    echo   4. Choose "Quick" method
    echo   5. Click "Go" and save the file
    echo   6. Place the SQL file in: database\exports\
    echo.
)

echo.
pause


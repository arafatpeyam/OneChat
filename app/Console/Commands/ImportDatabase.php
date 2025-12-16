<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;

class ImportDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:import {--file= : Specific SQL file to import}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import MySQL database from SQL export file';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $connection = config('database.default');
        
        // Skip if using SQLite
        if ($connection === 'sqlite') {
            $this->info('Using SQLite - no import needed. Database will be created automatically.');
            return 0;
        }

        // Check for export files
        $exportsDir = database_path('exports');
        
        if (!File::exists($exportsDir)) {
            $this->warn('No database exports folder found. Database will be created using migrations.');
            return 0;
        }

        // Find SQL file
        $sqlFile = $this->option('file');
        
        if (!$sqlFile) {
            // Find the most recent SQL file
            $files = File::glob($exportsDir . '/*.sql');
            if (empty($files)) {
                $this->warn('No SQL export files found. Database will be created using migrations.');
                return 0;
            }
            
            // Sort by modification time, get most recent
            usort($files, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            
            $sqlFile = $files[0];
        } else {
            if (!File::exists($sqlFile)) {
                $this->error("SQL file not found: {$sqlFile}");
                return 1;
            }
        }

        $this->info("Found export file: {$sqlFile}");
        
        // Read database config
        $database = config("database.connections.{$connection}.database");
        $host = config("database.connections.{$connection}.host");
        $username = config("database.connections.{$connection}.username");
        $password = config("database.connections.{$connection}.password");
        $port = config("database.connections.{$connection}.port", 3306);

        // Check if mysql command is available
        $mysqlPath = $this->findMysqlCommand();
        
        if (!$mysqlPath) {
            $this->warn('MySQL client not found. Please import manually using phpMyAdmin:');
            $this->line("  1. Open phpMyAdmin");
            $this->line("  2. Select database: {$database}");
            $this->line("  3. Click 'Import' tab");
            $this->line("  4. Choose file: {$sqlFile}");
            $this->line("  5. Click 'Go'");
            return 0;
        }

        // Create database if not exists
        $this->info("Creating database '{$database}' if not exists...");
        $createDbCmd = sprintf(
            '%s -h %s -P %s -u %s %s -e "CREATE DATABASE IF NOT EXISTS %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"',
            $mysqlPath,
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            $password ? '-p' . escapeshellarg($password) : '',
            escapeshellarg($database)
        );
        
        exec($createDbCmd . ' 2>&1', $output, $returnCode);
        
        if ($returnCode !== 0) {
            $this->warn('Could not create database automatically. Please create it manually.');
        }

        // Import SQL file
        $this->info("Importing database from: {$sqlFile}");
        
        $importCmd = sprintf(
            '%s -h %s -P %s -u %s %s %s < %s',
            $mysqlPath,
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            $password ? '-p' . escapeshellarg($password) : '',
            escapeshellarg($database),
            escapeshellarg($sqlFile)
        );
        
        exec($importCmd . ' 2>&1', $output, $returnCode);
        
        if ($returnCode === 0) {
            $this->info('Database imported successfully!');
            $this->line('You may want to run migrations to ensure schema is up to date:');
            $this->line('  php artisan migrate --force');
            return 0;
        } else {
            $this->error('Database import failed!');
            $this->line('Please import manually using phpMyAdmin.');
            return 1;
        }
    }

    /**
     * Find MySQL command path
     */
    private function findMysqlCommand()
    {
        $commands = ['mysql', 'mysql.exe'];
        
        foreach ($commands as $cmd) {
            $path = trim(shell_exec("where {$cmd} 2>nul") ?: shell_exec("which {$cmd} 2>/dev/null"));
            if ($path && File::exists($path)) {
                return $path;
            }
        }
        
        return null;
    }
}


<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CreateDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:create';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create SQLite database file if it does not exist';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $databasePath = database_path('database.sqlite');
        
        if (File::exists($databasePath)) {
            $this->info('Database file already exists.');
            return 0;
        }

        // Create the database file
        File::put($databasePath, '');
        
        // Set proper permissions (Unix-like systems)
        if (PHP_OS_FAMILY !== 'Windows') {
            chmod($databasePath, 0666);
        }

        $this->info('Database file created successfully at: ' . $databasePath);
        return 0;
    }
}


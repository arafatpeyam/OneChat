<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\BloodDonor;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Find all users who are donors but don't have a BloodDonor record
        // Get all user IDs that already have BloodDonor records
        $existingDonorUserIds = BloodDonor::pluck('user_id')->toArray();
        
        // Find users who are donors but don't have a BloodDonor record
        $usersWithoutDonorRecords = User::where('donor', 'yes')
            ->whereNotNull('blood_group')
            ->whereNotNull('city')
            ->whereNotIn('id', $existingDonorUserIds)
            ->get();

        foreach ($usersWithoutDonorRecords as $user) {
            // Create BloodDonor record for existing donor users
            BloodDonor::create([
                'user_id' => $user->id,
                'blood_group' => $user->blood_group,
                'city' => $user->city,
                'contact_phone' => $user->phone,
                'is_available' => true,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally remove BloodDonor records that were created by this migration
        // This is optional - you may want to keep them
    }
};

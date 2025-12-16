<?php

namespace App\Observers;

use App\Models\BloodDonor;
use App\Models\User;

class UserObserver
{
    /**
     * Sync the blood donor profile whenever the user record is saved.
     */
    public function saved(User $user): void
    {
        if ($user->donor === 'yes') {
            BloodDonor::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'blood_group' => $user->blood_group,
                    'city' => $user->city,
                    'contact_phone' => $user->phone,
                    'is_available' => true,
                ]
            );
        } else {
            BloodDonor::where('user_id', $user->id)->delete();
        }
    }
}


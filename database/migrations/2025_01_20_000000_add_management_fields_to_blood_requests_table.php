<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('blood_requests', function (Blueprint $table) {
            $table->foreignId('managed_by')->nullable()->after('status')->constrained('users')->onDelete('set null');
            $table->timestamp('managed_at')->nullable()->after('managed_by');
            $table->boolean('confirmed_by_requester')->default(false)->after('managed_at');
            $table->timestamp('confirmed_at')->nullable()->after('confirmed_by_requester');
            
            $table->index('managed_by');
            $table->index('confirmed_by_requester');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('blood_requests', function (Blueprint $table) {
            $table->dropIndex(['confirmed_by_requester']);
            $table->dropIndex(['managed_by']);
            $table->dropForeign(['managed_by']);
            $table->dropColumn(['managed_by', 'managed_at', 'confirmed_by_requester', 'confirmed_at']);
        });
    }
};


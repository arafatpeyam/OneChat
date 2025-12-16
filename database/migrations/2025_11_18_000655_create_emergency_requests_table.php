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
        Schema::create('emergency_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['fire', 'harassment', 'medical', 'accident', 'crime', 'natural_disaster', 'other'])->default('other');
            $table->string('title');
            $table->text('description');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('address')->nullable();
            $table->enum('status', ['active', 'resolved', 'cancelled'])->default('active');
            $table->integer('priority')->default(1); // 1 = low, 2 = medium, 3 = high, 4 = critical
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            
            // Indexes for faster queries
            $table->index('user_id');
            $table->index('status');
            $table->index('type');
            $table->index('priority');
            $table->index('created_at');
            // Spatial index for location-based queries (if supported)
            $table->index(['latitude', 'longitude']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('emergency_requests');
    }
};

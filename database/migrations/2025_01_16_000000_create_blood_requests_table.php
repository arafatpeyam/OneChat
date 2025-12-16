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
        Schema::create('blood_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('blood_group', 10);
            $table->integer('units_needed');
            $table->enum('urgency', ['normal', 'urgent', 'critical'])->default('normal');
            $table->string('patient_name');
            $table->string('hospital_name');
            $table->text('hospital_address');
            $table->string('city');
            $table->string('state');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('contact_phone', 20);
            $table->string('contact_email')->nullable();
            $table->date('needed_by_date');
            $table->time('needed_by_time');
            $table->text('additional_info');
            $table->enum('status', ['pending', 'fulfilled', 'cancelled'])->default('pending');
            $table->timestamps();
            
            // Indexes for better query performance
            $table->index('blood_group');
            $table->index('urgency');
            $table->index('status');
            $table->index('city');
            $table->index('state');
            $table->index('needed_by_date');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blood_requests');
    }
};


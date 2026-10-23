<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mrp_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->restrictOnDelete();
            $table->string('code', 50);
            $table->string('name', 150);
            $table->string('unit', 30);
            $table->unsignedSmallInteger('lead_time_periods')->default(0);
            $table->decimal('initial_on_hand', 15, 4)->default(0);
            $table->string('lot_sizing_policy', 20)->default('lot_for_lot');
            $table->decimal('fixed_order_quantity', 15, 4)->nullable();
            $table->timestamps();
            $table->unique(['project_id', 'code']);
            $table->unique(['project_id', 'id']);
        });

        Schema::create('mrp_bom_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('parent_item_id');
            $table->unsignedBigInteger('component_item_id');
            $table->decimal('quantity_per', 15, 4);
            $table->timestamps();
            $table->unique(['project_id', 'parent_item_id', 'component_item_id'], 'mrp_bom_parent_component_unique');
            $table->index(['project_id', 'component_item_id']);
            $table->foreign(['project_id', 'parent_item_id'])
                ->references(['project_id', 'id'])
                ->on('mrp_items')
                ->restrictOnDelete();
            $table->foreign(['project_id', 'component_item_id'])
                ->references(['project_id', 'id'])
                ->on('mrp_items')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mrp_bom_lines');
        Schema::dropIfExists('mrp_items');
    }
};

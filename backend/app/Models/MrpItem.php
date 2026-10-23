<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MrpItem extends Model
{
    protected $fillable = [
        'code',
        'name',
        'unit',
        'lead_time_periods',
        'initial_on_hand',
        'lot_sizing_policy',
        'fixed_order_quantity',
    ];

    protected function casts(): array
    {
        return [
            'lead_time_periods' => 'integer',
            'initial_on_hand' => 'float',
            'fixed_order_quantity' => 'float',
        ];
    }

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** @return HasMany<MrpBomLine, $this> */
    public function parentBomLines(): HasMany
    {
        return $this->hasMany(MrpBomLine::class, 'parent_item_id');
    }

    /** @return HasMany<MrpBomLine, $this> */
    public function componentBomLines(): HasMany
    {
        return $this->hasMany(MrpBomLine::class, 'component_item_id');
    }
}

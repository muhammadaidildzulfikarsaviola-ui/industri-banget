<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MrpBomLine extends Model
{
    protected $fillable = [
        'project_id',
        'parent_item_id',
        'component_item_id',
        'quantity_per',
    ];

    protected function casts(): array
    {
        return ['quantity_per' => 'float'];
    }

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** @return BelongsTo<MrpItem, $this> */
    public function parentItem(): BelongsTo
    {
        return $this->belongsTo(MrpItem::class, 'parent_item_id');
    }

    /** @return BelongsTo<MrpItem, $this> */
    public function componentItem(): BelongsTo
    {
        return $this->belongsTo(MrpItem::class, 'component_item_id');
    }
}

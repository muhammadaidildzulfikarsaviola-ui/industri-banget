<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalysisRun extends Model
{
    protected $fillable = [
        'type',
        'inputs',
        'results',
    ];

    protected function casts(): array
    {
        return [
            'inputs' => 'array',
            'results' => 'array',
        ];
    }

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}

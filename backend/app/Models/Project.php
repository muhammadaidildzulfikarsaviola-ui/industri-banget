<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'name',
        'industry',
        'description',
        'status',
    ];

    /** @return HasMany<AnalysisRun, $this> */
    public function analysisRuns(): HasMany
    {
        return $this->hasMany(AnalysisRun::class);
    }

    /** @return HasMany<MrpItem, $this> */
    public function mrpItems(): HasMany
    {
        return $this->hasMany(MrpItem::class);
    }

    /** @return HasMany<MrpBomLine, $this> */
    public function mrpBomLines(): HasMany
    {
        return $this->hasMany(MrpBomLine::class);
    }
}

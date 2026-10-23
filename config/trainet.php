<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Demo Mode
    |--------------------------------------------------------------------------
    |
    | When enabled, the app exposes demo-only shortcuts: the passwordless
    | persona picker (/personas), the demo data reset endpoint, and helper
    | routes like /optimize. This must be disabled in production.
    |
    */

    'demo' => env('TRAINET_DEMO', env('APP_ENV', 'production') !== 'production'),

];

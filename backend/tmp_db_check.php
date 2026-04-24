<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::capture();
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$exists = DB::table('users')->where('email', 'citoyen@gmail.com')->exists();
echo $exists ? "exists\n" : "missing\n";
echo DB::table('complaints')->count() . " complaints\n";

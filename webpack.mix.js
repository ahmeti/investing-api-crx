let mix = require('laravel-mix');
mix.options({ manifest: false });
mix.setPublicPath('dist');

mix.copyDirectory('images', 'dist/images');
mix.copyDirectory('node_modules/@fortawesome/fontawesome-free/webfonts', 'dist/webfonts');
mix.copy('manifest.json', 'dist/manifest.json');
mix.copy('popup.html', 'dist/popup.html');

mix.styles([
    'node_modules/@fortawesome/fontawesome-free/css/all.min.css',
    'node_modules/bootstrap/dist/css/bootstrap.min.css'
], 'dist/popup.css')

mix.js(['popup.js'], 'dist/popup.js');
mix.js(['content-script.js'], 'dist/content-script.js');
# syntax=docker/dockerfile:1

############################
# Build: composer + vite
############################
FROM serversideup/php:8.5-cli AS build
USER root

# Pull Node.js + npm in from the official image — the Vite build needs it,
# and the Wayfinder plugin shells back out to `php artisan` during the build.
COPY --from=node:22 /usr/local/bin/node /usr/local/bin/node
COPY --from=node:22 /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts --no-autoloader

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN composer dump-autoload --optimize \
    && npm run build

#################
# Production app
#################
FROM serversideup/php:8.5-fpm-nginx AS production

ENV PHP_OPCACHE_ENABLE=1 \
    AUTORUN_ENABLED=true \
    AUTORUN_LARAVEL_STORAGE_LINK=true \
    AUTORUN_LARAVEL_MIGRATION=true \
    SSL_MODE=off

WORKDIR /var/www/html

USER root
COPY --chmod=755 docker/entrypoint.d/ /etc/entrypoint.d/
USER www-data

COPY --chown=www-data:www-data . .
COPY --chown=www-data:www-data --from=build /var/www/html/vendor ./vendor
COPY --chown=www-data:www-data --from=build /var/www/html/public/build ./public/build
RUN php artisan package:discover --ansi

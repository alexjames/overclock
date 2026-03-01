#!/bin/bash
# Run once on the EC2 instance to issue the initial Let's Encrypt certificate.
# After this, docker-compose handles automatic renewal.

DOMAIN="overclock.buildbreak.net"
EMAIL="darkm@example.com"  # Replace with your email

set -e

# Bring up nginx on port 80 only (no HTTPS yet) so ACME challenge works.
# Use a temporary HTTP-only config.
docker compose stop nginx 2>/dev/null || true

# Run certbot standalone to issue the cert.
docker run --rm \
  -p 80:80 \
  -v certbot-www:/var/www/certbot \
  -v certbot-certs:/etc/letsencrypt \
  certbot/certbot certonly \
    --standalone \
    --agree-tos \
    --no-eff-email \
    -m "$EMAIL" \
    -d "$DOMAIN"

echo "Certificate issued. Starting all services..."
docker compose up -d

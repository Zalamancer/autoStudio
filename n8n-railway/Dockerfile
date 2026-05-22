FROM n8nio/n8n:latest

# Railway provides PORT env var
ENV N8N_PORT=${PORT:-5678}
ENV N8N_PROTOCOL=https
ENV GENERIC_TIMEZONE=UTC
ENV N8N_DIAGNOSTICS_ENABLED=false

# Secure defaults — set N8N_BASIC_AUTH_USER and N8N_BASIC_AUTH_PASSWORD in Railway env vars
ENV N8N_BASIC_AUTH_ACTIVE=true

# Use PostgreSQL for persistence (configured via DATABASE_URL in Railway)
ENV DB_TYPE=postgresdb

# Webhook URL — set N8N_WEBHOOK_URL in Railway env vars after deploy
# e.g. https://your-n8n-app.railway.app/

EXPOSE ${N8N_PORT}

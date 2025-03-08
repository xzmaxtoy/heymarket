#!/bin/bash

# Update system
apt-get update
apt-get upgrade -y

# Install required packages
apt-get install -y curl git apt-transport-https ca-certificates gnupg lsb-release

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose if not already installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
fi

# Clone repository
cd /root
git clone https://github.com/xzmaxtoy/heymarket.git
cd heymarket

# Create production env file
cat > .env << EOL
PORT=3000
NODE_ENV=production
CORS_ORIGIN=http://159.223.135.110

# Add your production environment variables here
HEYMARKET_API_KEY=your_heymarket_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Batch Processing Configuration
BATCH_PROCESSING_RATE=5
BATCH_MAX_RETRIES=3
BATCH_RETRY_DELAY=300000
BATCH_CLEANUP_INTERVAL=3600000
BATCH_MAX_SIZE=10000

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=100
SLA_WARNING_THRESHOLD=900000
SLA_CRITICAL_THRESHOLD=1800000

# Feature Flags
FEATURE_FLAG_NEW_BATCH_SYSTEM=true
FEATURE_FLAG_ANALYTICS_DASHBOARD=true
FEATURE_FLAG_PERFORMANCE_MONITORING=true

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
ENABLE_REQUEST_LOGGING=true

# Cache Configuration
PREVIEW_CACHE_SIZE=1000
PREVIEW_CACHE_TTL=3600
EOL

# Start the application
docker-compose up -d

# Show status
docker-compose ps
docker-compose logs --tail=50

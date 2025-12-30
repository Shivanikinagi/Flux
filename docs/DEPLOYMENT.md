# Flux Deployment Guide

## 📋 Prerequisites

Before deploying Flux, ensure you have:

- Node.js v18 or higher
- npm v9 or higher
- Movement CLI installed
- Git
- Twilio account with WhatsApp enabled
- ngrok (for local webhook testing)

---

## 🚀 Quick Start (Local Development)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Flux.git
cd Flux
```

### 2. Install Movement CLI

**For Linux/macOS:**
```bash
curl -fsSL "https://raw.githubusercontent.com/movementlabsxyz/movement/main/scripts/install.sh" | bash
```

**For Windows:**
```powershell
# Use WSL or follow Movement Network documentation
```

Verify installation:
```bash
movement --version
```

### 3. Initialize Movement Account

```bash
movement init
# Follow prompts and select testnet
```

### 4. Fund Your Account

```bash
movement account fund --account default
# Or visit Movement testnet faucet
```

### 5. Deploy Smart Contracts

```bash
cd contracts
movement move compile
movement move test
movement move publish --named-addresses Flux=default
```

Copy the deployed contract address for later use.

### 6. Setup Backend

```bash
cd ../backend
npm install
```

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
MOVEMENT_NODE_URL=https://testnet.movementnetwork.xyz/v1
CONTRACT_ADDRESS=0xYourDeployedContractAddress
SERVER_PRIVATE_KEY=0xYourServerPrivateKey

TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

PORT=3000
NODE_ENV=development
```

### 7. Initialize the Contract

```bash
cd ..
node scripts/initialize.js
```

### 8. Start the Server

```bash
cd backend
npm start
```

The server should be running on `http://localhost:3000`

### 9. Setup Webhook (ngrok)

In a new terminal:
```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abcd1234.ngrok.io`)

### 10. Configure Twilio Webhook

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to Messaging → Settings → WhatsApp Sandbox
3. Set webhook URL: `https://your-ngrok-url.ngrok.io/webhook`
4. Save configuration

### 11. Test the System

Send a WhatsApp message to your Twilio sandbox number:
```
HELP
```

You should receive a response with available commands!

---

## 🏗️ Production Deployment

### Server Requirements

- **Minimum:**
  - 2 CPU cores
  - 4 GB RAM
  - 20 GB storage
  - Ubuntu 20.04 or higher

- **Recommended:**
  - 4 CPU cores
  - 8 GB RAM
  - 50 GB SSD
  - Load balancer
  - CDN

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install nginx (reverse proxy)
sudo apt install -y nginx

# Install certbot (SSL certificates)
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Clone and Setup

```bash
cd /var/www
sudo git clone https://github.com/yourusername/Flux.git
cd Flux
sudo chown -R $USER:$USER .

cd backend
npm install --production
```

### 3. Environment Configuration

```bash
sudo nano .env
```

Set production values:
```env
MOVEMENT_NODE_URL=https://mainnet.movementnetwork.xyz/v1
CONTRACT_ADDRESS=0xYourMainnetContractAddress
SERVER_PRIVATE_KEY=0xYourServerPrivateKey

TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+1234567890

PORT=3000
NODE_ENV=production

JWT_SECRET=your_secure_random_string
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### 4. Setup PM2

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'Flux',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

Start the application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/Flux
```

Add configuration:
```nginx
server {
    listen 80;
    server_name api.Flux.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/Flux /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL

```bash
sudo certbot --nginx -d api.Flux.app
```

### 7. Configure Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 8. Setup Monitoring

```bash
# Install monitoring tools
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Setup monitoring dashboard
pm2 link [secret-key] [public-key]
```

---

## 🐳 Docker Deployment

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy application
COPY backend/ .

# Create logs directory
RUN mkdir -p logs

EXPOSE 3000

CMD ["node", "src/server.js"]
```

### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  Flux-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - Flux-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - Flux-api
    restart: unless-stopped
    networks:
      - Flux-network

networks:
  Flux-network:
    driver: bridge
```

### 3. Build and Run

```bash
docker-compose build
docker-compose up -d
```

### 4. View Logs

```bash
docker-compose logs -f
```

---

## ☸️ Kubernetes Deployment

### 1. Create Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: Flux-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: Flux
  template:
    metadata:
      labels:
        app: Flux
    spec:
      containers:
      - name: Flux
        image: Flux:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        envFrom:
        - secretRef:
            name: Flux-secrets
```

### 2. Create Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: Flux-service
spec:
  selector:
    app: Flux
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 3. Deploy

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

---

## 🔧 Twilio Production Setup

### 1. Request Production Access

1. Go to Twilio Console
2. Navigate to WhatsApp → Senders
3. Click "Request to enable"
4. Fill out the application

### 2. Configure Production Webhook

Once approved:
1. Add your production webhook URL
2. Enable message delivery notifications
3. Configure status callbacks

### 3. Phone Number Registration

Register your production phone number:
- Business verification required
- WhatsApp Business profile setup
- Message template approval

---

## 🔐 Security Checklist

- [ ] Use HTTPS only
- [ ] Secure private keys (use KMS/vault)
- [ ] Enable rate limiting
- [ ] Implement authentication (JWT)
- [ ] Set up WAF (Web Application Firewall)
- [ ] Enable CORS properly
- [ ] Use environment variables
- [ ] Regular security updates
- [ ] Backup encryption keys
- [ ] Monitor for suspicious activity
- [ ] Implement logging and alerting
- [ ] Regular security audits

---

## 📊 Monitoring & Logging

### Setup PM2 Monitoring

```bash
pm2 install pm2-server-monit
```

### Setup Log Aggregation

Use tools like:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Datadog
- New Relic

### Health Checks

Add health check endpoints:
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});
```

Configure monitoring to ping `/health` every minute.

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Flux

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/Flux
            git pull
            cd backend
            npm install
            pm2 restart Flux
```

---

## 🆘 Troubleshooting

### Server won't start
```bash
# Check logs
pm2 logs Flux

# Check port availability
netstat -tulpn | grep 3000

# Restart
pm2 restart Flux
```

### Webhook not working
- Verify ngrok/domain is accessible
- Check Twilio console for errors
- Verify webhook URL is correct
- Check server logs

### Transaction failures
- Verify contract address is correct
- Check account has sufficient balance
- Ensure Movement node is responsive
- Check transaction logs

---

## 📚 Additional Resources

- [Movement Network Docs](https://docs.movementnetwork.xyz)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [PM2 Documentation](https://pm2.keymetrics.io)
- [Nginx Documentation](https://nginx.org/en/docs)

---

*Last Updated: December 24, 2025*
*Version: 1.0*

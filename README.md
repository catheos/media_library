# Media Library
Self-hosted media library that lets you organize, track, and manage all your personal media in one place. Unlike relying on multiple websites or platforms, this project aims to give you full control over your media collection — whether it's movies, TV shows, music, or even obscure books. 

## Frameworks/Tools
#### Frontend:
- React (Vite)

#### Backend:
- Express
- MariaDB

## Docker Setup

### Prerequisites
- Docker and Docker Compose installed
- Node.js (for local development)

### Quick Start

1. **Clone the repository**
```bash
   git clone https://github.com/catheos/media_library.git
   cd media_library
```

2. **Configure environment variables**
```bash
   # Copy example env files
   cp backend/.env.example backend/.env.docker
   cp frontend/.env.example frontend/.env
   
   # Edit backend/.env.docker with your settings
   nano backend/.env.docker
```
   
   Update these values in `backend/.env.docker`:
   - `DB_PASS` - Set a secure database password
   - `JWT_SECRET` - Generate with: `openssl rand -base64 32`

3. **Update docker-compose.yml**
   
   Edit `docker-compose.yml` and set:
   - `MYSQL_PASSWORD` to match your `DB_PASS`
   - `VITE_API_HOST` to your server IP (e.g., `http://192.168.1.100:3000`)

4. **Build and deploy**
```bash
   ./build.sh
   docker-compose up -d
```

5. **Access the application**
   
   Open `http://localhost:3000` or `http://YOUR_SERVER_IP:3000` in your browser

### Useful Commands
```bash
# View logs
docker-compose logs -f app

# Stop the application
docker-compose down

# Restart the application
docker-compose restart

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d

# Backup database
docker-compose exec db mysqldump -u media_library -p media_library_db > backup.sql

# Enter container shell
docker-compose exec app sh
```

### Local Development (without Docker)
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```
# TargetRank Deployment Guide

This guide outlines the deployment process for the TargetRank MERN application.

## Deployment Architecture

- **Frontend**: React + Vite → Deployed on **Vercel**
- **Backend**: Node.js + Express → Deployed on **Render**
- **Database**: MongoDB Atlas (Cloud)

## Prerequisites

1. **GitHub Account** - Repository is already connected
2. **Vercel Account** - For frontend deployment (free tier available)
3. **Render Account** - For backend deployment (free tier available)
4. **MongoDB Atlas Account** - For cloud database

## Environment Variables

### Backend (.env) - Render

Set these environment variables in Render dashboard:

```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/targetrank
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-url.vercel.app
API_URL=https://your-backend-url.onrender.com
```

### Frontend (.env) - Vercel

Set these environment variables in Vercel dashboard:

```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

## Deployment Steps

### 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with strong password
4. Add your IP addresses to the IP whitelist (or allow all: 0.0.0.0/0)
5. Get the connection string: `mongodb+srv://username:password@cluster.mongodb.net/targetrank`

### 2. Backend Deployment (Render)

1. Go to [Render](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Select the `backend` directory as the root directory
5. Set environment variables from the `.env` example
6. Build command: `npm install`
7. Start command: `npm start`
8. Deploy and note the URL (e.g., `https://targetrank-api.onrender.com`)

### 3. Frontend Deployment (Vercel)

1. Go to [Vercel](https://vercel.com)
2. Click "Add New" and select "Project"
3. Import your GitHub repository
4. Set root directory to `frontend`
5. Add environment variable: `VITE_API_URL=https://your-backend-url.onrender.com/api`
6. Deploy and note the URL

### 4. Update CORS

After deployment, ensure the backend CORS configuration includes your Vercel frontend URL. Update the backend `.env`:

```
CLIENT_URL=https://your-frontend-url.vercel.app
```

## Production Checklist

- [ ] MongoDB Atlas cluster created and secured
- [ ] Backend deployed to Render with all environment variables set
- [ ] Frontend deployed to Vercel with VITE_API_URL configured
- [ ] CORS configured to allow Vercel frontend URL
- [ ] Database connection tested
- [ ] API health check endpoint responds
- [ ] Frontend can communicate with backend
- [ ] Authentication flow works end-to-end
- [ ] SSL/TLS certificates active (automatic on Render and Vercel)

## Troubleshooting

### CORS Errors
- Check that `CLIENT_URL` in backend matches your Vercel frontend URL
- Ensure frontend `VITE_API_URL` points to correct Render backend URL

### Database Connection Errors
- Verify `MONGO_URI` is correct
- Check IP whitelist on MongoDB Atlas
- Ensure database user credentials are correct

### Build Failures
- Check Node version compatibility (should be 18+)
- Ensure all dependencies are installed
- Review build logs in Render/Vercel dashboard

### Blank Frontend Page
- Check browser console for errors
- Verify API URL is correctly set in environment variables
- Check network tab to see if API calls succeed

## Local Development

To run locally before deployment:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Maintenance

- Monitor logs in Render and Vercel dashboards
- Keep dependencies updated regularly
- Use seed scripts to manage test data
- Backup MongoDB Atlas database regularly

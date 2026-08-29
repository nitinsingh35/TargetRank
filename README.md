# TargetRank

> Prepare Smart. Practice Better. Rank Higher.

**TargetRank** is a competitive examination preparation platform designed specifically for aspirants preparing for India's toughest government exams including:
- **UPSC** (Union Public Service Commission)
- **BPSC** (Bihar Public Service Commission)
- **UPPSC** (Uttar Pradesh Public Service Commission)
- **SSC CGL** (Staff Selection Commission Combined Graduate Level)
- **Banking** (IBPS, SBI PO/Clerk)
- **Railway** (RRB NTPC, Group D)
- **Defence** (NDA, CDS, AFCAT)
- **State PCS** (Various State Public Service Commissions)

---

## 🛠️ Tech Stack

### Frontend
- **Core Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, Vanilla CSS custom configurations
- **Icons**: React Icons
- **Routing**: React Router DOM (v6)
- **Form Management**: React Hook Form
- **API Client**: Axios
- **Charts**: Recharts
- **Toast Notifications**: React Hot Toast

### Backend
- **Core Server**: Node.js, Express.js
- **Database Wrapper**: MongoDB, Mongoose
- **Authentication**: JSON Web Tokens (JWT), `bcryptjs`
- **Security**: `helmet`, `cors`, `express-rate-limit`
- **File Upload**: `multer`
- **Configuration**: `dotenv`
- **Development**: `nodemon`

---

## 📁 Folder Structure

```
targetrank/
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Express route handlers
│   ├── middleware/      # Global error and auth helpers
│   ├── models/          # Mongoose database schemas
│   ├── routes/          # Express API route endpoints
│   ├── utils/           # Shared utility classes
│   ├── uploads/         # Destination for media files
│   ├── seed/            # Seed data and db scripts
│   ├── server.js        # Entry point for backend
│   ├── package.json     # Node script configuration
│   └── .env.example     # Template for config vars
│
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios API interceptor configurations
│   │   ├── components/  # Reusable UI fragments
│   │   ├── context/     # State contexts (e.g. auth context)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── layouts/     # Standard layout configurations
│   │   ├── pages/       # Router page endpoints
│   │   ├── routes/      # Navigation config & route access
│   │   ├── utils/       # Small frontend helper methods
│   │   ├── App.jsx      # Core React view container
│   │   └── main.jsx     # Vite mount script
│   ├── package.json     # React scripts & packages
│   └── vite.config.js   # Vite server settings & proxy config
│
└── README.md            # Technical documentation (This file)
```

---

## ⚙️ Installation & Running the Project

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed and running locally on your system.

### Step 1: Install Dependencies

#### Backend
Open your terminal, navigate to the `backend` folder, and install the modules:
```bash
cd backend
npm install
```

#### Frontend
Open a new terminal window or tab, navigate to the `frontend` folder, and install the modules:
```bash
cd frontend
npm install
```

---

### Step 2: Configure Environment Variables

Create a `.env` file inside the `backend` directory based on the `.env.example` template:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/targetrank
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

---

### Step 3: Run the Application

#### Running the Backend Server
In the `backend/` directory, run the development script:
```bash
npm run dev
```
The server will start on `http://localhost:5000` (monitored by nodemon).

#### Running the Frontend Client
In the `frontend/` directory, run the Vite development script:
```bash
npm run dev
```
The client will start on `http://localhost:5173`. Any requests directed to `/api` will be proxied to the Express backend.

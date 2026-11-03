# SiteShelf

SiteShelf is a React and FastAPI app for keeping a personal collection of websites with live, in-app previews.

## Requirements

- Node.js and npm
- Python 3.10+
- MongoDB 7 or later, running locally or available through MongoDB Atlas

## Run locally

### Start MongoDB

For a local Docker database:

```powershell
docker run --name siteshelf-mongo -p 27017:27017 -d mongo:8
```

Or set `MONGODB_URI` to your MongoDB connection string.

### Backend

```powershell
cd backend

python -m venv .venv

.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

$env:APP_SECRET_KEY = "replace-this-with-a-long-random-secret"

$env:MONGODB_URI = "replace-this-with-the-mongo-connection-string"

uvicorn app.main:app --reload
```

Configure `MONGODB_URI` and `APP_SECRET_KEY` with environment variables as needed.

### Frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`). Vite proxies `/api` requests to FastAPI on port 8000.

Create an account, sign in, and add a website. The Justdial sample URL is available from the library page. Some websites disable iframe embedding; saved links remain available through the open-in-new-tab button.

## Run with MongoDB Atlas Cloud Storage

### Set the MONGO_URI

```powershell
python -m venv .venv

.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

$env:APP_SECRET_KEY = "replace-this-with-a-long-random-secret"

$env:MONGO_URI = "replace-this-with-the-mongo-connection-string"

uvicorn app.main:app --reload
```

The app should then launch with the Mongo Atlas connection configured and store all the user data inside the atlas database.

### Frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`). Vite proxies `/api` requests to FastAPI on port 8000.

Create an account, sign in, and add a website. The Justdial sample URL is available from the library page. Some websites disable iframe embedding; saved links remain available through the open-in-new-tab button.

## Project structure

```text
frontend/src/
    components/     Shared UI components
    contexts/       Authentication state
    lib/            Axios client and API functions
    pages/          Login and saved website pages

backend/app/
    api/            Routers and authentication dependencies
    core/           Configuration and security helpers
    db/             MongoDB client and indexes
    repositories/   MongoDB persistence
    schemas/        Request and response models
    services/       Authentication and URL business logic
```

## API

- `POST /api/auth/signup` — create an account
- `POST /api/auth/login` — sign in
- `GET /api/urls` — list the signed-in user's saved websites
- `POST /api/urls` — save a website URL and its preview URL
- `GET /api/health` — database health check

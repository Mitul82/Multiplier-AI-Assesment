# SiteShelf

SiteShelf is a React and FastAPI app for keeping a personal collection of websites with live, in-app previews.

## Run locally

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:APP_SECRET_KEY = "replace-this-with-a-long-random-secret"
uvicorn main:app --reload
```

The API creates `backend/data/siteshelf.db` on first run. Set `APP_SECRET_KEY` to a stable, private value so sign-in sessions remain valid across API restarts.

### Frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`). Vite proxies `/api` requests to the FastAPI server on port 8000.

Create an account, sign in, and add a website. The Justdial sample URL is available from the dashboard. Some websites disable iframe embedding; those saved links remain available through the open-in-new-tab button.

## API

- `POST /api/auth/signup` — create an account
- `POST /api/auth/login` — sign in
- `GET /api/urls` — list the signed-in user's saved websites
- `POST /api/urls` — save a website URL and its preview URL
- `GET /api/health` — health check

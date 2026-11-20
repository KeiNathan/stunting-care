from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, users, balita, prediksi, dashboard

# ── Buat semua tabel di database ──────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Inisialisasi FastAPI ───────────────────────────────────────
app = FastAPI(
    title       = "Stunting Detection API",
    description = "API Sistem Monitoring dan Deteksi Dini Risiko Stunting - Universitas Bunda Mulia",
    version     = "1.0.0",
)

# ── CORS — izinkan React frontend mengakses API ────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins    = ["http://localhost:3000", "http://localhost:5173", "http://stunting-care-frontend.vercel.app"],
    allow_credentials= True,
    allow_methods    = ["*"],
    allow_headers    = ["*"],
)

# ── Register semua router ─────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(balita.router)
app.include_router(prediksi.router)
app.include_router(dashboard.router)

@app.get("/")
def root():
    return {
        "message": "Stunting Detection API",
        "docs"   : "/docs",
        "status" : "running"
    }
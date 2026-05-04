# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Criminal Identification System",
    description="Blockchain-based biometric criminal identification",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.routers.enrollment     import router as enrollment_router
from backend.routers.identification import router as identification_router
from backend.routers.dashboard      import router as dashboard_router
from backend.routers.records        import router as records_router

app.include_router(enrollment_router)
app.include_router(identification_router)
app.include_router(dashboard_router)
app.include_router(records_router)

@app.get("/")
def root():
    return {
        "system" : "Criminal Identification System",
        "version": "2.0.0",
        "status" : "running",
        "docs"   : "/docs"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
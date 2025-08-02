from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, contacts, campaigns
from app.database import engine
from app.models import user, contact, campaign, analytics

# Create database tables
user.Base.metadata.create_all(bind=engine)
contact.Base.metadata.create_all(bind=engine)
campaign.Base.metadata.create_all(bind=engine)
analytics.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mailflow API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["contacts"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["campaigns"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Mailflow API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"} 
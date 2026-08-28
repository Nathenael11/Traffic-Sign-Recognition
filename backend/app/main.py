from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, SessionLocal
from .models import User, MentorProfile, Innovation, Grant, Comment
from .routers import auth, users, innovations, mentors
from .routers.auth import get_password_hash

# Create Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MInT Innovation Incubator Platform (IIP)",
    description="Full-stack ecosystem for Ministry of Innovation and Technology, Ethiopia",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev ease
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(innovations.router)
app.include_router(mentors.router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "project": "MInT IIP"}

# Seed default data on startup
def seed_data():
    db = SessionLocal()
    try:
        # Check if users already seeded
        if db.query(User).count() == 0:
            print("Seeding database with default users, mentors, innovations and grants...")

            # 1. Create Users
            admin = User(
                username="admin",
                email="admin@mint.gov.et",
                hashed_password=get_password_hash("admin123"),
                role="admin"
            )
            
            mentor1 = User(
                username="helen_t",
                email="helen.t@mint.gov.et",
                hashed_password=get_password_hash("mentor123"),
                role="mentor"
            )
            mentor2 = User(
                username="dawit_a",
                email="dawit.a@mint.gov.et",
                hashed_password=get_password_hash("mentor123"),
                role="mentor"
            )
            mentor3 = User(
                username="selam_k",
                email="selam.k@mint.gov.et",
                hashed_password=get_password_hash("mentor123"),
                role="mentor"
            )
            
            innovator1 = User(
                username="nathenael",
                email="nathenael@mint-interns.et",
                hashed_password=get_password_hash("innovator123"),
                role="innovator"
            )
            innovator2 = User(
                username="abdi_m",
                email="abdi@mint-interns.et",
                hashed_password=get_password_hash("innovator123"),
                role="innovator"
            )

            db.add_all([admin, mentor1, mentor2, mentor3, innovator1, innovator2])
            db.commit() # Commit to generate IDs

            # 2. Create Mentor Profiles
            mp1 = MentorProfile(
                user_id=mentor1.id,
                bio="Senior Software Architect & Startup Advisor. Ex-Google, based in Addis Ababa.",
                expertise="Software Engineering, AI, System Design",
                availability="Mon-Wed 2PM-5PM"
            )
            mp2 = MentorProfile(
                user_id=mentor2.id,
                bio="Agronomist & Agri-Tech Investor. 10+ years helping rural startups scale.",
                expertise="Agri-Tech, Business Models, Fundraising",
                availability="Tue-Thu 9AM-12PM"
            )
            mp3 = MentorProfile(
                user_id=mentor3.id,
                bio="Fintech Strategy Lead. Passionate about mobile payment integrations in East Africa.",
                expertise="Fintech, Mobile Money, Regulation",
                availability="Friday 10AM-4PM"
            )
            db.add_all([mp1, mp2, mp3])

            # 3. Create Innovations (Ideas)
            inn1 = Innovation(
                title="EcoIrrigate Ethiopia",
                description="An automated solar-powered drip irrigation controller built for smallholder farmers in Tigray and Oromia. Uses soil moisture sensors to regulate water distribution, saving 40% water.",
                category="Agri-Tech",
                problem_statement="Ethiopian farming relies heavily on unpredictable seasonal rainfall. Traditional irrigation is labor-intensive and leads to water wastage or crop drowning.",
                business_model="Selling localized hardware kits directly to farming cooperatives with government subsidization. Subscriptions for premium SMS weather alerts.",
                status="incubating",
                creator_id=innovator2.id,
                ai_feedback="AI SUGGESTION: Excellent concept targeting high-impact sector. Suggest incorporating local language voice alerts (USSD/SMS) for farmers without smartphones."
            )
            
            inn2 = Innovation(
                title="BirrFlow Wallet",
                description="A decentralized offline digital ledger and payment gateway allowing merchants in rural markets to execute transactions without internet connections, syncing when signal is found.",
                category="Fintech",
                problem_statement="Internet connection drops are frequent in rural Ethiopian markets, preventing standard digital payment wallets (like Telebirr) from functioning reliably.",
                business_model="Transaction fee of 0.5% capped at 10 ETB per local transaction. Free for buyers, minor charge for merchant withdrawals.",
                status="submitted",
                creator_id=innovator1.id,
                ai_feedback="AI SUGGESTION: Strong market potential. Recommend consulting with National Bank of Ethiopia sandbox team regarding offline e-money regulatory approvals."
            )
            db.add_all([inn1, inn2])
            db.commit()

            # 4. Create Comments
            com1 = Comment(
                innovation_id=inn1.id,
                author_id=mentor2.id,
                content="I've reviewed this layout. It's solid. We should link you with agricultural cooperatives in Oromia to run a live pilot in September.",
                rating=5
            )
            com2 = Comment(
                innovation_id=inn2.id,
                author_id=mentor3.id,
                content="Great idea addressing the connectivity gap. I recommend checking out Near-Field Communication (NFC) or bluetooth-based sync protocols for offline handshakes.",
                rating=4
            )
            db.add_all([com1, com2])

            # 5. Create Grants
            g1 = Grant(
                title="MInT National Innovation Grant 2026",
                description="A national funding initiative by the Ministry of Innovation and Technology to support tech startups developing minimum viable products in Agri-tech, Health-tech, and Edu-tech.",
                amount=250000.0,
                provider="Ministry of Innovation and Technology (MInT)",
                deadline="2026-10-30",
                status="open"
            )
            g2 = Grant(
                title="Ethio-Telecom Fintech Innovation Acceleration Fund",
                description="A special venture fund dedicated to supporting fintech startups building micro-insurance, micro-lending, and offline payment integrations atop the Telebirr API.",
                amount=500000.0,
                provider="Ethio Telecom & National Bank",
                deadline="2026-11-15",
                status="open"
            )
            g3 = Grant(
                title="UNESCO Digital Education Pioneer Award",
                description="International grant focused on expanding access to digital learning environments and tablets in secondary schools in East Africa.",
                amount=150000.0,
                provider="UNESCO & MInT Partnership",
                deadline="2026-12-01",
                status="open"
            )
            db.add_all([g1, g2, g3])
            
            db.commit()
            print("Database successfully seeded.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

seed_data()

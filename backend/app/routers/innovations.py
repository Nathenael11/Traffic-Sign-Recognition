from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from ..database import get_db
from ..models import User, Innovation, Comment
from ..schemas import (
    InnovationCreate, InnovationResponse, CommentCreate, CommentResponse,
    InnovationRefineRequest, InnovationRefineResponse
)
from .auth import get_current_user

router = APIRouter(
    prefix="/api/innovations",
    tags=["Innovations & Idea Hub"]
)

@router.get("/", response_model=List[InnovationResponse])
def get_innovations(db: Session = Depends(get_db)):
    innovations = db.query(Innovation).all()
    # Map comments and author names
    response_list = []
    for item in innovations:
        comments_list = []
        for c in item.comments:
            comments_list.append(
                CommentResponse(
                    id=c.id,
                    innovation_id=c.innovation_id,
                    author_id=c.author_id,
                    author_username=c.author.username,
                    content=c.content,
                    rating=c.rating,
                    created_at=c.created_at
                )
            )
        response_list.append(
            InnovationResponse(
                id=item.id,
                title=item.title,
                description=item.description,
                category=item.category,
                problem_statement=item.problem_statement,
                business_model=item.business_model,
                creator_id=item.creator_id,
                creator_username=item.creator.username,
                status=item.status,
                ai_feedback=item.ai_feedback,
                created_at=item.created_at,
                updated_at=item.updated_at,
                comments=comments_list
            )
        )
    return response_list

@router.post("/", response_model=InnovationResponse)
def create_innovation(
    innovation_in: InnovationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create the innovation
    db_innovation = Innovation(
        title=innovation_in.title,
        description=innovation_in.description,
        category=innovation_in.category,
        problem_statement=innovation_in.problem_statement,
        business_model=innovation_in.business_model,
        creator_id=current_user.id,
        status="submitted"
    )
    db.add(db_innovation)
    db.commit()
    db.refresh(db_innovation)

    # Convert to response
    return InnovationResponse(
        id=db_innovation.id,
        title=db_innovation.title,
        description=db_innovation.description,
        category=db_innovation.category,
        problem_statement=db_innovation.problem_statement,
        business_model=db_innovation.business_model,
        creator_id=db_innovation.creator_id,
        creator_username=current_user.username,
        status=db_innovation.status,
        ai_feedback=db_innovation.ai_feedback,
        created_at=db_innovation.created_at,
        updated_at=db_innovation.updated_at,
        comments=[]
    )

@router.get("/{id}", response_model=InnovationResponse)
def get_innovation_by_id(id: int, db: Session = Depends(get_db)):
    item = db.query(Innovation).filter(Innovation.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Innovation not found")
    
    comments_list = []
    for c in item.comments:
        comments_list.append(
            CommentResponse(
                id=c.id,
                innovation_id=c.innovation_id,
                author_id=c.author_id,
                author_username=c.author.username,
                content=c.content,
                rating=c.rating,
                created_at=c.created_at
            )
        )
    
    return InnovationResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        category=item.category,
        problem_statement=item.problem_statement,
        business_model=item.business_model,
        creator_id=item.creator_id,
        creator_username=item.creator.username,
        status=item.status,
        ai_feedback=item.ai_feedback,
        created_at=item.created_at,
        updated_at=item.updated_at,
        comments=comments_list
    )

@router.put("/{id}/status", response_model=InnovationResponse)
def update_innovation_status(
    id: int,
    status_in: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "mentor", "investor"]:
        raise HTTPException(status_code=403, detail="Only admins, mentors, or investors can change statuses")
    
    item = db.query(Innovation).filter(Innovation.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Innovation not found")
    
    valid_statuses = ["submitted", "reviewing", "incubating", "funded", "rejected"]
    if status_in not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
    
    item.status = status_in
    db.commit()
    db.refresh(item)

    comments_list = []
    for c in item.comments:
        comments_list.append(
            CommentResponse(
                id=c.id,
                innovation_id=c.innovation_id,
                author_id=c.author_id,
                author_username=c.author.username,
                content=c.content,
                rating=c.rating,
                created_at=c.created_at
            )
        )

    return InnovationResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        category=item.category,
        problem_statement=item.problem_statement,
        business_model=item.business_model,
        creator_id=item.creator_id,
        creator_username=item.creator.username,
        status=item.status,
        ai_feedback=item.ai_feedback,
        created_at=item.created_at,
        updated_at=item.updated_at,
        comments=comments_list
    )

@router.post("/{id}/comments", response_model=CommentResponse)
def add_comment(
    id: int,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Innovation).filter(Innovation.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Innovation not found")
    
    comment = Comment(
        innovation_id=id,
        author_id=current_user.id,
        content=comment_in.content,
        rating=comment_in.rating
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id,
        innovation_id=comment.innovation_id,
        author_id=comment.author_id,
        author_username=current_user.username,
        content=comment.content,
        rating=comment.rating,
        created_at=comment.created_at
    )

@router.post("/refine", response_model=InnovationRefineResponse)
def refine_innovation(
    req: InnovationRefineRequest,
    current_user: User = Depends(get_current_user)
):
    text = req.description.lower()
    
    # Simple simulated intelligence based on keywords
    if "farm" in text or "crop" in text or "irrigation" in text or "agri" in text or "soil" in text:
        title = req.title if req.title else "AgriGrow Ethiopia"
        category = "Agri-Tech"
        keywords = ["Agriculture", "Irrigation", "IoT", "Crop Yield", "Farmers"]
        description = (
            "An intelligent IoT-enabled farming helper designed for rural Ethiopian farmers. "
            "It collects real-time soil data, predicts crop growth patterns, and schedules automated "
            "irrigation to double crop productivity using minimal resources."
        )
        features = [
            "Low-cost soil moisture sensor integrations",
            "USSD and Voice SMS notifications in Amharic & Oromiffa",
            "AI-powered disease classification from simple phone pictures",
            "Cooperative market linkage connecting farmers directly to wholesale buyers"
        ]
        potential = (
            "High. Agriculture accounts for over 30% of Ethiopia's GDP and employs over 70% of the workforce. "
            "Even a 5% improvement in crop yield can yield millions in economic impact."
        )
    elif "pay" in text or "bank" in text or "wallet" in text or "money" in text or "finance" in text or "loan" in text:
        title = req.title if req.title else "BirrGate wallet"
        category = "Fintech"
        keywords = ["Mobile Money", "Micro-loans", "Financial Inclusion", "Birr", "Digital Banking"]
        description = (
            "A seamless decentralized financial gateway enabling micro-merchants and unbanked "
            "populations in Ethiopia to accept peer-to-peer mobile payments, build credit scores, "
            "and access fast collateral-free micro-loans."
        )
        features = [
            "QR-code based micro-payments compatible with feature phones",
            "Alternative credit scoring using mobile airtime top-ups and sales velocity",
            "Automatic savings circles (Simulated Equb) digital dashboard",
            "Localized merchant API integrations for Telegram stores and e-commerce"
        ]
        potential = (
            "Extremely High. Driven by Ethiopia's National Digital Payments Strategy and Telebirr growth, "
            "digital credit and small business financing remain highly underserved segments."
        )
    elif "health" in text or "doctor" in text or "clinic" in text or "medical" in text or "patient" in text:
        title = req.title if req.title else "TenaConnect Ethiopia"
        category = "Health-Tech"
        keywords = ["Telemedicine", "Rural Health", "Diagnostics", "EHR", "Healthcare Access"]
        description = (
            "A decentralized digital health network connecting remote healthcare clinics in rural Ethiopia "
            "with city doctors for fast video consultation, prescription dispatching, and standardized electronic health records."
        )
        features = [
            "Offline-first sync capabilities for clinics with low internet connection",
            "AI-assisted triage chatbot for preliminary symptom assessments in Amharic",
            "Digital prescription routing to the nearest partner pharmacy",
            "Solar-powered portable diagnostic kit linkage (temperature, BP, pulse)"
        ]
        potential = (
            "Very High. Addresses the critical shortage of specialist doctors in remote regions, "
            "leveraging Ethiopia's growing telecom backbone to democratize clinical consultation."
        )
    else:
        title = req.title if req.title else "Ethiopia Innovate Hub"
        category = "General"
        keywords = ["Innovation", "Collaboration", "Startups", "Ethiopia", "Digitalization"]
        description = (
            f"A modern digital ecosystem designed to scale: {req.description[:100]}... "
            "Our AI system has enhanced this concept to focus on open-source digital infrastructure "
            "and micro-services for local communities."
        )
        features = [
            "User-submitted modular architecture",
            "Decentralized peer-to-peer database sync",
            "Built-in localization support for multiple Ethiopian regional languages",
            "Integrated token reward mechanisms to incentivize community contributions"
        ]
        potential = (
            "Moderate to High. Fosters civic engagement and technological capability in secondary "
            "and tertiary educational institutions across the nation."
        )
        
    return InnovationRefineResponse(
        refined_title=title,
        refined_description=description,
        category=category,
        extracted_keywords=keywords,
        suggested_features=features,
        market_potential=potential
    )

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, MentorProfile, Grant, Application, Innovation
from ..schemas import (
    MentorResponse, MentorProfileBase, MentorProfileResponse,
    GrantResponse, ApplicationResponse, ApplicationCreate
)
from .auth import get_current_user

router = APIRouter(
    prefix="/api/mentors",
    tags=["Mentors & Funding Network"]
)

# --- Mentors ---

@router.get("/", response_model=List[MentorResponse])
def list_mentors(db: Session = Depends(get_db)):
    mentors = db.query(User).filter(User.role == "mentor").all()
    return mentors

@router.post("/profile", response_model=MentorProfileResponse)
def update_mentor_profile(
    profile_in: MentorProfileBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can update their mentor profile")
    
    profile = db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    if not profile:
        profile = MentorProfile(user_id=current_user.id)
        db.add(profile)
        
    if profile_in.bio is not None:
        profile.bio = profile_in.bio
    if profile_in.expertise is not None:
        profile.expertise = profile_in.expertise
    if profile_in.availability is not None:
        profile.availability = profile_in.availability
        
    db.commit()
    db.refresh(profile)
    return profile


# --- Grants & Funding Network ---

@router.get("/grants", response_model=List[GrantResponse])
def get_grants(db: Session = Depends(get_db)):
    grants = db.query(Grant).all()
    return grants

@router.post("/grants", response_model=GrantResponse)
def create_grant(
    grant_title: str,
    grant_desc: str,
    amount: float,
    provider: str,
    deadline: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create grants")
    
    grant = Grant(
        title=grant_title,
        description=grant_desc,
        amount=amount,
        provider=provider,
        deadline=deadline,
        status="open"
    )
    db.add(grant)
    db.commit()
    db.refresh(grant)
    return grant

@router.get("/grants/applications", response_model=List[ApplicationResponse])
def get_grant_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        applications = db.query(Application).all()
    else:
        applications = db.query(Application).filter(Application.user_id == current_user.id).all()
        
    response_list = []
    for app in applications:
        response_list.append(
            ApplicationResponse(
                id=app.id,
                grant_id=app.grant_id,
                innovation_id=app.innovation_id,
                user_id=app.user_id,
                status=app.status,
                created_at=app.created_at,
                grant_title=app.grant.title,
                innovation_title=app.innovation.title
            )
        )
    return response_list

@router.post("/grants/apply", response_model=ApplicationResponse)
def apply_for_grant(
    app_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify grant exists
    grant = db.query(Grant).filter(Grant.id == app_in.grant_id).first()
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found")
        
    # Verify innovation exists and belongs to user (or user is admin)
    innovation = db.query(Innovation).filter(Innovation.id == app_in.innovation_id).first()
    if not innovation:
        raise HTTPException(status_code=404, detail="Innovation not found")
    if innovation.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only apply with your own innovation")

    # Check if application already exists
    existing = db.query(Application).filter(
        Application.grant_id == app_in.grant_id,
        Application.innovation_id == app_in.innovation_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Application already submitted for this grant and innovation")
        
    app = Application(
        grant_id=app_in.grant_id,
        user_id=current_user.id,
        innovation_id=app_in.innovation_id,
        status="applied"
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    
    return ApplicationResponse(
        id=app.id,
        grant_id=app.grant_id,
        innovation_id=app.innovation_id,
        user_id=app.user_id,
        status=app.status,
        created_at=app.created_at,
        grant_title=grant.title,
        innovation_title=innovation.title
    )

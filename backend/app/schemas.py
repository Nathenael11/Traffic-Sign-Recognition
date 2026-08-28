from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str # innovator, mentor, investor, admin

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Mentor Schemas ---
class MentorProfileBase(BaseModel):
    bio: Optional[str] = None
    expertise: Optional[str] = None
    availability: Optional[str] = None

class MentorProfileCreate(MentorProfileBase):
    pass

class MentorProfileResponse(MentorProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class MentorResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    mentor_profile: Optional[MentorProfileResponse] = None

    class Config:
        from_attributes = True


# --- Comment Schemas ---
class CommentBase(BaseModel):
    content: str
    rating: Optional[int] = None

class CommentCreate(CommentBase):
    pass

class CommentResponse(CommentBase):
    id: int
    innovation_id: int
    author_id: int
    author_username: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Innovation Schemas ---
class InnovationBase(BaseModel):
    title: str
    description: str
    category: str
    problem_statement: Optional[str] = None
    business_model: Optional[str] = None

class InnovationCreate(InnovationBase):
    pass

class InnovationResponse(InnovationBase):
    id: int
    creator_id: int
    creator_username: str
    status: str # submitted, reviewing, incubating, funded, rejected
    ai_feedback: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    comments: List[CommentResponse] = []

    class Config:
        from_attributes = True

class InnovationRefineRequest(BaseModel):
    description: str
    title: Optional[str] = None

class InnovationRefineResponse(BaseModel):
    refined_title: str
    refined_description: str
    category: str
    extracted_keywords: List[str]
    suggested_features: List[str]
    market_potential: str


# --- Grant Schemas ---
class GrantBase(BaseModel):
    title: str
    description: str
    amount: float
    provider: str
    deadline: str
    status: str

class GrantResponse(GrantBase):
    id: int

    class Config:
        from_attributes = True


# --- Application Schemas ---
class ApplicationBase(BaseModel):
    grant_id: int
    innovation_id: int

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationResponse(BaseModel):
    id: int
    grant_id: int
    innovation_id: int
    user_id: int
    status: str
    created_at: datetime
    grant_title: str
    innovation_title: str

    class Config:
        from_attributes = True

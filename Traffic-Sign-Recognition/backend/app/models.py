import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="innovator") # innovator, mentor, investor, admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    innovations = relationship("Innovation", back_populates="creator")
    comments_written = relationship("Comment", back_populates="author")
    applications = relationship("Application", back_populates="user")
    mentor_profile = relationship("MentorProfile", back_populates="user", uselist=False)


class Innovation(Base):
    __tablename__ = "innovations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, default="General") # Agri-Tech, Health-Tech, Fintech, Edu-Tech, General
    problem_statement = Column(Text, nullable=True)
    business_model = Column(Text, nullable=True)
    status = Column(String, default="submitted") # submitted, reviewing, incubating, funded, rejected
    creator_id = Column(Integer, ForeignKey("users.id"))
    ai_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    creator = relationship("User", back_populates="innovations")
    comments = relationship("Comment", back_populates="innovation", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="innovation", cascade="all, delete-orphan")


class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    bio = Column(Text, nullable=True)
    expertise = Column(String, nullable=True) # comma separated values e.g., "AI, Web Development, Agriculture"
    availability = Column(String, default="Mon-Fri 9AM-5PM")

    user = relationship("User", back_populates="mentor_profile")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    innovation_id = Column(Integer, ForeignKey("innovations.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True) # 1-5 rating if applicable
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    innovation = relationship("Innovation", back_populates="comments")
    author = relationship("User", back_populates="comments_written")


class Grant(Base):
    __tablename__ = "grants"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(Float, nullable=False)
    provider = Column(String, nullable=False)
    deadline = Column(String, nullable=False) # e.g. "2026-12-31"
    status = Column(String, default="open") # open, closed

    applications = relationship("Application", back_populates="grant", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    grant_id = Column(Integer, ForeignKey("grants.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    innovation_id = Column(Integer, ForeignKey("innovations.id"), nullable=False)
    status = Column(String, default="applied") # applied, under_review, approved, rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    grant = relationship("Grant", back_populates="applications")
    user = relationship("User", back_populates="applications")
    innovation = relationship("Innovation", back_populates="applications")

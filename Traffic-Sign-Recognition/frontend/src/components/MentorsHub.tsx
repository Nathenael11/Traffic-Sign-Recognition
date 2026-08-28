import React, { useEffect, useState } from "react";
import { api } from "../utils/api";

export const MentorsHub: React.FC = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Book Consultation States
  const [bookingMentor, setBookingMentor] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingTopic, setBookingTopic] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Edit profile states (for Mentors only)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [availability, setAvailability] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const userRole = api.getCurrentUserRole();
  const username = api.getCurrentUsername();

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const data = await api.getMentors();
      setMentors(data);
      
      // If current user is a mentor, pre-fill their edit form states
      if (userRole === "mentor") {
        const me = data.find((m: any) => m.username === username);
        if (me && me.mentor_profile) {
          setBio(me.mentor_profile.bio || "");
          setExpertise(me.mentor_profile.expertise || "");
          setAvailability(me.mentor_profile.availability || "");
        }
      }
    } catch (e) {
      console.error("Error fetching mentors", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const handleBookSession = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setBookingMentor(null);
      setBookingDate("");
      setBookingTime("");
      setBookingTopic("");
    }, 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    try {
      await api.updateMentorProfile({ bio, expertise, availability });
      setSaveSuccess(true);
      fetchMentors();
      setTimeout(() => {
        setIsEditingProfile(false);
        setSaveSuccess(false);
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to update profile.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "2rem", color: "var(--primary)" }}>Mentorship Hub</h2>
          <p style={{ color: "var(--text-muted)" }}>Connect with industry experts, tech advisors, and venture partners.</p>
        </div>
        {userRole === "mentor" && (
          <button className="btn btn-outline" onClick={() => setIsEditingProfile(true)}>
            Edit Mentor Credentials
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>Loading mentors...</div>
      ) : (
        <div className="grid-3">
          {mentors.map((mentor) => {
            const profile = mentor.mentor_profile || {};
            const expTags = profile.expertise ? profile.expertise.split(",") : ["Tech Advisor"];

            return (
              <div key={mentor.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{
                      height: "50px", width: "50px", borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                      color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: "bold", fontSize: "1.25rem"
                    }}>
                      {mentor.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", color: "var(--primary)" }}>{mentor.username}</h3>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{mentor.email}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "var(--text-main)", marginBottom: "1rem", minHeight: "60px" }}>
                    {profile.bio || "MInT innovation advisor. Mentoring Ethiopian startups to turn prototypes into businesses."}
                  </p>

                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Expertise</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                      {expTags.map((tag: string) => (
                        <span key={tag} className="keyword-tag" style={{ margin: 0, fontSize: "0.7rem", padding: "0.1rem 0.4rem" }}>
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    🗓️ **Availability**: {profile.availability || "Mon-Fri 9AM-5PM"}
                  </div>
                </div>

                {userRole === "innovator" && (
                  <button
                    className="btn btn-accent"
                    style={{ width: "100%", color: "#000000", fontSize: "0.85rem" }}
                    onClick={() => setBookingMentor(mentor)}
                  >
                    Request Consultation
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Book Consultation Modal */}
      {bookingMentor && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: "450px", width: "100%", padding: "2rem" }}>
            <h3>Request Consultation</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Scheduling 1-on-1 video call with **{bookingMentor.username}**
            </p>

            {bookingSuccess ? (
              <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--success)", padding: "1rem", borderRadius: "var(--radius-md)", textAlign: "center", fontSize: "0.9rem" }}>
                🎉 **Booking Successful!**<br />
                Invitation sent to {bookingMentor.email}.<br />
                MInT Google Meet link attached to calendar.
              </div>
            ) : (
              <form onSubmit={handleBookSession}>
                <div className="form-group">
                  <label>Select Date</label>
                  <input type="date" className="form-control" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Select Time Slot</label>
                  <select className="form-control" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} required style={{ background: "var(--bg-app)", color: "var(--text-main)" }}>
                    <option value="">Choose timeslot...</option>
                    <option value="09:00 - 10:00 AM">09:00 - 10:00 AM</option>
                    <option value="11:00 - 12:00 PM">11:00 - 12:00 PM</option>
                    <option value="02:00 - 03:00 PM">02:00 - 03:00 PM</option>
                    <option value="04:00 - 05:00 PM">04:00 - 05:00 PM</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discussion Topic / Questions</label>
                  <textarea rows={3} className="form-control" placeholder="Outline what you want to discuss (e.g. feedback on AgriGrow prototype architecture)..." value={bookingTopic} onChange={(e) => setBookingTopic(e.target.value)} required></textarea>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setBookingMentor(null)}>Cancel</button>
                  <button type="submit" className="btn btn-accent" style={{ flex: 1, color: "#000000" }}>Confirm Request</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Credentials Modal */}
      {isEditingProfile && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: "500px", width: "100%", padding: "2rem" }}>
            <h3>Edit Mentor Profile</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Configure details shown to startups seeking consultation.
            </p>

            {saveSuccess ? (
              <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--success)", padding: "1rem", borderRadius: "var(--radius-md)", textAlign: "center", fontSize: "0.9rem" }}>
                ✔️ **Profile details saved successfully!**
              </div>
            ) : (
              <form onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label>Short Bio</label>
                  <textarea rows={3} className="form-control" placeholder="Briefly describe your experience and advisory role..." value={bio} onChange={(e) => setBio(e.target.value)} required></textarea>
                </div>
                <div className="form-group">
                  <label>Expertise Areas (comma separated)</label>
                  <input type="text" className="form-control" placeholder="e.g. Software, Finance, Business strategy" value={expertise} onChange={(e) => setExpertise(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Availability Slots</label>
                  <input type="text" className="form-control" placeholder="e.g. Tue-Thu 2PM-5PM" value={availability} onChange={(e) => setAvailability(e.target.value)} required />
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsEditingProfile(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

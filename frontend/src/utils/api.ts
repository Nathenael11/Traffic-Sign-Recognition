const API_BASE_URL = "http://localhost:8000";

interface RequestOptions extends RequestInit {
  bodyData?: any;
}

async function apiCall(endpoint: string, options: RequestOptions = {}) {
  const token = localStorage.getItem("mint_token");
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (options.bodyData && !(options.bodyData instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.bodyData);
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  // Auth
  async login(usernameOrEmail: string, password: string) {
    const res = await apiCall("/api/auth/login", {
      method: "POST",
      bodyData: { username_or_email: usernameOrEmail, password },
    });
    if (res.access_token) {
      localStorage.setItem("mint_token", res.access_token);
      // Decode user role (simple client side decode)
      try {
        const payload = JSON.parse(atob(res.access_token.split(".")[1]));
        localStorage.setItem("mint_username", payload.sub);
        localStorage.setItem("mint_role", payload.role);
      } catch (e) {
        console.error("Error decoding token", e);
      }
    }
    return res;
  },

  register(username: string, email: string, role: string, password: string) {
    return apiCall("/api/auth/register", {
      method: "POST",
      bodyData: { username, email, role, password },
    });
  },

  logout() {
    localStorage.removeItem("mint_token");
    localStorage.removeItem("mint_username");
    localStorage.removeItem("mint_role");
  },

  isAuthenticated() {
    return !!localStorage.getItem("mint_token");
  },

  getCurrentUserRole() {
    return localStorage.getItem("mint_role") || "innovator";
  },

  getCurrentUsername() {
    return localStorage.getItem("mint_username") || "";
  },

  // Innovations
  getInnovations() {
    return apiCall("/api/innovations/");
  },

  getInnovation(id: number) {
    return apiCall(`/api/innovations/${id}`);
  },

  createInnovation(data: { title: string; description: string; category: string; problem_statement?: string; business_model?: string }) {
    return apiCall("/api/innovations/", {
      method: "POST",
      bodyData: data,
    });
  },

  refineInnovation(description: string, title?: string) {
    return apiCall("/api/innovations/refine", {
      method: "POST",
      bodyData: { description, title },
    });
  },

  updateInnovationStatus(id: number, status: string) {
    return apiCall(`/api/innovations/${id}/status?status_in=${status}`, {
      method: "PUT"
    });
  },

  addComment(id: number, content: string, rating?: number) {
    return apiCall(`/api/innovations/${id}/comments`, {
      method: "POST",
      bodyData: { content, rating },
    });
  },

  // Mentors
  getMentors() {
    return apiCall("/api/mentors/");
  },

  updateMentorProfile(data: { bio?: string; expertise?: string; availability?: string }) {
    return apiCall("/api/mentors/profile", {
      method: "POST",
      bodyData: data,
    });
  },

  // Funding
  getGrants() {
    return apiCall("/api/mentors/grants");
  },

  getGrantApplications() {
    return apiCall("/api/mentors/grants/applications");
  },

  applyForGrant(grantId: number, innovationId: number) {
    return apiCall("/api/mentors/grants/apply", {
      method: "POST",
      bodyData: { grant_id: grantId, innovation_id: innovationId },
    });
  }
};

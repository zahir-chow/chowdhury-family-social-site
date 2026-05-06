const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export function getStoredTokens() {
  try {
    return JSON.parse(localStorage.getItem("chowdhury-auth") || "null");
  } catch {
    return null;
  }
}

export function storeTokens(tokens) {
  localStorage.setItem("chowdhury-auth", JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem("chowdhury-auth");
}

async function request(path, options = {}) {
  const tokens = getStoredTokens();
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (tokens?.access && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${tokens.access}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.detail || "Request failed.");
    err.status = response.status;
    throw err;
  }
  return data;
}

export async function login(email, password) {
  return request("/auth/token/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email, displayName, password, gender = "other") {
  return request("/users/register/", {
    method: "POST",
    body: JSON.stringify({ email, display_name: displayName, password, gender }),
  });
}

export async function changePassword(oldPassword, newPassword) {
  return request("/users/change-password/", {
    method: "POST",
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
}

export async function fetchMe() {
  return request("/users/me/");
}

export async function updateMe(formData) {
  return request("/users/me/", {
    method: "PATCH",
    body: formData,
    headers: {},
  });
}

export async function fetchDirectory(page = 1) {
  return request(`/users/directory/?page=${page}`);
}

export async function fetchUser(userId) {
  return request(`/users/${userId}/`);
}

export async function fetchRelationships(userId) {
  return request(`/relationships/user/${userId}/`);
}

export async function createRelationship(payload) {
  return request("/relationships/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRelationship(relationshipId, payload) {
  return request(`/relationships/${relationshipId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteRelationship(relationshipId) {
  return request(`/relationships/${relationshipId}/`, {
    method: "DELETE",
  });
}

export async function fetchFeed(page = 1) {
  return request(`/social/posts/?page=${page}`);
}

export async function createPost(formData) {
  return request("/social/posts/", {
    method: "POST",
    body: formData,
    headers: {},
  });
}

export async function deletePost(postId) {
  return request(`/social/posts/${postId}/`, {
    method: "DELETE",
  });
}

export async function fetchComments(postId, page = 1) {
  return request(`/social/posts/${postId}/comments/?page=${page}`);
}

export async function addComment(postId, body, parentId = null) {
  return request(`/social/posts/${postId}/comments/`, {
    method: "POST",
    body: JSON.stringify({ body, parent_id: parentId }),
  });
}

export async function deleteComment(commentId) {
  return request(`/social/comments/${commentId}/`, {
    method: "DELETE",
  });
}

export async function reactToPost(postId, reactionType) {
  return request(`/social/posts/${postId}/reaction/`, {
    method: "POST",
    body: JSON.stringify({ reaction_type: reactionType }),
  });
}

export async function removeReaction(postId) {
  return request(`/social/posts/${postId}/reaction/`, {
    method: "DELETE",
  });
}

export async function fetchModerationMembers(page = 1) {
  return request(`/users/members/?page=${page}`);
}

export async function updateMemberStatus(userId, isActive) {
  return request(`/users/members/${userId}/status/`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
}

export function resolveBackendUrl(value) {
  if (!value) {
    return "";
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (value.startsWith("/")) {
    return `${API_ORIGIN}${value}`;
  }
  return value;
}

export { API_BASE_URL, API_ORIGIN };

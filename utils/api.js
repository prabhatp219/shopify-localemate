// Custom request wrapper using native window.fetch so that Shopify App Bridge
// can intercept the requests and automatically inject the OAuth session token.
async function request(url, options = {}) {
  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`/app/api${url}`, config);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// ─── CAMPAIGN APIs ─────────────────────────────────────────────────────────────

export async function generateCampaign(payload) {
  return request("/campaigns", {
    method: "POST",
    body: { actionType: "generate", ...payload },
  });
}

export async function getCampaigns() {
  return request("/campaigns", { method: "GET" });
}

export async function getCampaignById(id) {
  return request(`/campaigns?id=${id}`, { method: "GET" });
}

export async function deleteCampaign(id) {
  return request("/campaigns", {
    method: "POST",
    body: { actionType: "delete", id },
  });
}

// ─── SUGGESTION APIs ───────────────────────────────────────────────────────────

// Fetch all saved suggestions
export async function getSuggestions() {
  return request("/suggestions", { method: "GET" });
}

// Generate a new AI suggestion and save it
export async function generateSuggestion(market, currentHeadline, currentDetail = "") {
  return request("/suggestions", {
    method: "POST",
    body: {
      actionType: "generate",
      market,
      currentHeadline,
      currentDetail,
    },
  });
}

// Mark a suggestion as applied
export async function applySuggestion(id) {
  return request("/suggestions", {
    method: "POST",
    body: { actionType: "apply", id },
  });
}

// Mark a suggestion as under review
export async function reviewSuggestion(id) {
  return request("/suggestions", {
    method: "POST",
    body: { actionType: "review", id },
  });
}

// Regenerate AI suggestion for an existing entry
export async function regenerateSuggestion(id) {
  return request("/suggestions", {
    method: "POST",
    body: { actionType: "regenerate", id },
  });
}

// Apply all pending suggestions at once
export async function applyAllSuggestions() {
  return request("/suggestions", {
    method: "POST",
    body: { actionType: "apply-all" },
  });
}

// Delete a suggestion by id
export async function deleteSuggestion(id) {
  return request("/suggestions", {
    method: "POST",
    body: { actionType: "delete", id },
  });
}


export default request;


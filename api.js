// ----------------------------
//  FRONTEND ↔ BACKEND API LINK
// ----------------------------

// 🧩 Replace this with your deployed Apps Script URL (the one ending with /exec)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx1234567890abcdEFGH/exec";

// --- 🔐 USER SESSION MANAGEMENT ---

// Store or prompt user email if Google session is not returned
function getUserEmail() {
  let userEmail = localStorage.getItem("userEmail");
  if (!userEmail) {
    userEmail = prompt("Please enter your email address to continue:");
    if (userEmail) localStorage.setItem("userEmail", userEmail);
  }
  return userEmail || "anonymous@unknown.com";
}

// --- 🌐 UNIVERSAL API CALLER ---

async function callApi(action, payload = {}, method = "POST") {
  const userEmail = getUserEmail();
  document.getElementById("loader").style.display = "block";

  try {
    let response;

    if (method === "GET") {
      const url = new URL(APPS_SCRIPT_URL);
      url.searchParams.append("action", action);
      url.searchParams.append("email", userEmail);
      response = await fetch(url, { redirect: "follow" });
    } else {
      response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload, email: userEmail }),
      });
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "API call failed");
    }

    return result;
  } catch (error) {
    console.error(`API Error (${action}):`, error);
    alert(`Error: ${error.message}`);
    throw error;
  } finally {
    document.getElementById("loader").style.display = "none";
  }
}

// --- 🚀 INITIAL APP BOOTSTRAP ---

async function initializeApp() {
  try {
    const { data: user } = await callApi("getUserInfo", {}, "GET");

    document.getElementById("currentUser").textContent = user.name || "Guest User";

    if (user.isAdmin) {
      document.querySelector(".admin-tab")?.classList.remove("hidden");
      loadAdminData();
    }

    setupEventListeners();
    setupTabNavigation();
    await Promise.all([updateDashboard(), updateGoals(), loadTeamViewData()]);

    document.getElementById("app").classList.remove("hidden");
  } catch (error) {
    console.warn("User not identified. Using fallback mode.");
    document.getElementById("currentUser").textContent = "Not Logged In";
  }
}

// --- 🧭 UTILITY: TAB & EVENT HOOKS (to avoid missing refs) ---

function setupEventListeners() {
  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const action = e.target.getAttribute("data-action");
      if (action === "clockIn") {
        await callApi("clockInOut", { status: "Clocked In" });
        alert("Clocked In!");
      } else if (action === "clockOut") {
        await callApi("clockInOut", { status: "Clocked Out" });
        alert("Clocked Out!");
      }
    });
  });
}

function setupTabNavigation() {
  const tabs = document.querySelectorAll(".tab");
  const sections = document.querySelectorAll(".section");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      sections.forEach((sec) => sec.classList.add("hidden"));
      document.getElementById(target).classList.remove("hidden");
    });
  });
}

// --- 📊 DASHBOARD / GOALS / TEAM LOADERS ---

async function updateDashboard() {
  const { data } = await callApi("submitMetrics", {}, "GET");
  // you can display metrics here if you wish
}

async function updateGoals() {
  const { data } = await callApi("getGoals", {}, "GET");
  const list = document.getElementById("goalsList");
  if (list) {
    list.innerHTML = "";
    data.forEach((g) => {
      const item = document.createElement("li");
      item.textContent = `${g.goal} - ${g.progress}%`;
      list.appendChild(item);
    });
  }
}

async function loadTeamViewData() {
  const { data } = await callApi("getTeamData", {}, "GET");
  const container = document.getElementById("teamContainer");
  if (container) {
    container.innerHTML = "";
    data.forEach((member) => {
      const div = document.createElement("div");
      div.className = "team-member";
      div.innerHTML = `<strong>${member.name}</strong><br>${member.role} - ${member.status}`;
      container.appendChild(div);
    });
  }
}

// --- 🧩 ADMIN DATA ---
async function loadAdminData() {
  const data = await callApi("getTeamData", {}, "GET");
  console.log("Admin loaded team data:", data);
}

// --- 🚀 Initialize App on Load ---
window.addEventListener("DOMContentLoaded", initializeApp);

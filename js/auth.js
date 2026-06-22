// =============================================
// auth.js - Estado de autenticacao do frontend
// =============================================

import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "./services.js";

let currentUser = null;

export function isAuthenticated() {
  return Boolean(currentUser);
}

export function getAuthenticatedUser() {
  return currentUser;
}

export async function restoreSession() {
  try {
    const response = await getCurrentUser();
    currentUser = response.user;
    return currentUser;
  } catch {
    currentUser = null;
    return null;
  }
}

export async function loginUser(identifier, password) {
  const response = await loginRequest(identifier, password);
  currentUser = response.user;
  return currentUser;
}

export async function logoutUser() {
  try {
    await logoutRequest();
  } finally {
    currentUser = null;
  }
}

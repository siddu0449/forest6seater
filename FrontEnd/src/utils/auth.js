export const isLoggedIn = () => {
  return localStorage.getItem("isLoggedIn") === "true";
};

export const logout = () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("username");
};

// validation.js

function validateName(name) {
  if (!name) return false;

  // Kamida 3 ta harf bo‘lsin
  if (name.trim().length < 3) return false;

  return true;
}

function validatePhone(phone) {
  const phoneRegex = /^\+998\d{9}$/; 
  return phoneRegex.test(phone);
}

module.exports = {
  validateName,
  validatePhone
};
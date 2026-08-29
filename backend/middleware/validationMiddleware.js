const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const VALID_ROLES = ['admin', 'mentor', 'aspirant'];

/**
 * validateRegister - Validates registration request body
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long.');
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push('A valid email address is required.');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  if (role && !VALID_ROLES.includes(role)) {
    errors.push(`Role must be one of: ${VALID_ROLES.join(', ')}.`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(' ') });
  }

  next();
};

/**
 * validateLogin - Validates login request body
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push('A valid email address is required.');
  }

  if (!password || password.length < 1) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(' ') });
  }

  next();
};

/**
 * validateProfileUpdate - Validates profile update fields
 */
export const validateProfileUpdate = (req, res, next) => {
  const { name, password, phone } = req.body;
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.push('Name must be at least 2 characters long.');
  }

  if (password !== undefined && password.length < 6) {
    errors.push('New password must be at least 6 characters long.');
  }

  if (phone !== undefined && phone !== '' && !/^[0-9+\-\s()]{7,15}$/.test(phone)) {
    errors.push('Please provide a valid phone number.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(' ') });
  }

  next();
};

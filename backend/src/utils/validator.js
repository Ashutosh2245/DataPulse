/**
 * Input validation helpers for DataPulse backend.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json'];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const validateRegister = ({ name, email, password }) => {
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return 'Name is required and must be at least 2 characters.';
  }
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return 'A valid email address is required.';
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return 'Password is required and must be at least 6 characters.';
  }
  return null;
};

const validateLogin = ({ email, password }) => {
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return 'Valid email is required.';
  }
  if (!password || typeof password !== 'string' || password.length === 0) {
    return 'Password is required.';
  }
  return null;
};

const validateFileUpload = (file) => {
  if (!file) {
    return 'No file uploaded. Please provide a dataset file.';
  }

  const filename = file.originalname.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => filename.endsWith(ext));
  if (!hasValidExt) {
    return `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(', ')} files are supported.`;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File size exceeds maximum allowed limit of 20MB.';
  }

  return null;
};

module.exports = {
  validateRegister,
  validateLogin,
  validateFileUpload,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
};

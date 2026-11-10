/**
 * Validates password complexity requirements for Firebase Auth updates.
 */
export const validatePasswordRequirements = (
  password: string,
  confirmPassword?: string
): string[] => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Yeni şifre en az 6 karakter uzunluğunda olmalıdır.');
  }
  if (!/[A-ZÇĞİÖŞÜ]/.test(password)) {
    errors.push('Şifre en az 1 büyük harf içermelidir.');
  }
  if (!/[a-zçğıöşü]/.test(password)) {
    errors.push('Şifre en az 1 küçük harf içermelidir.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Şifre en az 1 rakam içermelidir.');
  }
  if (!/[^A-Za-z0-9ÇĞİÖŞÜçğıöşü\s]/.test(password)) {
    errors.push('Şifre en az 1 özel karakter (sembol, örn: !@#$%.*) içermelidir.');
  }
  if (confirmPassword !== undefined && confirmPassword.length > 0 && password !== confirmPassword) {
    errors.push('Girilen şifreler birbiriyle eşleşmiyor.');
  }

  return errors;
};

function generateRandomCode(length: number = 6): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return code;
}

const generateVerificationToken = (length: number = 6): string => {
  // Ensure length is at least 1
  if (length < 1) {
    throw new Error("Length must be at least 1");
  }

  const min = Math.pow(10, length - 1); // Minimum number based on length (e.g., 100000 for length 6)
  const max = Math.pow(10, length) - 1; // Maximum number based on length (e.g., 999999 for length 6)

  // Generate a random number between min and max (inclusive)
  const randomNumber = Math.floor(min + Math.random() * (max - min + 1));

  // Convert the number to a string and return
  return randomNumber.toString();
};

const generatePassword = (length: number = 12) => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

export { generateRandomCode, generateVerificationToken, generatePassword };

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SERVE_AD_DIR = path.join(__dirname, "serve_ad");

// Ensure the directory exists
if (!fs.existsSync(SERVE_AD_DIR)) {
  fs.mkdirSync(SERVE_AD_DIR);
}

// Secret key (32 bytes) for AES-256-GCM
const SECRET_KEY = Buffer.from("12345678901234567890123456789012", "utf-8");

// Encrypt function - saves encrypted script as a file
function encrypt(data) {
  const iv = crypto.randomBytes(12); // 12-byte IV for AES-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", SECRET_KEY, iv);

  let encrypted = cipher.update(data, "utf-8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag().toString("base64");

  // Generate unique ID for the file
  const id = Date.now().toString();
  const filePath = path.join(SERVE_AD_DIR, `${id}.json`);

  // Store encrypted data in a file
  fs.writeFileSync(
    filePath,
    JSON.stringify({
      encryptedData: encrypted,
      iv: iv.toString("base64"),
      authTag: authTag,
    })
  );

  const result = {
    link: `http://localhost:3000/ads/serve_ad/${id}`,
    encryptedData: encrypted,
  };

  return result;
}

// Decrypt function - reads and decrypts script from file
function decrypt(id) {
  const filePath = path.join(SERVE_AD_DIR, `${id}.json`);

  console.log(`Looking for file at: ${filePath}`); // Debug log

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.error("File does not exist:", filePath); // Log if the file doesn't exist
    throw new Error("Ad script not found");
  }

  // Read the file content
  const fileContent = fs.readFileSync(filePath, "utf-8");
  let parsedContent;

  // Parse the JSON content
  try {
    parsedContent = JSON.parse(fileContent);
    console.log("Parsed file content:", parsedContent); // Log parsed content
  } catch (err) {
    console.error("Error parsing JSON:", err.message); // Log JSON parse errors
    throw new Error("Failed to parse file content");
  }

  // Prepare the decryption
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    SECRET_KEY, // Ensure this is the same key used for encryption
    Buffer.from(parsedContent.iv, "base64")
  );

  // Set the authentication tag
  decipher.setAuthTag(Buffer.from(parsedContent.authTag, "base64"));

  // Decrypt the data
  let decrypted;
  try {
    decrypted = decipher.update(parsedContent.encryptedData, "base64", "utf-8");
    decrypted += decipher.final("utf-8");
    console.log("Decryption successful."); // Log successful decryption
  } catch (error) {
    console.error("Decryption error:", error.message); // Log decryption errors
    throw new Error("Decryption failed");
  }

  return decrypted;
}
module.exports = {
  encrypt,
  decrypt,
};

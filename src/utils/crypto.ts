// SHA-256 hashing for PII data
export async function sha256Hash(text: string): Promise<string> {
  // Convert string to Uint8Array
  const msgUint8 = new TextEncoder().encode(text.toLowerCase().trim())
  
  // Hash the data
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  
  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

// Helper to safely hash email
export async function hashEmail(email: string | undefined): Promise<string | undefined> {
  if (!email) return undefined
  return sha256Hash(email)
}

// Helper to safely hash phone
export async function hashPhone(phone: string | undefined): Promise<string | undefined> {
  if (!phone) return undefined
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '')
  return sha256Hash(cleanPhone)
}

// Helper to safely hash external ID
export async function hashExternalId(id: string | undefined): Promise<string | undefined> {
  if (!id) return undefined
  return sha256Hash(id)
}
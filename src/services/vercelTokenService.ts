import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import CryptoJS from 'crypto-js';

// Simple encryption key - in production, use a more secure method
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

export interface VercelTokenData {
  encryptedToken: string;
  lastUpdated: string;
}

class VercelTokenService {
  // Encrypt token before storing
  private encryptToken(token: string): string {
    return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
  }

  // Decrypt token after retrieving
  private decryptToken(encryptedToken: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Save Vercel PAT to user document
  async saveToken(userId: string, token: string): Promise<void> {
    if (!userId || !token) {
      throw new Error('User ID and token are required');
    }

    const userRef = doc(db, 'users', userId);
    const encryptedToken = this.encryptToken(token);
    
    await updateDoc(userRef, {
      vercelToken: {
        encryptedToken,
        lastUpdated: new Date().toISOString()
      }
    });
  }

  // Get Vercel PAT from user document
  async getToken(userId: string): Promise<string | null> {
    if (!userId) {
      return null;
    }

    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      if (!data?.vercelToken?.encryptedToken) {
        return null;
      }

      return this.decryptToken(data.vercelToken.encryptedToken);
    } catch (error) {
      console.error('Error retrieving Vercel token:', error);
      return null;
    }
  }

  // Remove Vercel PAT from user document
  async removeToken(userId: string): Promise<void> {
    if (!userId) {
      return;
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      vercelToken: null
    });
  }
}

export const vercelTokenService = new VercelTokenService();
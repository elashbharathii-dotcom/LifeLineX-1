import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface StorageUploadResult {
  path: string;
  signedUrl: string;
  hash: string;
}

class StorageService {
  // Upload a sensitive verification document (PDF, PNG, JPEG)
  public async uploadVerificationDocument(
    bucket: 'donor-documents' | 'hospital-licenses' | 'medical-records',
    userId: string,
    file: File | Blob,
    fileName: string
  ): Promise<StorageUploadResult> {
    const filePath = `${userId}/${Date.now()}_${fileName}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;

      // Generate 5-minute temporary signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(data.path, 300);

      if (signedError) throw signedError;

      return {
        path: data.path,
        signedUrl: signedData.signedUrl,
        hash: hashHex,
      };
    }

    // Local resilient fallback URL for development sandbox
    return {
      path: `sandbox://${bucket}/${filePath}`,
      signedUrl: `https://secure-vault.lifelinex.internal/${bucket}/${filePath}?token=exp_${Date.now() + 300000}`,
      hash: hashHex,
    };
  }

  // Get temporary signed URL for authorized reviewer
  public async getSignedUrl(
    bucket: 'donor-documents' | 'hospital-licenses' | 'medical-records',
    filePath: string,
    expiresInSeconds = 300
  ): Promise<string> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresInSeconds);
      if (error) throw error;
      return data.signedUrl;
    }
    return `https://secure-vault.lifelinex.internal/${bucket}/${filePath}?token=exp_${Date.now() + expiresInSeconds * 1000}`;
  }
}

export const storageService = new StorageService();

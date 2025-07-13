import { supabase } from "@/lib/supabase";
import { getCurrentUserProfile } from "./user";

export const STORAGE_BUCKETS = {
  RESUMES: "resumes",
} as const;

export class StorageService {
  static async uploadResumeFile(file: File, userId: string): Promise<string> {
    // Ensure user profile exists before uploading
    await getCurrentUserProfile();

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.RESUMES)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      if (
        error.message.includes("bucket") &&
        error.message.includes("not found")
      ) {
        throw new Error(
          'Storage bucket not found. Please create a "resumes" bucket in your Supabase dashboard.'
        );
      }
      throw new Error(`Upload failed: ${error.message}`);
    }

    return data.path;
  }

  static async getResumeFileUrl(path: string): Promise<string> {
    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.RESUMES)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  static async deleteResumeFile(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.RESUMES)
      .remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  static validateResumeFile(file: File): { isValid: boolean; error?: string } {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (file.size > MAX_SIZE) {
      return { isValid: false, error: "File size must be less than 10MB" };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: "Only PDF, DOC, and DOCX files are allowed",
      };
    }

    return { isValid: true };
  }
}

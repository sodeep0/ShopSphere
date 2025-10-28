declare module 'cloudinary' {
  export interface UploadOptions {
    folder?: string;
    resource_type?: string;
    transformation?: any[];
    public_id?: string;
    overwrite?: boolean;
    invalidate?: boolean;
  }

  export interface UploadResult {
    asset_id: string;
    public_id: string;
    version: number;
    version_id: string;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    created_at: string;
    tags: string[];
    bytes: number;
    type: string;
    etag: string;
    placeholder: boolean;
    url: string;
    secure_url: string;
    access_mode: string;
    original_filename: string;
  }

  export interface Uploader {
    upload_stream(
      options?: UploadOptions,
      callback?: (error: Error | null, result: UploadResult | null) => void
    ): any;
    
    destroy(
      publicId: string,
      callback?: (error: Error | null, result: any) => void
    ): void;
    
    upload(
      file: string | Buffer,
      options?: UploadOptions,
      callback?: (error: Error | null, result: UploadResult | null) => void
    ): void;
  }

  export interface CloudinaryV2 {
    config(options: {
      cloud_name: string;
      api_key: string;
      api_secret: string;
      secure?: boolean;
    }): void;
    
    uploader: Uploader;
    
    url(publicId: string, options?: any): string;
    
    api: {
      delete_resources_by_prefix(
        prefix: string,
        callback?: (error: Error | null, result: any) => void
      ): void;
    };
  }

  const cloudinary: {
    v2: CloudinaryV2;
  };

  export default cloudinary;
}


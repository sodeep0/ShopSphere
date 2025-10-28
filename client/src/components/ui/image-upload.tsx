import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  onImageInfo?: (info: any) => void;
  disabled?: boolean;
  className?: string;
}

interface UploadedImage {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  onImageInfo, 
  disabled = false, 
  className = "" 
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(value || "");
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (data) => {
      // API returns { success: true, data: { images: {...}, info: {...} } }
      const responseData = data.data || data;
      const uploadedImage: UploadedImage = responseData.images;
      onChange(uploadedImage.medium); // Use medium size as default
      setImagePreview(uploadedImage.medium);
      setImageUrl(uploadedImage.medium);
      onImageInfo?.(responseData.info);
      
      toast({
        title: "Image Uploaded",
        description: "Image has been uploaded and processed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload image.",
      });
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [disabled]);

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or WebP image.",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "File size must be less than 10MB.",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadMutation.mutate(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    onChange(url);
    setImagePreview(url);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageUrl("");
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getImageDisplayUrl = () => {
    return imagePreview || imageUrl || value;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode Toggle */}
      <div className="flex space-x-4">
        <Button
          type="button"
          variant={uploadMode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('upload')}
          disabled={disabled}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>
        <Button
          type="button"
          variant={uploadMode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMode('url')}
          disabled={disabled}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Image URL
        </Button>
      </div>

      {/* Upload Mode */}
      {uploadMode === 'upload' && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
            disabled={disabled}
          />

          <div className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
              {uploadMutation.isPending ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="text-primary text-xl w-6 h-6" />
              )}
            </div>
            
            <div>
              <p className="text-foreground font-medium">
                {uploadMutation.isPending
                  ? 'Uploading and processing...'
                  : 'Drop your image here or click to browse'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Supports JPEG, PNG, WebP (max 10MB)
              </p>
            </div>

            {!uploadMutation.isPending && (
              <Button type="button" variant="outline" size="sm" disabled={disabled}>
                Choose File
              </Button>
            )}
          </div>
        </div>
      )}

      {/* URL Mode */}
      {uploadMode === 'url' && (
        <div className="space-y-2">
          <Label htmlFor="image-url">Image URL</Label>
          <Input
            id="image-url"
            type="url"
            value={imageUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={disabled}
          />
        </div>
      )}

      {/* Image Preview */}
      {getImageDisplayUrl() && (
        <div className="relative">
          <div className="relative w-full max-w-md mx-auto">
            <img
              src={getImageDisplayUrl()}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border border-border"
            />
            
            {/* Clear Button */}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={clearImage}
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Upload Status */}
            {uploadMutation.isPending && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="bg-background p-3 rounded-lg flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
              </div>
            )}

            {uploadMutation.isSuccess && (
              <div className="absolute top-2 left-2">
                <div className="bg-green-500 text-white p-1 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
            )}

            {uploadMutation.isError && (
              <div className="absolute top-2 left-2">
                <div className="bg-red-500 text-white p-1 rounded-full">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>

          {/* Image Info */}
          {uploadMutation.data?.info && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              {uploadMutation.data.info.width} × {uploadMutation.data.info.height} • 
              {(uploadMutation.data.info.size / 1024).toFixed(1)} KB
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-muted-foreground">
        <p>• Uploaded images are automatically optimized and resized</p>
        <p>• Multiple sizes are generated for different use cases</p>
        <p>• External URLs are used as-is without processing</p>
      </div>
    </div>
  );
}

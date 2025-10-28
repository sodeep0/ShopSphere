import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategory, updateCategory } from "@/lib/api";
import type { Category } from "@shared/schema";

interface CategoryFormProps {
  category?: Category | null;
  onClose: () => void;
}

export function CategoryForm({ category, onClose }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    icon: category?.icon || "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Category Created",
        description: "Category has been created successfully.",
      });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Category Updated",
        description: "Category has been updated successfully.",
      });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (category) {
      updateMutation.mutate({ id: category.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name whenever name changes (only for new categories)
    if (field === 'name' && !category) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .trim();
      setFormData(prev => ({ ...prev, slug: slug || 'category' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Category Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          required
          data-testid="input-category-name"
          placeholder="e.g., Felt Crafts"
        />
      </div>

      <div>
        <Label htmlFor="slug">Slug *</Label>
        <div className="relative">
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => handleInputChange('slug', e.target.value)}
            required
            data-testid="input-category-slug"
            placeholder={category ? "Edit slug" : "Auto-generated from name"}
            pattern="^[a-z0-9-]+$"
            title={category ? "Edit the slug manually" : "Auto-generated from category name"}
            readOnly={!category}
            className={category ? "" : "bg-muted pr-20"}
          />
          {!category && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                Auto
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {category 
            ? "URL-friendly version of the name (editable for existing categories)"
            : "URL-friendly version of the name (auto-generated from name)"
          }
        </p>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          data-testid="input-category-description"
          placeholder="Brief description of this category..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="icon">Icon *</Label>
        <Input
          id="icon"
          value={formData.icon}
          onChange={(e) => handleInputChange('icon', e.target.value)}
          required
          data-testid="input-category-icon"
          placeholder="🧶"
          maxLength={2}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Choose an emoji that represents this category
        </p>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createMutation.isPending || updateMutation.isPending}
          data-testid="button-save-category"
        >
          {createMutation.isPending || updateMutation.isPending 
            ? "Saving..." 
            : category ? "Update Category" : "Create Category"
          }
        </Button>
      </div>
    </form>
  );
}

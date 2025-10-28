import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Category } from "@shared/schema";

interface CategoriesTabProps {
  categories: Category[];
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  isDeleting: boolean;
}

export function CategoriesTab({ 
  categories, 
  onAddCategory, 
  onEditCategory, 
  onDeleteCategory,
  isDeleting 
}: CategoriesTabProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Categories</h2>
        <Button onClick={onAddCategory} data-testid="button-add-category">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category: any) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{category.icon}</div>
                    <div>
                      <p className="font-medium text-foreground">{category.name}</p>
                      <p className="text-sm text-muted-foreground">ID: {category.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {category.description}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditCategory(category)}
                      data-testid={`button-edit-category-${category.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteCategory(category)}
                      data-testid={`button-delete-category-${category.id}`}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

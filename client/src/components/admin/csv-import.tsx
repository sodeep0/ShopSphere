import { useState, useRef } from "react";
import { Upload, Download, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { importCSV, getCategories } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Category } from "@shared/schema";

export function CSVImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState("create");
  const [validationResults, setValidationResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => getCategories(),
  });

  const importMutation = useMutation({
    mutationFn: importCSV,
    onSuccess: (data) => {
      toast({
        title: "Import Successful",
        description: data.message,
      });
      setSelectedFile(null);
      setValidationResults(data);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message || "Failed to import CSV file.",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: "Please select a CSV file.",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "File size must be less than 10MB.",
        });
        return;
      }

      setSelectedFile(file);
      setValidationResults(null);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please select a CSV file to import.",
      });
      return;
    }

    importMutation.mutate(selectedFile);
  };

  const downloadTemplate = () => {
    const categorySlugs = categories.map((cat: Category) => cat.slug);
    const firstCategorySlug = categorySlugs[0] || 'example-category';
    
    const template = `name,description,price,stock,category,image_url
"Sample Product 1","Beautiful handmade item",850,20,"${firstCategorySlug}","https://example.com/image1.jpg"
"Sample Product 2","Traditional craft item",2500,10,"${firstCategorySlug}","https://example.com/image2.jpg"
"Sample Product 3","Handcrafted decoration",4500,5,"${firstCategorySlug}","https://example.com/image3.jpg"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'krisha-krafts-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText className="text-accent-foreground text-2xl w-8 h-8" />
          </div>
          <CardTitle className="text-2xl">CSV Product Import</CardTitle>
          <p className="text-muted-foreground">Upload a CSV file to bulk import or update products</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* CSV Format Guide */}
          <div className="bg-muted/50 border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-3">CSV Format Requirements</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Required columns:</strong> name, description, price, stock, category, image_url</p>
              <p><strong>Categories:</strong> {categories.length > 0 ? categories.map((cat: Category) => cat.slug).join(', ') : 'Loading categories...'}</p>
              <p><strong>Image URLs:</strong> Use full URLs (https://example.com/image.jpg) or upload images individually in the product form</p>
              <p><strong>Example:</strong></p>
              <code className="block bg-background p-3 rounded text-xs mt-2 font-mono">
                name,description,price,stock,category,image_url<br />
                "Sample Product","Beautiful handmade item",850,20,"{categories.length > 0 ? categories[0].slug : 'example-category'}","https://example.com/image.jpg"
              </code>
            </div>
          </div>

          {/* File Upload */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            data-testid="file-upload-area"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-csv-file"
            />
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                <Upload className="text-primary text-xl w-6 h-6" />
              </div>
              <div>
                <p className="text-foreground font-medium">
                  {selectedFile ? selectedFile.name : 'Drop your CSV file here or click to browse'}
                </p>
                <p className="text-sm text-muted-foreground">Maximum file size: 10MB</p>
              </div>
              {!selectedFile && (
                <Button variant="outline" data-testid="button-browse-file">
                  Choose File
                </Button>
              )}
            </div>
          </div>

          {/* Import Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Import Options</h3>
            <RadioGroup value={importMode} onValueChange={setImportMode}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="create" id="create" />
                <Label htmlFor="create">Create new products only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="update" id="update" />
                <Label htmlFor="update">Update existing products (match by name)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upsert" id="upsert" />
                <Label htmlFor="upsert">Create new and update existing</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Validation Results */}
          {validationResults && (
            <div className="bg-chart-2/10 border border-chart-2/20 rounded-lg p-4">
              <h4 className="font-semibold text-foreground mb-2">Import Results</h4>
              <div className="text-sm space-y-1">
                <p className="text-chart-2">
                  ✓ Successfully imported {validationResults.imported} products
                </p>
                {validationResults.errors && validationResults.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-destructive cursor-pointer">
                      ✗ {validationResults.errors.length} errors occurred
                    </summary>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {validationResults.errors.map((error: string, index: number) => (
                        <p key={index} className="text-xs text-destructive bg-destructive/10 p-1 rounded">
                          {error}
                        </p>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="secondary"
              onClick={downloadTemplate}
              data-testid="button-download-template"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              data-testid="button-start-import"
            >
              {importMutation.isPending ? (
                "Importing..."
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Start Import
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

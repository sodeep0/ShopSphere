import { Router } from "express";
import { storage } from "../storage/index";
import { insertCategorySchema } from "@shared/schema";
import { authenticateAdmin, validateRequest } from "./middleware";
import { ResponseHelper } from "../utils/response";
import { formatValidationError } from "../utils/app-error";

const router = Router();

// Create category
router.post("/", authenticateAdmin, validateRequest(insertCategorySchema), async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const validatedCategory = req.body;
    const category = await storage.createCategory(validatedCategory);
    response.created(category);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const validationError = formatValidationError(error);
      return response.error(validationError);
    }
    response.error(error);
  }
});

// Update category
router.put("/:id", authenticateAdmin, validateRequest(insertCategorySchema.partial()), async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const validatedCategory = req.body;
    const category = await storage.updateCategory(req.params.id, validatedCategory);
    if (!category) {
      return response.notFound('Category', req.params.id);
    }
    response.success(category);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const validationError = formatValidationError(error);
      return response.error(validationError);
    }
    response.error(error);
  }
});

// Delete category
router.delete("/:id", authenticateAdmin, async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const success = await storage.deleteCategory(req.params.id);
    if (!success) {
      return response.badRequest('Cannot delete category that has products. Move products to another category first.');
    }
    response.success({ message: 'Category deleted successfully' });
  } catch (error) {
    response.internalError('Failed to delete category');
  }
});

// Clear all categories and products
router.delete("/clear-all", authenticateAdmin, async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const success = await storage.clearAllData();
    if (success) {
      response.success({ message: 'All categories and products cleared successfully' });
    } else {
      response.internalError('Failed to clear data');
    }
  } catch (error) {
    response.internalError('Failed to clear data');
  }
});

export default router;

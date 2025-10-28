import { Router } from "express";
import { storage } from "../storage/index";
import { authenticateUser, AuthenticatedRequest } from "./middleware";
import { ResponseHelper } from "../utils/response";

const router = Router();

// Get user wishlist
router.get("/", authenticateUser, async (req: AuthenticatedRequest, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    if (!req.user) return response.unauthorized('User not authenticated');
    
    const list = await storage.getWishlist(req.user.id);
    response.success(list);
  } catch (error) {
    response.internalError('Failed to fetch wishlist');
  }
});

// Add item to wishlist
router.post("/", authenticateUser, async (req: AuthenticatedRequest, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    if (!req.user) return response.unauthorized('User not authenticated');
    
    const { productId } = req.body || {};
    if (!productId || typeof productId !== 'string') {
      return response.badRequest('productId is required');
    }
    
    const wl = await storage.addToWishlist({ userId: req.user.id, productId });
    response.created(wl);
  } catch (error) {
    response.internalError('Failed to add to wishlist');
  }
});

// Remove item from wishlist
router.delete("/:productId", authenticateUser, async (req: AuthenticatedRequest, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    if (!req.user) return response.unauthorized('User not authenticated');
    
    const productId = req.params.productId;
    if (!productId) {
      return response.badRequest('productId is required');
    }
    
    const ok = await storage.removeFromWishlist(req.user.id, productId);
    response.success({ success: ok });
  } catch (error) {
    response.internalError('Failed to remove from wishlist');
  }
});

export default router;

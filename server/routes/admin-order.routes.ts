import { Router } from "express";
import { storage } from "../storage/index";
import { authenticateAdmin } from "./middleware";
import { ResponseHelper } from "../utils/response";

const router = Router();

// Get all orders (admin)
router.get("/", authenticateAdmin, async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const orders = await storage.getOrders();
    response.success(orders);
  } catch (error) {
    response.internalError('Failed to fetch orders');
  }
});

// Update order status
router.put("/:id/status", authenticateAdmin, async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const { status } = req.body;
    if (!status) {
      return response.badRequest('Status is required');
    }

    const order = await storage.updateOrderStatus(req.params.id, status);
    if (!order) {
      return response.notFound('Order', req.params.id);
    }

    response.success(order);
  } catch (error) {
    response.internalError('Failed to update order status');
  }
});

export default router;

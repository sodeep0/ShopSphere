import { Router } from "express";
import { storage } from "../storage/index";
import { orderWithItemsSchema } from "@shared/schema";
import { validateRequest } from "./middleware";
import { ResponseHelper } from "../utils/response";
import { formatValidationError } from "../utils/app-error";

const router = Router();

// Place order (COD)
router.post("/", validateRequest(orderWithItemsSchema), async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const validatedOrder = req.body;
    const order = await storage.createOrder(validatedOrder);
    
    // In production, send email notification here
    (req as any).logger?.business('Order created', { 
      orderId: order.id, 
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      total: order.total
    });
    
    response.created(order);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const validationError = formatValidationError(error);
      return response.error(validationError);
    }
    response.error(error as Error);
  }
});

// Get orders by customer phone
router.get("/customer/:phone", async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const orders = await storage.getOrdersByCustomer(req.params.phone);
    response.success(orders);
  } catch (error) {
    response.internalError('Failed to fetch orders');
  }
});

export default router;

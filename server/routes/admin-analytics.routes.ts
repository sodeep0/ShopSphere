import { Router } from "express";
import { storage } from "../storage/index";
import { authenticateAdmin } from "./middleware";
import { ResponseHelper } from "../utils/response";

const router = Router();

// Get admin stats
router.get("/stats", authenticateAdmin, async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const stats = await storage.getProductStats();
    response.success(stats);
  } catch (error) {
    response.internalError('Failed to fetch stats');
  }
});

// Sales analytics
router.get("/analytics/sales", authenticateAdmin, async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const { from, to, interval } = req.query;
    const data = await storage.getSalesAnalytics({
      from: from ? new Date(String(from)) : undefined,
      to: to ? new Date(String(to)) : undefined,
      interval: (interval as any) || 'day',
    });
    response.analytics(data, 'sales');
  } catch (error) {
    response.internalError('Failed to fetch sales analytics');
  }
});

// Revenue report
router.get("/analytics/revenue", authenticateAdmin, async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const { from, to, groupBy } = req.query;
    const data = await storage.getRevenueReport({
      from: from ? new Date(String(from)) : undefined,
      to: to ? new Date(String(to)) : undefined,
      groupBy: (groupBy as any) || 'month',
    });
    response.analytics(data, 'revenue');
  } catch (error) {
    response.internalError('Failed to fetch revenue report');
  }
});

// Product performance
router.get("/analytics/products", authenticateAdmin, async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const { from, to, limit } = req.query;
    const data = await storage.getProductPerformance({
      from: from ? new Date(String(from)) : undefined,
      to: to ? new Date(String(to)) : undefined,
      limit: limit ? parseInt(String(limit)) : 10,
    });
    response.analytics(data, 'product-performance');
  } catch (error) {
    response.internalError('Failed to fetch product performance');
  }
});

// Inventory report
router.get("/analytics/inventory", authenticateAdmin, async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const data = await storage.getInventoryReport();
    response.analytics(data, 'inventory');
  } catch (error) {
    response.internalError('Failed to fetch inventory report');
  }
});

// Customer analytics
router.get("/analytics/customers", authenticateAdmin, async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const { from, to, limit } = req.query;
    const data = await storage.getCustomerAnalytics({
      from: from ? new Date(String(from)) : undefined,
      to: to ? new Date(String(to)) : undefined,
      limit: limit ? parseInt(String(limit)) : 10,
    });
    response.analytics(data, 'customer');
  } catch (error) {
    response.internalError('Failed to fetch customer analytics');
  }
});

export default router;

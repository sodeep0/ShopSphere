import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "../storage/index";
import { auth } from "../config/index";
import { 
  loginSchema, 
  registerSchema,
  updateProfileSchema,
} from "@shared/schema";
import { 
  authenticateUser, 
  validateRequest, 
  AuthenticatedRequest 
} from "./middleware";
import { ResponseHelper } from "../utils/response";
import { formatValidationError } from "../utils/app-error";

const router = Router();

// Admin login
router.post("/login", validateRequest(loginSchema), async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    
    if (!user || user.role !== 'admin') {
      return response.unauthorized('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return response.unauthorized('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      auth.jwtSecret,
      { expiresIn: String(auth.jwtExpiresIn) } as jwt.SignOptions
    );

    response.success({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      } 
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const validationError = formatValidationError(error);
      return response.error(validationError);
    }
    response.internalError('Login failed');
  }
});

// Customer register
router.post("/register", validateRequest(registerSchema), async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const validatedData = req.body;
    const { email, password, name, phone, district, road, additionalLandmark } = validatedData;
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return response.conflict('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, auth.bcryptRounds);

    // Create user
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      name,
      phone,
      district,
      road,
      additionalLandmark,
      role: 'customer'
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      auth.jwtSecret,
      { expiresIn: String(auth.jwtCustomerExpiresIn) } as jwt.SignOptions
    );

    response.created({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        phone: user.phone,
        district: user.district,
        road: user.road,
        additionalLandmark: user.additionalLandmark
      } 
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const validationError = formatValidationError(error);
      return response.error(validationError);
    }
    response.internalError('Registration failed');
  }
});

// Customer login
router.post("/customer-login", validateRequest(loginSchema), async (req, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    
    if (!user || user.role !== 'customer') {
      return response.unauthorized('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return response.unauthorized('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      auth.jwtSecret,
      { expiresIn: String(auth.jwtCustomerExpiresIn) } as jwt.SignOptions
    );

    response.success({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        phone: user.phone,
        district: user.district,
        road: user.road,
        additionalLandmark: user.additionalLandmark
      } 
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const validationError = formatValidationError(error);
      return response.error(validationError);
    }
    response.internalError('Login failed');
  }
});

// Get current user profile
router.get("/me", authenticateUser, async (req: AuthenticatedRequest, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    if (!req.user) {
      return response.unauthorized('User not authenticated');
    }
    
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return response.notFound('User');
    }

    response.success({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      district: user.district,
      road: user.road,
      additionalLandmark: user.additionalLandmark,
      role: user.role
    });
  } catch (error) {
    response.internalError('Failed to fetch user profile');
  }
});

// Update user profile
router.put("/profile", authenticateUser, validateRequest(updateProfileSchema), async (req: AuthenticatedRequest, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    if (!req.user) {
      return response.unauthorized('User not authenticated');
    }
    
    const validatedData = req.body;
    const user = await storage.updateUser(req.user.id, validatedData);
    
    if (!user) {
      return response.notFound('User');
    }

    response.success({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      district: user.district,
      road: user.road,
      additionalLandmark: user.additionalLandmark,
      role: user.role
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const validationError = formatValidationError(error);
      return response.error(validationError);
    }
    response.internalError('Failed to update profile');
  }
});

// Get user order history
router.get("/orders", authenticateUser, async (req: AuthenticatedRequest, res) => {
  const response = new ResponseHelper(req, res);
  
  try {
    if (!req.user) {
      return response.unauthorized('User not authenticated');
    }
    
    const orders = await storage.getOrdersByUser(req.user.id);
    response.success(orders);
  } catch (error) {
    response.internalError('Failed to fetch order history');
  }
});

export default router;
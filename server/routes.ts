// Legacy wrapper for backward compatibility
// This file maintains the old routes.ts interface while delegating to the new modular structure

import { registerRoutes } from "./routes/index";

// Re-export the main function
export { registerRoutes };

// Default export for backward compatibility
export default registerRoutes;

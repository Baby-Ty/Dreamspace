// DoD: validated I/O with Zod; consistent error shape; unit tested; CI green; health check passing.

// Health check endpoint
// Tests connectivity to Azure Cosmos DB and returns service status

const { createApiHandler } = require('../utils/apiWrapper');
const { CosmosClient } = require("@azure/cosmos");

module.exports = createApiHandler({
  auth: 'none',
  skipDbCheck: true
}, async (context, req) => {
  const startTime = Date.now();
  
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "DreamSpace API",
    version: process.env.npm_package_version || "1.0.0",
    checks: {
      api: { status: "healthy", responseTime: 0 },
      cosmosdb: { status: "unknown", responseTime: 0 }
    }
  };

  try {
    // Check Cosmos DB connection
    const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
    const cosmosKey = process.env.COSMOS_KEY;

    if (!cosmosEndpoint || !cosmosKey) {
      health.checks.cosmosdb = {
        status: "degraded",
        message: "Cosmos DB credentials not configured",
        responseTime: 0
      };
      health.status = "degraded";
    } else {
      const cosmosStart = Date.now();
      
      try {
        const client = new CosmosClient({
          endpoint: cosmosEndpoint,
          key: cosmosKey
        });

        // Simple ping by getting database metadata
        const database = client.database("dreamspace");
        await database.read();

        const cosmosResponseTime = Date.now() - cosmosStart;
        
        health.checks.cosmosdb = {
          status: "healthy",
          responseTime: cosmosResponseTime,
          endpoint: cosmosEndpoint.replace(/https?:\/\/([^.]+)\..*/, "$1") // Sanitize endpoint
        };
      } catch (cosmosError) {
        const cosmosResponseTime = Date.now() - cosmosStart;
        
        health.checks.cosmosdb = {
          status: "unhealthy",
          message: cosmosError.message || "Failed to connect to Cosmos DB",
          responseTime: cosmosResponseTime,
          error: cosmosError.code || "UNKNOWN"
        };
        health.status = "unhealthy";
      }
    }

    // Calculate total API response time
    const totalResponseTime = Date.now() - startTime;
    health.checks.api.responseTime = totalResponseTime;

    // Determine overall status
    if (health.checks.cosmosdb.status === "unhealthy") {
      health.status = "unhealthy";
    } else if (health.checks.cosmosdb.status === "degraded") {
      health.status = "degraded";
    }

    // Return appropriate HTTP status code
    let statusCode = 200;
    if (health.status === "unhealthy") {
      statusCode = 503; // Service Unavailable
    } else if (health.status === "degraded") {
      statusCode = 200; // Still functional, just degraded
    }

    // For health endpoint, we need to control the exact status code
    context.res = {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
      body: JSON.stringify(health)
    };
    
    // Return null to indicate we've already set the response
    return null;

  } catch (error) {
    const totalResponseTime = Date.now() - startTime;
    
    const errorResponse = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      service: "DreamSpace API",
      message: "Health check failed",
      error: error.message,
      checks: {
        api: { 
          status: "unhealthy", 
          responseTime: totalResponseTime,
          error: error.message
        }
      }
    };
    
    context.res = {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
      body: JSON.stringify(errorResponse)
    };
    
    // Return null to indicate we've already set the response
    return null;
  }
});


import { Hono, Context } from 'hono';
import { serve } from '@hono/node-server';
import { MessageBus } from '../core/MessageBus';
import { IMicroServiceRequest } from '../domain/models/IMicroServiceRequest';
import { ICommand } from '../domain/messages/ICommand';

/**
 * Configuration for the generic API entry point
 */
export interface ApiConfig<T extends IMicroServiceRequest> {
    /**
     * The message bus instance to handle commands
     */
    messageBus: MessageBus;
    
    /**
     * Constructor for creating microservice requests from input data
     */
    requestConstructor: {
        validate(input: Record<string, any>): string[];
        create(input: Record<string, any>): Promise<T>;
    };
    
    /**
     * Factory function to create the initial command from the request
     */
    createCommand: (request: T) => ICommand;
    
    /**
     * Base path for the main endpoint (default: '/process')
     */
    basePath?: string;
}

/**
 * Creates a generic API entry point for microservices
 * @param config Configuration for the API
 * @returns Hono app instance
 */
export function createApiEntryPoint<T extends IMicroServiceRequest>(
    config: ApiConfig<T>
): Hono {
    const app = new Hono();
    const { messageBus, requestConstructor, createCommand } = config;
    const basePath = config.basePath || '/process';

    // Main processing endpoint
    app.post(basePath, async (c: Context) => {
        try {
            const body = await c.req.json();

            // Validate input
            const validationErrors = requestConstructor.validate(body);
            if (validationErrors.length > 0) {
                return c.json({ 
                    error: 'Validation failed',
                    details: validationErrors
                }, 400);
            }

            // Create request object
            const request = await requestConstructor.create(body);
            
            // Create and handle command
            const command = createCommand(request);
            await messageBus.handle(command);

            return c.json({
                message: 'Request processed successfully',
                status: 'completed',
                external_job_id: request.external_job_id
            }, 200);

        } catch (error) {
            console.error('Error processing request:', error);
            return c.json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }, 500);
        }
    });

    // Health check endpoint
    app.get('/health', (c: Context) => {
        return c.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString() 
        });
    });

    return app;
}

/**
 * Starts the API server for local development
 * @param app Hono app instance
 * @param port Port to run on (default: 4000)
 */
export function startApiServer(app: Hono, port: number = 4000): void {
    // Only start the server in local development
    if ((process.env.NODE_ENV || '').trim() !== 'production') {
        serve({
            fetch: app.fetch,
            port,
        });
        console.log(`API server listening on http://localhost:${port}`);
    }
}

import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { MessageBus } from '../core/MessageBus';
import { IMicroServiceRequest } from '../domain/models/IMicroServiceRequest';
import { ICommand } from '../domain/messages/ICommand';

/**
 * Configuration for the generic Lambda entry point
 */
export interface LambdaConfig<T extends IMicroServiceRequest> {
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
     * Optional logger instance (defaults to AWS Lambda Powertools logger)
     */
    logger?: Logger;
}

/**
 * Creates a generic Lambda handler for microservices
 * @param config Configuration for the Lambda handler
 * @returns AWS Lambda handler function
 */
export function createLambdaHandler<T extends IMicroServiceRequest>(
    config: LambdaConfig<T>
) {
    const { messageBus, requestConstructor, createCommand } = config;
    const logger = config.logger || new Logger();

    return async (event: any, context: Context): Promise<any> => {
        try {
            logger.info('Processing microservice request', { 
                requestId: context.awsRequestId,
                event: event
            });

            // Validate input
            const validationErrors = requestConstructor.validate(event);
            if (validationErrors.length > 0) {
                const errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
                logger.error('Input validation failed', {
                    requestId: context.awsRequestId,
                    validationErrors,
                    event
                });
                
                return {
                    statusCode: 400,
                    error: errorMessage,
                    external_job_id: event?.external_job_id,
                    message: 'Request validation failed',
                    requestId: context.awsRequestId
                };
            }

            // Create request object
            const request = await requestConstructor.create(event);
            
            // Create and handle command
            const command = createCommand(request);
            await messageBus.handle(command);

            logger.info('Request processed successfully', {
                requestId: context.awsRequestId,
                external_job_id: request.external_job_id
            });

            return {
                statusCode: 200,
                external_job_id: request.external_job_id,
                message: 'Request processed successfully',
                requestId: context.awsRequestId
            };

        } catch (error) {
            logger.error('Lambda handler failed - processing microservice request', {
                error: error instanceof Error ? error.message : 'Unknown error',
                requestId: context.awsRequestId,
                stack: error instanceof Error ? error.stack : undefined,
                event: event
            });

            return {
                statusCode: 500,
                error: error instanceof Error ? error.message : 'Unknown error',
                external_job_id: event?.external_job_id,
                message: 'Request processing failed',
                requestId: context.awsRequestId
            };
        }
    };
}

/**
 * Lambda response interface for consistency
 */
export interface LambdaResponse {
    statusCode: number;
    external_job_id?: string;
    message: string;
    requestId: string;
    error?: string;
}

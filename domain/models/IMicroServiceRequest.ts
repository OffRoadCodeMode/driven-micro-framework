/**
 * Generic interface for microservice request objects
 * All microservice requests must implement this interface to work with the generic entry points
 */
export interface IMicroServiceRequest {
    /**
     * External job identifier - required for all microservice requests
     */
    readonly external_job_id: string;

    /**
     * Serialize the request to a plain object for logging/debugging
     */
    serialize(): Record<string, any>;
}

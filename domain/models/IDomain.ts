import { IEvent } from '../messages/IEvent';

// Generic domain aggregate abstract class that all domain models must extend
export abstract class IDomain {
    public external_job_id: string;
    public data: Record<string, any> = {};
    protected _events: IEvent[] = [];

    constructor(external_job_id: string, data?: Record<string, any>) {
        this.external_job_id = external_job_id;
        this.data = data || {};
    }  
    
    // Collection of domain events that have occurred
    get events(): IEvent[] {
        return this._events;
    }
    
    // Add a domain event
    addEvent(event: IEvent): void {
        this._events.push(event);
    }
    
    // Clear all events (typically after they've been processed)
    clearEvents(): void {
        this._events = [];
    }
    
    // Abstract method that subclasses must implement for storage serialization
    abstract serialize(): Record<string, any>;
}

import { IMessage } from './IMessage';
import { IDomain } from '../models/IDomain';

// Base interface for all events in the system
export abstract class IEvent<T extends IDomain = IDomain> extends IMessage {
    public readonly context: string;
    
    constructor(
        public readonly domain: T,
        public readonly error?: string
    ) {
        super();
        this.context = `${this.name}: ${this.domain.external_job_id}`;
    }
}

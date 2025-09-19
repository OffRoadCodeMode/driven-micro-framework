// Dependency injection types for the framework
export const TYPES = {
    // Core services
    MessageBus: Symbol.for('MessageBus'),
    
    // Domain repositories
    DomainRepo: Symbol.for('DomainRepo'),
    
    // LLM clients
    LLMClient: Symbol.for('LLMClient'),
    
    // Units of work
    UnitOfWork: Symbol.for('UnitOfWork')
};

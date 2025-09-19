// Framework exports for driven-micro
// This file exports all framework components for use as an npm package

// Domain layer
export * from './domain/models/IDomain';
export * from './domain/messages/IMessage';
export * from './domain/messages/ICommand';
export * from './domain/messages/IEvent';

// Command and Event interfaces only - concrete implementations moved to domain starter kit

// Handler exports
export * from './service/IHandler';

// Adapter exports
export * from './adapters/repos/IDomainRepo';

// Unit of work exports
export * from './service/units_of_work/IUnitOfWork';

// Core exports
export * from './core/MessageBus';
export * from './core/Bootstrap';

// Config exports
export * from './config/types';

// Model exports
export * from './domain/models/IMicroServiceRequest';

// Entry point exports
export * from './entrypoints/api';
export * from './entrypoints/lambda';

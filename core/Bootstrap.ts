import 'reflect-metadata';
import { Container } from 'inversify';
import { MessageBus } from './MessageBus';
import { IHandler } from '../service/IHandler';
import { ICommand } from '../domain/messages/ICommand';
import { IEvent } from '../domain/messages/IEvent';
import { TYPES } from '../config/types';

// Configuration interface for framework setup
export interface FrameworkConfig {
    // Handler mappings
    commandHandlers: Map<string, any>;
    eventHandlers: Map<string, any>;
    
    // Dependency bindings
    dependencies: (container: Container) => void;
}

// Bootstrap function for framework initialization
export function bootstrap(config: FrameworkConfig): MessageBus {
    const container = new Container();

    // Setup user-defined dependencies
    config.dependencies(container);

    // Create handler maps with dependency injection
    const commandHandlerMap = new Map<string, IHandler<ICommand>>();
    const eventHandlerMap = new Map<string, IHandler<IEvent>>();

    // Register command handlers
    for (const [commandName, HandlerClass] of config.commandHandlers) {
        container.bind<IHandler<ICommand>>(HandlerClass).to(HandlerClass);
        const handler = container.get<IHandler<ICommand>>(HandlerClass);
        commandHandlerMap.set(commandName, handler);
    }

    // Register event handlers
    for (const [eventName, HandlerClass] of config.eventHandlers) {
        container.bind<IHandler<IEvent>>(HandlerClass).to(HandlerClass);
        const handler = container.get<IHandler<IEvent>>(HandlerClass);
        eventHandlerMap.set(eventName, handler);
    }

    // Create and return message bus
    return new MessageBus(commandHandlerMap, eventHandlerMap);
}

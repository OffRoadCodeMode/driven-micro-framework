# Driven Micro Framework

A production-ready TypeScript framework for building domain-driven microservices with CQRS and Event Sourcing patterns. 

**Why I Built This**: After repeatedly rewriting the same architectural code for each new microservice, I created this framework to handle the core application architecture and message bus flow once and for all.

**What It Provides**: Clean, reusable interfaces and components that abstract sophisticated patterns into a type-safe foundation.

**Getting Started**: Use the [Driven Micro Domain Starter](https://github.com/your-org/driven-micro-domain) repository as your starting template—it demonstrates how to build microservices with this framework.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Purpose

**Driven Micro** eliminates the need to reimplement fundamental architectural patterns for each new microservice. It provides a clean, type-safe foundation that maintains excellent architectural principles while enabling rapid development.

### Key Benefits
- **Production-Ready Architecture** - CQRS, Event Sourcing, DDD patterns out of the box
- **Type-Safe Abstractions** - Comprehensive TypeScript interfaces with full type safety
- **Rapid Development** - Focus on business logic, not infrastructure patterns
- **Clean Separation** - Clear boundaries between domain, service, and adapter layers
- **Event-Driven Workflows** - Built-in message bus with sequential processing
- **Dependency Injection** - Inversify-based DI container with interface abstractions

## Related Projects

- **[Driven Micro Domain Starter](https://github.com/your-org/driven-micro-domain)** - Complete working implementation and starter template
- **Examples Repository** - Real-world usage examples and patterns

## Architecture Overview

### Core Patterns Implemented

#### **CQRS + Event Sourcing**
- Clean separation between commands (state changes) and events (notifications)
- Event-driven workflow chains with automatic progression
- Sequential message processing with proper error handling

#### **Domain-Driven Design**
- Generic `IDomain` interface for aggregate roots
- Repository pattern with domain vs external separation
- Unit of Work pattern for transaction management

#### **Message Bus Architecture**
- Centralized command/event processing
- Sequential execution with error handling
- Automatic handler resolution and dependency injection

#### **Clean Architecture Layers**
```
┌─────────────────────────────────────────┐
│              Entry Points               │  ← API/Lambda handlers
├─────────────────────────────────────────┤
│             Service Layer               │  ← Handlers, Message Bus
├─────────────────────────────────────────┤
│             Domain Layer                │  ← Aggregates, Commands, Events
├─────────────────────────────────────────┤
│             Adapter Layer               │  ← Repositories, External Services
└─────────────────────────────────────────┘
```

## 📦 Framework Structure

```
src/framework/
├── core/                    # Framework Core
│   ├── MessageBus.ts        # Sequential command/event processing
│   └── Bootstrap.ts         # DI container configuration
├── domain/                  # Domain Abstractions
│   ├── models/
│   │   └── IDomain.ts       # Generic domain aggregate interface
│   └── messages/
│       ├── IMessage.ts      # Base message class
│       ├── ICommand.ts      # Command interface
│       └── IEvent.ts        # Event interface
├── service/                 # Service Layer
│   ├── IHandler.ts          # Base handler with error handling
│   └── units_of_work/
│       └── IUnitOfWork.ts   # Transaction management
├── adapters/                # Adapter Interfaces
│   ├── repos/
│   │   ├── IDomainRepo.ts   # Domain repos (with event tracking)
│   │   └── IExternalRepo.ts # External read-only repos
│   ├── llms/
│   │   └── ILLMClient.ts    # Generic LLM interface
│   └── filesystem/
│       └── IFileSystemRepo.ts # File storage interface
├── entrypoints/             # Generic Entry Points
│   ├── api.ts               # Hono-based API server
│   └── lambda.ts            # AWS Lambda handler
├── config/
│   └── types.ts             # DI symbols
└── index.ts                 # Framework exports
```

## Quick Start

### Installation

```bash
npm install driven-micro
```

### Basic Usage

```typescript
import { 
  bootstrap, 
  MessageBus, 
  IDomain,
  ICommand,
  IEvent,
  createApiEntryPoint 
} from 'driven-micro';

// 1. Define your domain aggregate
class MyDomain implements IDomain {
  constructor(
    public readonly external_job_id: string,
    public data: Record<string, any> = {}
  ) {}

  updateData(newData: Record<string, any>): void {
    this.data = { ...this.data, ...newData };
  }

  serialize() {
    return {
      external_job_id: this.external_job_id,
      data: this.data,
      timestamp: new Date().toISOString()
    };
  }
}

// 2. Create commands and events
class CreateMyDomain extends ICommand {
  constructor(public readonly request: MyRequest) {
    super();
  }
}

class MyDomainCreated extends IEvent<MyDomain> {
  constructor(domain: MyDomain) {
    super(domain);
  }
}

// 3. Implement handlers
class CreateMyDomainHandler extends IHandler {
  async handle(command: CreateMyDomain): Promise<IMessage[]> {
    // Your business logic here
    const domain = new MyDomain(command.request.external_job_id);
    
    // Store domain via Unit of Work
    await this.unitOfWork.add(domain);
    
    // Return events to trigger next steps
    return [new MyDomainCreated(domain)];
  }
}

// 4. Bootstrap the framework
const messageBus = bootstrap({
  commandHandlers: new Map([
    [CreateMyDomain.name, CreateMyDomainHandler]
  ]),
  eventHandlers: new Map([
    [MyDomainCreated.name, MyDomainCreatedHandler]
  ]),
  dependencies: (container) => {
    // Configure your dependencies
    container.bind(TYPES.DomainRepo).to(MyDomainRepository);
    container.bind(TYPES.UnitOfWork).to(MyUnitOfWork);
  }
});

// 5. Create API entry point
const app = createApiEntryPoint({
  messageBus,
  requestConstructor: MyRequest,
  createCommand: (request) => new CreateMyDomain(request),
  basePath: '/process'
});
```

## Core Interfaces

### IDomain - Domain Aggregate Root
```typescript
interface IDomain {
  external_job_id: string;
  data: Record<string, any>;
  updateData(data: Record<string, any>): void;
  serialize(): Record<string, any>;
}
```

### ICommand & IEvent - Messages
```typescript
abstract class ICommand extends IMessage {
  abstract external_job_id: string;
}

abstract class IEvent<T extends IDomain> extends IMessage {
  constructor(
    public readonly domain: T,
    public readonly error?: string
  ) {
    super();
  }
}
```

### IHandler - Command/Event Processing
```typescript
abstract class IHandler {
  abstract handle(message: IMessage): Promise<IMessage[]>;
  
  protected addMessages(messages: IMessage[]): void;
  protected finish(): void;
  protected async logError(error: string, context?: string): Promise<void>;
}
```

### Repository Patterns
```typescript
// Domain Repository (with event tracking)
interface IDomainRepo<T extends IDomain> {
  seen: Set<T>;  // Event tracking
  add(domain: T): Promise<void>;
  get(external_job_id: string): Promise<T | undefined>;
  update(domain: T): Promise<void>;
}

// External Repository (read-only)
interface IExternalRepo<T> {
  get(id: string): Promise<T | undefined>;
}
```

## Workflow Patterns

### Standard CQRS Flow
```typescript
// Command → Handler → Event → Handler → Command → ...
CreateCommand → CreateHandler → DomainCreated → 
CreatedHandler → ActCommand → ActHandler → DomainActed → 
ActedHandler → StoreCommand → StoreHandler → DomainStored
```

### Error Handling
```typescript
class MyHandler extends IHandler {
  async handle(command: MyCommand): Promise<IMessage[]> {
    try {
      // Business logic
      return [new SuccessEvent(result)];
    } catch (error) {
      await this.logError(error.message, command.external_job_id);
      return [new FailureEvent(domain, error.message)];
    }
  }
}
```

## Entry Points

### API Server (Hono-based)
```typescript
import { createApiEntryPoint, startApiServer } from 'driven-micro';

const app = createApiEntryPoint({
  messageBus,
  requestConstructor: MyRequest,
  createCommand: (request) => new CreateCommand(request),
  basePath: '/api/process'
});

startApiServer(app, 4000);
```

### AWS Lambda
```typescript
import { createLambdaHandler } from 'driven-micro';

export const handler = createLambdaHandler({
  messageBus,
  requestConstructor: MyRequest,
  createCommand: (request) => new CreateCommand(request)
});
```

## Testing Support

The framework is designed to be easily testable:

```typescript
// Unit testing handlers
const handler = new MyHandler();
const command = new MyCommand(testData);
const events = await handler.handle(command);

expect(events).toHaveLength(1);
expect(events[0]).toBeInstanceOf(MyEvent);

// Integration testing with message bus
const result = await messageBus.handle(command);
expect(result).toBeDefined();
```

## Framework Exports

```typescript
// Domain layer interfaces
export { IDomain, IMessage, ICommand, IEvent }

// Service layer interfaces  
export { IHandler, IUnitOfWork }

// Adapter layer interfaces
export { IDomainRepo, IExternalRepo, ILLMClient, IFileSystemRepo }

// Core framework
export { MessageBus, bootstrap, FrameworkConfig }
export { TYPES }

// Entry points
export { createApiEntryPoint, startApiServer, createLambdaHandler }
export { IMicroServiceRequest, IMicroServiceRequestConstructor }
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Architecture Inspiration

This framework abstracts and generalizes the sophisticated architectural patterns from production microservices, maintaining:

- **Clean CQRS + Event Sourcing** with proper separation
- **Domain-Driven Design** with aggregate roots and bounded contexts
- **Message Bus Architecture** for decoupled processing
- **Repository Pattern** with domain/external separation
- **Unit of Work Pattern** for transaction management
- **Dependency Injection** with interface-based abstractions

**Built with ❤️ for domain-driven microservice development**

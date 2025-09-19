import { injectable } from 'inversify';
import { IMessage } from '../domain/messages/IMessage';
import { ICommand } from '../domain/messages/ICommand';
import { IEvent } from '../domain/messages/IEvent';
import { IHandler } from '../service/IHandler';

// Message bus for sequential processing of commands and events
@injectable()
export class MessageBus {
    private queue: IMessage[] = [];

    constructor(
        private commandHandlers: Map<string, IHandler<ICommand>>,
        private eventHandlers: Map<string, IHandler<IEvent>>
    ) {}

    async handle(message: IMessage): Promise<void> {
        this.queue = [message];
        
        while (this.queue.length > 0) {
            const currentMessage = this.queue.shift()!;
            
            if (this.isCommand(currentMessage)) {
                await this.handleCommand(currentMessage);
            } else if (this.isEvent(currentMessage)) {
                await this.handleEvent(currentMessage);
            } else {
                throw new Error(`${currentMessage} was not a Command or Event`);
            }
        }
    }

    private async handleCommand(command: ICommand): Promise<void> {
        const handlerKey = command.constructor.name;
        const handler = this.commandHandlers.get(handlerKey);
        
        if (!handler) {
            throw new Error(`No handler found for command: ${handlerKey}`);
        }

        const newMessages = await handler.handle(command);
        this.queue.push(...newMessages);
    }

    private async handleEvent(event: IEvent): Promise<void> {
        const handlerKey = event.constructor.name;
        const handler = this.eventHandlers.get(handlerKey);
        
        if (!handler) {
            // Events might not have handlers, which is fine
            return;
        }

        const newMessages = await handler.handle(event);
        this.queue.push(...newMessages);
    }

    private isCommand(message: IMessage): message is ICommand {
        return message instanceof ICommand;
    }

    private isEvent(message: IMessage): message is IEvent {
        return message instanceof IEvent;
    }
}

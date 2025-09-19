import { IMessage } from '../domain/messages/IMessage';
import { IUnitOfWork } from './units_of_work/IUnitOfWork';

// Base abstract class for all handlers in the system
export abstract class IHandler<T extends IMessage> {

    protected _return_messages: IMessage[] = [];
    protected uow?: IUnitOfWork;

    // Template Method - concrete implementation that manages UoW lifecycle
    async handle(message: T, ...args: any[]): Promise<IMessage[]> {
        if (this.uow) {
            await this.uow.enter();
            
            try {
                // Call the concrete implementation's business logic
                await this._handle(message, ...args);
                
                // Collect events from unit of work if available
                if (this.uow) {
                    this.addMessages(this.uow.collectNewEvents());
                }
                
                await this.uow.commit();
                return this.finish();
            } catch (error) {
                await this.logError(error instanceof Error ? error.message : String(error));
                throw error;
            } finally {
                await this.uow.exit();
            }
        } else {
            // For handlers without UoW (like event handlers)
            try {
                await this._handle(message, ...args);
                return this.finish();
            } catch (error) {
                await this.logError(error instanceof Error ? error.message : String(error));
                throw error;
            }
        }
    }

    // Abstract method for concrete implementations to override with business logic
    protected abstract _handle(message: T, ...args: any[]): Promise<void>;

    protected async logError(error: string, context?: string): Promise<void> {
        console.error(`${this.constructor.name} | Error: ${error} | Context: ${context}`);
    }

    protected addMessages(messages: IMessage[]): void {
        this._return_messages.push(...messages);
    }

    protected finish(): IMessage[] {
        return this._return_messages;
    }
}

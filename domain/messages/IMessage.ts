// Base interface for all messages in the system
export abstract class IMessage {
    readonly name = this.constructor.name;
}

import { IDomain } from '../../domain/models/IDomain';

// Interface for domain aggregate repository (manages domain events and seen entities)
export interface IDomainRepo<T extends IDomain = IDomain> {
    seen: Set<T>;
    add(domain: T): Promise<void>;
    get(id: string, ...args: any[]): Promise<T | undefined>;
    update(domain: T): Promise<void>;
    setDbSession(): void;
    closeDbSession(): void;
}

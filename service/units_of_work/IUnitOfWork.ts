import { injectable, inject } from 'inversify';
import { IMessage } from '../../domain/messages/IMessage';
import { IDomainRepo } from '../../adapters/repos/IDomainRepo';
import { IDomain } from '../../domain/models/IDomain';

// Unit of Work interface for transaction management
@injectable()
export abstract class IUnitOfWork<T extends IDomain = IDomain> {
    private _events: IMessage[] = [];
    private _repo!: IDomainRepo<T>;

    // Context manager pattern - equivalent to Python's __enter__
    async enter(): Promise<this> {
        this._repo.setDbSession();
        return this;
    }

    // Context manager pattern - equivalent to Python's __exit__
    async exit(error?: Error): Promise<void> {
        if (error) {
            this._logException(error);
            await this._rollback();
        }
        this._repo.closeDbSession();
    }

    private _logException(error: Error): void {
        console.error(`Exception in UnitOfWork: ${error.name} - ${error.message}`);
    }

    async commit(): Promise<void> {
        await this._commit();
    }

    collectNewEvents(): IMessage[] {
        if (!this._repo) {
            throw new Error('Repository not initialized');
        }
        
        // Only collect events from domain repositories (they have 'seen' property)
        if ('seen' in this._repo) {
            for (const domain of this._repo.seen) {
                while (domain.events.length > 0) {
                    const event = domain.events.shift();
                    if (event) this._events.push(event);
                }
            }
        }
        // External repositories don't generate events, so return empty array
        return this._events;
    }

    protected set repo(repo: IDomainRepo<T>) {
        this._repo = repo;
    }

    protected get repo(): IDomainRepo<T> {
        return this._repo;
    }

    // Operational methods with transaction management
    async add(domain: T): Promise<void> {
        await this.enter();
        try {
            await this.repo.add(domain);
            await this.commit();
            this.collectNewEvents();
        } catch (error) {
            await this.exit(error as Error);
            throw error;
        } finally {
            await this.exit();
        }
    }

    async get(id: string, batchIdentifier?: string): Promise<T | undefined> {
        await this.enter();
        try {
            const domain = await this.repo.get(id, batchIdentifier);
            await this.commit();
            return domain as T | undefined;
        } catch (error) {
            await this.exit(error as Error);
            throw error;
        } finally {
            await this.exit();
        }
    }

    async update(domain: T): Promise<void> {
        await this.enter();
        try {
            this.repo.update(domain);
            await this.commit();
            this.collectNewEvents();
        } catch (error) {
            await this.exit(error as Error);
            throw error;
        } finally {
            await this.exit();
        }
    }

    protected abstract _commit(): Promise<void>;
    protected abstract _rollback(): Promise<void>;
}

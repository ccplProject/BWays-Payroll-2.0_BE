import { AsyncLocalStorage } from 'async_hooks';

export interface CompanyContext {
    companyId: string | number | null;
    companyUnique?: string | null;
}

const storage = new AsyncLocalStorage<CompanyContext>();

export const companyContextStorage = {
    getStore: () => storage.getStore(),
    run: <T>(store: CompanyContext, callback: () => T): T => {
        const existingStore = storage.getStore();
        // Merge: If current run is missing values that exist in the parent context, preserve them.
        const mergedStore: CompanyContext = {
            companyId: store.companyId ?? existingStore?.companyId ?? null,
            companyUnique: store.companyUnique ?? existingStore?.companyUnique ?? null,
        };
        return storage.run(mergedStore, callback);
    }
};

export function getCompanyId(): string | number | null {
    const context = companyContextStorage.getStore();
    return context ? context.companyId : null;
}

export function getCompanyUnique(): string | null {
    const context = companyContextStorage.getStore();
    return context ? context.companyUnique : null;
}

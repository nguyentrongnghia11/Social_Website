

export interface IGeneralServices<T> {

    add(item: Partial<T>): Promise<T>;
    update(item: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>
    getAll(fieldSort: string, sort: 1 | -1): Promise<T[]>;
    findOne(id: String): Promise<T | null>
}
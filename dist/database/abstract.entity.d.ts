export declare class AbstractEntity<T> {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedDate?: Date;
    constructor(partial: Partial<T>);
}

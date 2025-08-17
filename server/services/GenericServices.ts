
import { IGeneralServices } from "./IGenericServices";
import { Document, Model } from "mongoose";
class GenericServices<T extends Document> implements IGeneralServices<T> {
    private model: Model<T> ;

    constructor(model: Model<T>) {
        this.model = model;
    }


    async add(item: Partial<T>): Promise<T> {
        return this.model.create(item);
    }
    async update(item: Partial<T>): Promise<T | null> {
        return await this.model.findByIdAndUpdate(item.id, item, { new: true });
    };
    async delete(id: string): Promise<boolean> {

        return (await this.model.deleteOne({ _id: id })).deletedCount > 0;
    };
    async getAll(fieldSort: string = "createdAt", sort: 1 | -1 = 1): Promise<T[]> {


        return this.model.find().sort({ [fieldSort]: sort });

    }


    async findOne(id: String): Promise<T | null> {
        return this.model.findById(id);
    }
}

export default GenericServices;


export class ErrorApi extends Error {

    statusCode: number;

    constructor(statusCode: number, message: any, name?: string) {

        super(message)
        this.statusCode = statusCode;
        this.name = name || "Error api";

        Error.captureStackTrace(this, this.constructor)
    }

}
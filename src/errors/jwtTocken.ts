// interfaces

import { IJWTTokenErrorDetails } from "../Entities/jwt";

export default class JWTTokenError extends Error {
    public details: IJWTTokenErrorDetails;
    constructor(details: IJWTTokenErrorDetails) {
        super(details.message);
        this.details = details;
    }
}
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
class AuthRepository {
    findByEmail(email) {
        return User_model_1.default.findOne({ email });
    }
    create(data) {
        return User_model_1.default.create(data);
    }
}
exports.AuthRepository = AuthRepository;

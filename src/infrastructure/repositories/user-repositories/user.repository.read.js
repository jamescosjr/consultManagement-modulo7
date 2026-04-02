import { User } from "../../schemas/user.schema.js";
import { AppError } from "../../../domain/error/customErros.js";

export async function getAllUsers(page = 1, limit = 10) {
    try {
        const skip = (page - 1) * limit;
        const users = await User.find().select('-passwordHash').skip(skip).limit(limit);
        return users;
    } catch (error) {
        throw new AppError(error.message, 500);
    }
}

export async function getUserById(id) {
    try {
        const user = await User.findById(id).select('-passwordHash');
        return user;
    } catch (error) {
        throw new AppError(error.message, 500);
    }
}

export async function getUserByName(name, page = 1, limit = 10) {
    try {
        const skip = (page - 1) * limit;
        const users = await User.find({ name: { $regex: name, $options: 'i' } })
            .select('-passwordHash')
            .skip(skip)
            .limit(limit);
        return users;
    } catch (error) {
        throw new AppError(error.message, 500);
    }
}

export async function getUserByEmail(email) {
    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('-passwordHash');
        return user;
    } catch (error) {
        throw new AppError(error.message, 500);
    }
}

export async function getUserByRole(role, page = 1, limit = 10) {
    try {
        const skip = (page - 1) * limit;
        const users = await User.find({ role })
            .select('-passwordHash')
            .skip(skip)
            .limit(limit);
        return users;
    } catch (error) {
        throw new AppError(error.message, 500);
    }
}

export async function hasRootUser() {
    try {
        const rootUser = await User.findOne({ role: 'root' });
        return rootUser !== null;
    } catch (error) {
        throw new AppError(error.message, 500);
    }
}

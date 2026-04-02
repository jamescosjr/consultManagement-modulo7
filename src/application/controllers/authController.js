import logger from '../../infrastructure/observability/logger.js';
import { ValidationError } from "../../domain/error/customErros.js";
import { registerService, loginService, seedAdminService } from "../../domain/services/authService.js";
import { validateRegisterData, validateLoginData } from "../../domain/validation/auth.js";

export async function registerController(req, res, next) {
    const { name, email, password, role, roleDetails } = req.body;

    const validation = validateRegisterData(name, email, password, role, roleDetails);
        if (!validation.valid) {
            return next(new ValidationError(validation.message))
        }

    try {
        const { user, token } = await registerService({ name, email, password, role, roleDetails });
        res.status(201).json({ user, token });
    } catch (error) {
        if (process.env.NODE_ENV === 'test') {
            logger.error({ status: error.status, message: error.message, name: error.name, stack: error.stack }, 'RegisterController error');
        }
        next(error);
    }
}

export async function loginController(req, res, next) {
    const { email, password } = req.body;

    const validation = validateLoginData(email, password);
    if (!validation.valid) {
        return next(new ValidationError(validation.message));
    }

    try {
        const { user, token } = await loginService({ email, password });
        res.status(200).json({ user, token });
    } catch (error) {
        if (process.env.NODE_ENV === 'test') {
            logger.error({ status: error.status, message: error.message, name: error.name, stack: error.stack }, 'LoginController error');
        }
        next(error);
    }
}

export async function seedAdminController(req, res, next) {
    const { name, email, password } = req.body;

    const validation = validateRegisterData(name, email, password, 'root');
    if (!validation.valid) {
        return next(new ValidationError(validation.message));
    }

    try {
        const { user, token } = await seedAdminService({ name, email, password });
        res.status(201).json({ user, token });
    } catch (error) {
        if (process.env.NODE_ENV === 'test') {
            logger.error({ status: error.status, message: error.message, name: error.name, stack: error.stack }, 'SeedAdminController error');
        }
        next(error);
    }
}
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createUser } from '../../infrastructure/repositories/user-repositories/user.repository.write.js';
import { createDoctor } from '../../infrastructure/repositories/doctor-repositories/doctor.repository.write.js';
import { createPatient } from '../../infrastructure/repositories/patient-repositories/patient.repository.write.js';
import { User } from '../../infrastructure/schemas/user.schema.js';
import { hasRootUser } from '../../infrastructure/repositories/user-repositories/user.repository.read.js';
import { AppError } from '../error/customErros.js';
import { JWT_SECRET } from '../../config/env.js';

export async function registerService({ name, email, password, role = 'client', roleDetails = null }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        let roleData = null;

        // Create role-specific entity if needed
        if (role === 'doctor' && roleDetails) {
            const doctor = await createDoctor({ 
                name, 
                specialty: roleDetails.specialty 
            });
            roleData = {
                refModel: 'Doctor',
                refId: doctor._id
            };
        } else if (role === 'client' && roleDetails) {
            const patient = await createPatient({ 
                name, 
                age: roleDetails.age 
            });
            roleData = {
                refModel: 'Patient',
                refId: patient._id
            };
        }

        const user = await createUser({
            name,
            email,
            passwordHash,
            role,
            roleDetails: roleData
        });

        await session.commitTransaction();

        const payload = {
            id: user._id,
            role: user.role
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: '8h'
        });
        
        user.passwordHash = undefined;
        return { user, token };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

export async function loginService({ email, password }) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const userWithPassword = await User.findOne({ email: normalizedEmail })
        .select('+passwordHash')
        .populate({
            path: 'roleDetails.refId',
            select: '-consultIds -__v'
        });

    if (!userWithPassword) {
        throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, userWithPassword.passwordHash);
    if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
    }

    const payload = {
        id: userWithPassword._id,
        role: userWithPassword.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    const user = userWithPassword.toObject();
    delete user.passwordHash;

    return { user, token };
}

export async function seedAdminService({ name, email, password }) {
    const rootExists = await hasRootUser();
    if (rootExists) {
        throw new AppError('Admin user already exists. Seed is no longer available.', 403);
    }

    return registerService({ name, email, password, role: 'root' });
}
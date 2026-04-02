import supertest from "supertest";
import { app } from "../../../../server";
const dbHandler = require('../../../../jest/jest.setup');

beforeAll(async () => {
    await dbHandler.connect();
});

afterEach(async () => {
    await dbHandler.clearDatabase();
});

afterAll(async () => {
    await dbHandler.closeDatabase();
});

describe('POST /auth/seed-admin', () => {
    describe('success cases', () => {
        it('should create the first root admin user when no root user exists', async () => {
            const payload = {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'Str0ng Admin!Pass',
            };

            const response = await supertest(app)
                .post('/auth/seed-admin')
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body).toEqual(expect.objectContaining({
                user: expect.objectContaining({
                    _id: expect.any(String),
                    name: 'Admin User',
                    email: 'admin@example.com',
                    role: 'root',
                }),
                token: expect.any(String),
            }));
            expect(response.body.user.passwordHash).toBeUndefined();
        });
    });

    describe('non success cases', () => {
        it('should return 403 when a root user already exists', async () => {
            const payload = {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'Str0ng Admin!Pass',
            };

            const first = await supertest(app).post('/auth/seed-admin').send(payload);
            expect(first.status).toBe(201);

            const second = await supertest(app).post('/auth/seed-admin').send({
                name: 'Another Admin',
                email: 'admin2@example.com',
                password: 'Str0ng Admin!Pass',
            });
            expect(second.status).toBe(403);
            expect(second.body.message).toBe('Admin user already exists. Seed is no longer available.');
        });

        it('should reject weak password', async () => {
            const response = await supertest(app)
                .post('/auth/seed-admin')
                .send({
                    name: 'Admin User',
                    email: 'admin@example.com',
                    password: 'weak',
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/Password must be at least/);
        });

        it('should reject invalid email format', async () => {
            const response = await supertest(app)
                .post('/auth/seed-admin')
                .send({
                    name: 'Admin User',
                    email: 'invalid-email',
                    password: 'Str0ng Admin!Pass',
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('The email address format is invalid');
        });

        it('should reject missing name', async () => {
            const response = await supertest(app)
                .post('/auth/seed-admin')
                .send({
                    email: 'admin@example.com',
                    password: 'Str0ng Admin!Pass',
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('The name should be a valid string');
        });
    });
});

declare global {
    namespace Express {
        interface Request {
            user?: { id: string };
            organization?: { id: string, roleId: string | null };
        }
    }
}

export { };

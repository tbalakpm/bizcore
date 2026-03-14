import { db, users } from "../../db";
import { hashPassword } from "../../utils";
import { userPublicSelect } from "../schema/user.schema";
import { eq } from "drizzle-orm";

export const createAdminUser = async () => {
    const user = await db.select(userPublicSelect)
        .from(users)
        .where(eq(users.username, "admin")).get();
    if (user) return;

    await db.insert(users).values({
        username: "admin",
        passwordHash: await hashPassword("Welcome!23"),
        firstName: "BizCore",
        lastName: "Admin",
        role: "admin",
    });
}
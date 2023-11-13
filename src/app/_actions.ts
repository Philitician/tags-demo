"use server";

import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export const updateActiveShoppingCart = async (
  userId: string,
  updatedShoppingCartId: string,
) => {
  await db
    .update(user)
    .set({ activeShoppingCartId: updatedShoppingCartId })
    .where(eq(user.id, userId));

  revalidateTag("user");
};

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/server/db";
import { shoppingCart, user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

import { unstable_cache as cache, revalidateTag } from "next/cache";

const initUserIfNotExists = (id: string, name = "Philip") =>
  db.insert(user).values({ id, name }).onDuplicateKeyUpdate({ set: { name } });

export default async function HomePage() {
  const userId = "1";
  await initUserIfNotExists(userId);

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <DisplayDbUser userId={userId} />
      <SelectActiveCart userId={userId} />
    </main>
  );
}

async function DisplayDbUser({ userId }: { userId: string }) {
  const dbUser = await getDbUser(userId);
  if (!dbUser) return null;
  return <p>{dbUser.name}</p>;
}

async function SelectActiveCart({ userId }: { userId: string }) {
  const dbUser = await getDbUser(userId);
  if (!dbUser) return null;
  const { activeShoppingCartId } = dbUser;
  if (!activeShoppingCartId) return null;
  const carts = await getShoppingCartsByUserId(userId);

  return (
    <Select
      defaultValue={activeShoppingCartId}
      onValueChange={async (selectedShoppingCartId) => {
        "use server";
        await db
          .update(user)
          .set({ activeShoppingCartId: selectedShoppingCartId })
          .where(eq(user.id, userId));

        revalidateTag("user");
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Handlekurv" />
      </SelectTrigger>
      <SelectContent>
        {carts.map((cart) => (
          <SelectItem key={cart.id} value={cart.id}>
            {cart.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const getDbUser = cache(
  async (userId: string) => {
    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return currentUser;
  },
  ["user"],
  {
    tags: ["user"],
  },
);

const getShoppingCartsByUserId = (userId: string) =>
  db
    .select({
      id: shoppingCart.id,
      name: shoppingCart.name,
      userId: shoppingCart.userId,
    })
    .from(shoppingCart)
    .where(eq(shoppingCart.userId, userId))
    .innerJoin(user, eq(shoppingCart.userId, user.id));

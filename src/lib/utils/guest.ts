import { cookies } from "next/headers";

const GUEST_ID_COOKIE = "lockscore_guest_profile";
const GUEST_NAME_COOKIE = "lockscore_guest_name";

export async function getGuestContext() {
  const store = await cookies();

  return {
    guestProfileId: store.get(GUEST_ID_COOKIE)?.value ?? null,
    guestName: store.get(GUEST_NAME_COOKIE)?.value ?? null
  };
}

export async function rememberGuestProfile(guestProfileId: string, guestName: string) {
  const store = await cookies();

  store.set(GUEST_ID_COOKIE, guestProfileId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  store.set(GUEST_NAME_COOKIE, guestName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

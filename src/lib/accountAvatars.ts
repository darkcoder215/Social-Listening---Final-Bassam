/**
 * Maps account usernames to their avatar image paths in /public/accounts/
 */

const ACCOUNT_AVATARS: Record<string, string> = {
  thmanyah: "/accounts/thmanyah.png",
  thmanyahsports: "/accounts/thmanyahsports.jpg",
  thmanyahexit: "/accounts/thmanyahexit.jpg",
  thmanyahliving: "/accounts/thmanyahliving.jpg",
  radiothmanyah: "/accounts/radiothmanyah.png",
  // YouTube uses Arabic account_name — map those too
  "ثمانية": "/accounts/thmanyah.png",
  "رياضة ثمانية": "/accounts/thmanyahsports.jpg",
  "مخرج ثمانية": "/accounts/thmanyahexit.jpg",
  "معيشة ثمانية": "/accounts/thmanyahliving.jpg",
  "إذاعة ثمانية": "/accounts/radiothmanyah.png",
  "شركة ثمانية": "/accounts/thmanyah.png",
};

export function getAccountAvatar(username: string): string | undefined {
  return ACCOUNT_AVATARS[username?.toLowerCase()] ?? ACCOUNT_AVATARS[username];
}

export default ACCOUNT_AVATARS;

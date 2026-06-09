export type CreatorAvatar = {
  id: string;
  label: string;
  colors: [string, string];
  face: string;
  group: "Main / Popular" | "All Others";
};

const mainAvatars: CreatorAvatar[] = [
  { id: "red", label: "Red", colors: ["#e50914", "#7f1d1d"], face: "A", group: "Main / Popular" },
  { id: "green", label: "Green", colors: ["#22c55e", "#064e3b"], face: "G", group: "Main / Popular" },
  { id: "dark-blue", label: "Dark Blue", colors: ["#1d4ed8", "#111827"], face: "D", group: "Main / Popular" },
  { id: "blue", label: "Blue", colors: ["#0ea5e9", "#1e3a8a"], face: "B", group: "Main / Popular" },
  { id: "purple", label: "Purple", colors: ["#8b5cf6", "#4c1d95"], face: "P", group: "Main / Popular" },
  { id: "pink", label: "Pink", colors: ["#ec4899", "#831843"], face: "K", group: "Main / Popular" },
  { id: "yellow", label: "Yellow", colors: ["#facc15", "#92400e"], face: "Y", group: "Main / Popular" },
  { id: "kids", label: "Kids", colors: ["#f97316", "#14b8a6"], face: "!", group: "Main / Popular" },
  { id: "angryman", label: "Angryman", colors: ["#ef4444", "#111827"], face: ">", group: "Main / Popular" },
  { id: "fluffygrey", label: "Fluffy Grey", colors: ["#9ca3af", "#374151"], face: "*", group: "Main / Popular" },
  { id: "fluffyblue", label: "Fluffy Blue", colors: ["#60a5fa", "#172554"], face: "*", group: "Main / Popular" },
  { id: "fluffyred", label: "Fluffy Red", colors: ["#fb7185", "#7f1d1d"], face: "*", group: "Main / Popular" },
  { id: "fluffyyellow", label: "Fluffy Yellow", colors: ["#fde047", "#a16207"], face: "*", group: "Main / Popular" },
  { id: "chicken", label: "Chicken", colors: ["#fbbf24", "#dc2626"], face: "^", group: "Main / Popular" },
  { id: "zombi", label: "Zombi", colors: ["#84cc16", "#14532d"], face: "Z", group: "Main / Popular" },
  { id: "panda", label: "Panda", colors: ["#f9fafb", "#111827"], face: "P", group: "Main / Popular" },
];

const extraPalettes: [string, string][] = [
  ["#06b6d4", "#312e81"],
  ["#f43f5e", "#701a75"],
  ["#10b981", "#064e3b"],
  ["#f59e0b", "#7c2d12"],
  ["#6366f1", "#0f172a"],
  ["#e879f9", "#581c87"],
  ["#38bdf8", "#075985"],
  ["#fb923c", "#7f1d1d"],
];

const otherAvatars: CreatorAvatar[] = Array.from({ length: 36 }, (_, index) => {
  const number = index + 1;
  const colors = extraPalettes[index % extraPalettes.length];
  return {
    id: `avatar-${String(number).padStart(2, "0")}`,
    label: `Avatar ${number}`,
    colors,
    face: String(number),
    group: "All Others",
  };
});

export const creatorAvatars = [...mainAvatars, ...otherAvatars];

export function avatarImageValue(id: string) {
  return `argus-avatar:${id}`;
}

export function avatarIdFromImageUrl(value: string | null | undefined) {
  return value?.startsWith("argus-avatar:") ? value.slice("argus-avatar:".length) : null;
}

export function findCreatorAvatar(value: string | null | undefined) {
  const id = avatarIdFromImageUrl(value) ?? value;
  return creatorAvatars.find((avatar) => avatar.id === id) ?? null;
}

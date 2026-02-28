export type CreateRegExpConfigFunction = (name: string) => {
  raw: string;
  autocomplete?: string | string[];
}[];

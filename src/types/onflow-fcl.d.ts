declare module "@onflow/fcl" {
  export function config(): {
    put(key: string, value: unknown): ReturnType<typeof config>;
  };

  export const currentUser: {
    subscribe(callback: (user: { addr?: string | null; loggedIn?: boolean | null }) => void): () => void;
  };

  export function authenticate(): Promise<void>;
  export function unauthenticate(): Promise<void>;
}

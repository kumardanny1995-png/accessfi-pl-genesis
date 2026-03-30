declare module "multiformats" {
  export const CID: {
    parse(value: string, base?: { baseDecode(input: string): Uint8Array }): {
      code: number;
      multihash: {
        code: number;
        digest: Uint8Array;
      };
    };
  };
}

declare module "multiformats/bases/base64" {
  export const base64: {
    baseDecode(input: string): Uint8Array;
  };
}

declare module "multiformats/hashes/identity" {
  export const identity: {
    code: number;
  };
}

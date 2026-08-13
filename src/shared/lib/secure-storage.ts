export async function getSecureItem(_key: string): Promise<string | null> {
  throw new Error('expo-secure-store is not installed yet');
}

export async function setSecureItem(_key: string, _value: string): Promise<void> {
  throw new Error('expo-secure-store is not installed yet');
}

export async function deleteSecureItem(_key: string): Promise<void> {
  throw new Error('expo-secure-store is not installed yet');
}

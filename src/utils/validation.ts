// Utility functions for validation and data transformation

// Helper function to detect if a string is a GUID format
export function isGuid(str: string): boolean {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(str);
}

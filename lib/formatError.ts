/**
 * Formats raw Supabase / PostgreSQL / Gemini errors into clean, human-readable messages.
 */
export function formatErrorMessage(rawError: any): string {
  if (!rawError) return 'An unexpected error occurred. Please try again.';

  const str = typeof rawError === 'string' 
    ? rawError 
    : rawError.message || rawError.error_description || JSON.stringify(rawError);

  const lower = str.toLowerCase();

  // Generated column error (Part 1 focus)
  if (lower.includes('generated always') || lower.includes('generated column') || lower.includes('discount_percentage')) {
    return 'Database configuration notice: Discount % is calculated automatically by the database.';
  }

  // Duplicate key / barcode constraint
  if (lower.includes('duplicate key') || lower.includes('unique constraint')) {
    if (lower.includes('barcode')) {
      return 'A medicine with this barcode already exists in your inventory.';
    }
    if (lower.includes('invoice_no')) {
      return 'An invoice with this invoice number has already been recorded.';
    }
    return 'A record with these unique details already exists in the database.';
  }

  // Table does not exist
  if (lower.includes('relation') && lower.includes('does not exist')) {
    return 'Database table missing: Please run schema.sql in your Supabase SQL Editor.';
  }

  // Column does not exist
  if (lower.includes('column') && lower.includes('does not exist')) {
    const match = str.match(/column "([^"]+)"/i);
    const colName = match ? match[1] : 'attribute';
    return `Database schema mismatch: Column '${colName}' is missing. Please update your Supabase schema.`;
  }

  // Storage bucket missing
  if (lower.includes('bucket not found') || lower.includes('bucket')) {
    return "Storage bucket 'product-images' not found. Please create a public bucket named 'product-images' in Supabase Storage.";
  }

  // RLS (Row Level Security) violation
  if (lower.includes('row-level security') || lower.includes('violates row-level security policy') || lower.includes('rls')) {
    return 'Database permission error: Please enable public/authenticated access policies in Supabase RLS.';
  }

  // Authentication & API Key errors
  if (lower.includes('jwt') || lower.includes('invalid api key') || lower.includes('unauthorized') || lower.includes('invalid claim')) {
    return 'Supabase authentication failed. Please verify your Supabase URL and Anon Key in Settings.';
  }

  if (lower.includes('api_key_invalid') || lower.includes('api key not valid')) {
    return 'Invalid Gemini API Key: Please verify your Google AI Studio key in Settings.';
  }

  // Network / Connection errors
  if (lower.includes('failed to fetch') || lower.includes('network error') || lower.includes('econnrefused')) {
    return 'Network connection error: Unable to reach the Supabase server. Please check your connection.';
  }

  // Clean technical prefixes
  return str
    .replace(/^PostgrestError:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .replace(/^Supabase Database Error:\s*/i, '')
    .replace(/ERROR:\s*[0-9A-Z]+:\s*/i, '');
}

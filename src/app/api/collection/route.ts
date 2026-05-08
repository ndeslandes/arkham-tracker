import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'collection.json');

/**
 * Robustly parses the collection JSON.
 * It finds the last valid ']' and ignores any trailing garbage.
 */
function robustParse(content: string) {
  const trimmed = content.trim();
  const lastBracketIndex = trimmed.lastIndexOf(']');
  if (lastBracketIndex === -1) throw new Error('Invalid JSON: No closing bracket found');
  
  const validJson = trimmed.substring(0, lastBracketIndex + 1);
  try {
    return JSON.parse(validJson);
  } catch (e) {
    // If it still fails, try to find the FIRST valid array match
    const match = trimmed.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw e;
  }
}

export async function GET() {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    const parsed = robustParse(data);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error reading collection:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const updatedProduct = await request.json();
    
    // Read the current state
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    let products = robustParse(data);

    // Update the specific product
    const index = products.findIndex((p: any) => p.id === updatedProduct.id);
    if (index !== -1) {
      products[index] = updatedProduct;
      
      // Convert to string first to ensure we have valid content
      const output = JSON.stringify(products, null, 2);
      
      // Use a temporary path for atomic-like write
      const tempPath = `${DATA_PATH}.tmp`;
      await fs.writeFile(tempPath, output, 'utf-8');
      await fs.rename(tempPath, DATA_PATH);
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}

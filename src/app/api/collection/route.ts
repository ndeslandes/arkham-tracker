import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'collection.json');

/**
 * Robustly parses the collection JSON by finding the last valid ']'
 * and ignoring any trailing corruption or whitespace.
 */
function robustParse(content: string) {
  const trimmed = content.trim();
  const lastBracketIndex = trimmed.lastIndexOf(']');
  if (lastBracketIndex === -1) throw new Error('Invalid JSON: No closing bracket found');
  
  const validJson = trimmed.substring(0, lastBracketIndex + 1);
  return JSON.parse(validJson);
}

export async function GET() {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return NextResponse.json(robustParse(data));
  } catch (error) {
    console.error('Error reading collection:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const updatedProduct = await request.json();
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    let products = robustParse(data);

    const index = products.findIndex((p: any) => p.id === updatedProduct.id);
    if (index !== -1) {
      products[index] = updatedProduct;
      // Overwrite file cleanly
      await fs.writeFile(DATA_PATH, JSON.stringify(products, null, 2), 'utf-8');
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}

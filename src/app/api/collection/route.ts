import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'collection.json');

/**
 * Robustly parses the collection JSON by finding the first complete array.
 * This prevents trailing garbage (like duplicate brackets) from breaking the parser.
 */
function robustParse(content: string) {
  const trimmed = content.trim();
  
  // Find the first '[' and the matching ']'
  const start = trimmed.indexOf('[');
  if (start === -1) throw new Error('Invalid JSON: No opening bracket found');
  
  let depth = 0;
  let end = -1;
  
  for (let i = start; i < trimmed.length; i++) {
    if (trimmed[i] === '[') depth++;
    else if (trimmed[i] === ']') depth--;
    
    if (depth === 0) {
      end = i;
      break;
    }
  }
  
  if (end === -1) throw new Error('Invalid JSON: No matching closing bracket found');
  
  const validJson = trimmed.substring(start, end + 1);
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
      const output = JSON.stringify(products, null, 2);
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

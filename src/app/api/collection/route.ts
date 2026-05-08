import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'collection.json');

export async function GET() {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading collection:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const updatedProduct = await request.json();
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    const products = JSON.parse(data);

    const index = products.findIndex((p: { id: string }) => p.id === updatedProduct.id);
    if (index > -1) {
      products[index] = { ...products[index], ...updatedProduct };
      await fs.writeFile(DATA_PATH, JSON.stringify(products, null, 2));
      return NextResponse.json({ success: true, product: products[index] });
    } else {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}

import { describe, it, expect } from 'vitest';

/**
 * Robustly parses the collection JSON by finding the first complete array.
 * This prevents trailing garbage (like duplicate brackets) from breaking the parser.
 */
function robustParse(content: string) {
  const trimmed = content.trim();
  
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

describe('Robust Parser', () => {
  it('should parse valid JSON', () => {
    const json = '[{"id": 1}]';
    expect(robustParse(json)).toEqual([{id: 1}]);
  });

  it('should parse JSON with trailing whitespace', () => {
    const json = '[{"id": 1}]  \n ';
    expect(robustParse(json)).toEqual([{id: 1}]);
  });

  it('should parse JSON with trailing garbage (the corruption issue)', () => {
    const json = '[{"id": 1}]]';
    expect(robustParse(json)).toEqual([{id: 1}]);
  });

  it('should parse JSON with multiple trailing garbage lines', () => {
    const json = '[{"id": 1}]]\n  }\n]';
    expect(robustParse(json)).toEqual([{id: 1}]);
  });

  it('should throw error if no closing bracket is found', () => {
    const json = '[{"id": 1}';
    expect(() => robustParse(json)).toThrow('Invalid JSON: No matching closing bracket found');
  });
});

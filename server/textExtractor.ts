import AdmZip from 'adm-zip';

export interface ExtractedResult {
  text: string;
  wordCount: number;
  snippet: string;
}

export function extractTextFromFile(
  fileName: string,
  fileType: string,
  bufferOrText: Buffer | string
): ExtractedResult {
  let rawText = '';

  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const isBuffer = Buffer.isBuffer(bufferOrText);

  try {
    if (ext === 'docx' || fileType === 'word') {
      if (isBuffer) {
        const zip = new AdmZip(bufferOrText);
        const docXmlEntry = zip.getEntry('word/document.xml');
        if (docXmlEntry) {
          const xmlContent = docXmlEntry.getData().toString('utf-8');
          // Replace <w:p> and <w:br> with newlines
          const withBreaks = xmlContent
            .replace(/<\/w:p>/gi, '\n')
            .replace(/<w:br[^>]*>/gi, '\n')
            .replace(/<w:tab[^>]*>/gi, '\t');
          // Strip all XML tags
          rawText = withBreaks.replace(/<[^>]+>/g, '').trim();
        } else {
          rawText = bufferOrText.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
        }
      } else {
        rawText = String(bufferOrText);
      }
    } else if (ext === 'pdf' || fileType === 'pdf') {
      // PDF text extraction: extract BT ... ET text streams and literal strings
      const content = isBuffer ? bufferOrText.toString('binary') : String(bufferOrText);
      
      const textMatches: string[] = [];
      // Look for text within parentheses in text object blocks (Tj and TJ operators)
      const tjRegex = /\((.*?)\)\s*Tj/g;
      let match;
      while ((match = tjRegex.exec(content)) !== null) {
        if (match[1]) textMatches.push(match[1]);
      }

      // Also look for TJ array brackets: [(text) -10 (more text)] TJ
      const arrayRegex = /\[(.*?)\]\s*TJ/g;
      while ((match = arrayRegex.exec(content)) !== null) {
        const inside = match[1];
        const innerMatches = inside.match(/\((.*?)\)/g);
        if (innerMatches) {
          const joined = innerMatches.map(m => m.slice(1, -1)).join(' ');
          textMatches.push(joined);
        }
      }

      if (textMatches.length > 0) {
        rawText = textMatches.join(' ');
      } else {
        // Fallback: extract clean printable ASCII sequences
        const asciiOnly = content.replace(/[^\x20-\x7E\r\n\t]/g, ' ');
        // Filter out PDF internal syntax keywords
        const filteredLines = asciiOnly
          .split(/[\r\n]+/)
          .filter(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.length < 4) return false;
            if (/^(obj|endobj|stream|endstream|xref|trailer|startxref)/i.test(trimmed)) return false;
            if (/^\d+\s+\d+\s+R$/i.test(trimmed)) return false;
            return true;
          });
        rawText = filteredLines.join('\n');
      }
    } else if (ext === 'json' || fileType === 'json') {
      const str = isBuffer ? bufferOrText.toString('utf-8') : String(bufferOrText);
      try {
        const parsed = JSON.parse(str);
        rawText = JSON.stringify(parsed, null, 2);
      } catch {
        rawText = str;
      }
    } else if (ext === 'csv' || fileType === 'csv') {
      const str = isBuffer ? bufferOrText.toString('utf-8') : String(bufferOrText);
      const lines = str.split(/\r?\n/).filter(l => l.trim().length > 0);
      rawText = lines.slice(0, 100).join('\n');
    } else {
      // Default: text, markdown, or plain string
      rawText = isBuffer ? bufferOrText.toString('utf-8') : String(bufferOrText);
    }
  } catch (err) {
    console.warn(`Error extracting text from ${fileName}:`, err);
    rawText = isBuffer ? bufferOrText.toString('utf-8') : String(bufferOrText);
  }

  // Clean up whitespace
  const cleaned = rawText
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  const words = cleaned ? cleaned.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const snippet = cleaned.length > 280 ? cleaned.slice(0, 280) + '...' : cleaned;

  return {
    text: cleaned,
    wordCount,
    snippet,
  };
}

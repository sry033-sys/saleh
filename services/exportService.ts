import { Document, Packer, Paragraph, TextRun, FootnoteReference, AlignmentType, HeadingLevel, VerticalAlign } from "docx";
import FileSaver from "file-saver";
import { ResearchData } from "../types";

// Regex to identify citations, handling "ينظر:" and English equivalents "See:", "p.", "Vol."
// Matches: (Book Name, p 123) OR (ينظر: Book Name, p 123) OR (See: Author, p. 55)
// Flags: 'i' for case insensitivity (Vol, vol, P, p)
const CITATION_REGEX = /(\((?:ينظر:|See:|Cf\.?:?\s*)?[^)]+?(?:[،,]\s*(?:ج|ص|مجلد|صفحة|vol|p|pp|pg|no)\.?\s*[\d]+)+\))/gi;

export const exportToDocx = async (data: ResearchData) => {
  const footnoteDefinitions: any = {};
  let footnoteIdCounter = 1;

  const sections_docs: any[] = [];

  // Title
  sections_docs.push(
    new Paragraph({
      text: data.topic,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 400 },
      run: {
        font: "Traditional Arabic",
        size: 48,
        bold: true,
        color: "2E7D32"
      }
    })
  );

  sections_docs.push(
    new Paragraph({
      text: `تاريخ البحث: ${new Date().toLocaleDateString('ar-SA')}`,
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 800 },
       run: {
        font: "Traditional Arabic",
        size: 28,
      }
    })
  );

  // Process content
  for (const section of data.sections) {
    // Section Title
    sections_docs.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { before: 400, after: 200 },
        run: {
            font: "Traditional Arabic",
            size: 32,
            bold: true,
            color: "00695C"
        }
      })
    );

    // Split paragraphs
    const paragraphs = section.content.split('\n');
    
    for (const paraText of paragraphs) {
      if (!paraText.trim()) continue;

      const children: (TextRun | FootnoteReference)[] = [];
      let lastIndex = 0;
      let match;
      
      const localRegex = new RegExp(CITATION_REGEX);

      while ((match = localRegex.exec(paraText)) !== null) {
        // Text before citation
        if (match.index > lastIndex) {
          children.push(new TextRun({
            text: paraText.substring(lastIndex, match.index),
            font: "Traditional Arabic",
            size: 28, // 14pt
            rightToLeft: true
          }));
        }

        // The Footnote Logic
        const currentId = footnoteIdCounter++;
        
        // Add bracket before footnote number - SUPERSCRIPTED
        children.push(new TextRun({
          text: "(",
          font: "Traditional Arabic",
          size: 20, // Smaller size for superscript
          rightToLeft: true,
          verticalAlign: VerticalAlign.SUPERSCRIPT
        }));
        
        // The superscript number
        // Note: Word automatically superscripts FootnoteReference, but wrapping it in superscript parens ensures alignment
        children.push(new FootnoteReference(currentId));
        
        // Add bracket after footnote number - SUPERSCRIPTED
        children.push(new TextRun({
          text: ")",
          font: "Traditional Arabic",
          size: 20, // Smaller size for superscript
          rightToLeft: true,
          verticalAlign: VerticalAlign.SUPERSCRIPT
        }));
        
        // Store definition (The content of the footnote at bottom of page)
        // Remove outer parentheses from the match to get clean text
        let citationContent = match[0].replace(/^\(/, '').replace(/\)$/, '');
        
        footnoteDefinitions[currentId] = {
          children: [new Paragraph({
             children: [new TextRun({ text: citationContent, font: "Traditional Arabic", size: 20, rightToLeft: true })],
             bidirectional: true
          })]
        };

        lastIndex = match.index + match[0].length;
      }

      // Remaining text after last citation
      if (lastIndex < paraText.length) {
         children.push(new TextRun({
            text: paraText.substring(lastIndex),
            font: "Traditional Arabic",
            size: 28, // 14pt
            rightToLeft: true
          }));
      }

      sections_docs.push(
        new Paragraph({
          children: children,
          alignment: AlignmentType.JUSTIFIED,
          bidirectional: true,
          spacing: { after: 200, line: 360 }, // 1.5 line spacing
        })
      );
    }
  }

  // Create Document
  const doc = new Document({
    footnotes: footnoteDefinitions,
    sections: [{
      properties: {},
      children: sections_docs,
    }],
  });

  // Generate and Download
  const blob = await Packer.toBlob(doc);
  const saveAs = (FileSaver as any).saveAs || FileSaver;
  saveAs(blob, `${data.topic.substring(0, 30)}.docx`);
};
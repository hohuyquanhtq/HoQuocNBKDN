import React from 'react';

interface ChemistryTextProps {
  content: string;
  className?: string;
}

export const ChemistryText: React.FC<ChemistryTextProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Render text supporting line breaks and unicode chemistry symbols
  const lines = content.split('\n');

  return (
    <div className={`leading-relaxed ${className}`}>
      {lines.map((line, lIdx) => (
        <React.Fragment key={lIdx}>
          <span>{formatChemistryLine(line)}</span>
          {lIdx < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
};

// Converts common LaTeX or plain text chemistry patterns into formatted elements
function formatChemistryLine(line: string): React.ReactNode {
  // Replace common TeX fragments like \rightleftharpoons with ⇌
  let clean = line
    .replace(/\\rightleftharpoons/g, ' ⇌ ')
    .replace(/\\rightarrow/g, ' → ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×');

  // If there are standard HTML tags like <sub> or <sup> already in string (e.g. from docx parser)
  if (clean.includes('<sub>') || clean.includes('<sup>') || clean.includes('<b>') || clean.includes('<i>')) {
    return <span dangerouslySetInnerHTML={{ __html: clean }} />;
  }

  // Handle standard chemical sub/sup notation like H2O, CO2, SO4^2-, NO2, N2O4, NH3
  return clean;
}

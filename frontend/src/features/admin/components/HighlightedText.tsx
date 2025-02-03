import React from 'react';

interface HighlightedTextProps {
  text: string;
  matches: [number, number][];
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, matches }) => {
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach(([start, end], index) => {
    if (start > lastIndex) {
      elements.push(
        <React.Fragment key={`text-${index}`}>
          {text.slice(lastIndex, start)}
        </React.Fragment>
      );
    }
    elements.push(
      <mark
        key={`highlight-${index}`}
        style={{ backgroundColor: '#fff3cd', padding: 0 }}
      >
        {text.slice(start, end)}
      </mark>
    );
    lastIndex = end;
  });

  if (lastIndex < text.length) {
    elements.push(
      <React.Fragment key="text-end">
        {text.slice(lastIndex)}
      </React.Fragment>
    );
  }

  return <>{elements}</>;
};

export default React.memo(HighlightedText);

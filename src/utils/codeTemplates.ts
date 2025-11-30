export interface CodeTemplate {
  name: string;
  description: string;
  template: string;
}

export const codeTemplates: CodeTemplate[] = [
  {
    name: 'Function',
    description: 'Insert a function template',
    template: `function functionName() {
  // Function body
  return;
}`,
  },
  {
    name: 'Class',
    description: 'Insert a class template',
    template: `class ClassName {
  constructor() {
    // Constructor body
  }
  
  method() {
    // Method body
  }
}`,
  },
  {
    name: 'Comment Block',
    description: 'Insert a comment block',
    template: `/**
 * Description
 * 
 * @param {type} paramName - Parameter description
 * @returns {type} Return description
 */`,
  },
  {
    name: 'Date/Time',
    description: 'Insert current date and time',
    template: `// ${new Date().toLocaleString()}`,
  },
  {
    name: 'If Statement',
    description: 'Insert an if statement',
    template: `if (condition) {
  // Code block
}`,
  },
  {
    name: 'For Loop',
    description: 'Insert a for loop',
    template: `for (let i = 0; i < length; i++) {
  // Loop body
}`,
  },
  {
    name: 'Try-Catch',
    description: 'Insert a try-catch block',
    template: `try {
  // Code that may throw an error
} catch (error) {
  // Error handling
}`,
  },
  {
    name: 'Async Function',
    description: 'Insert an async function',
    template: `async function asyncFunctionName() {
  // Async function body
  await someAsyncOperation();
  return;
}`,
  },
];

export const getTemplate = (name: string): string | null => {
  const template = codeTemplates.find(t => t.name === name);
  return template ? template.template : null;
};

export const insertTemplate = (
  templateName: string,
  currentContent: string,
  cursorPosition: number
): { newContent: string; newCursorPosition: number } => {
  const template = getTemplate(templateName);
  if (!template) {
    return { newContent: currentContent, newCursorPosition: cursorPosition };
  }

  const before = currentContent.substring(0, cursorPosition);
  const after = currentContent.substring(cursorPosition);
  const newContent = before + template + after;
  
  // Calculate new cursor position (end of inserted template)
  const newCursorPosition = cursorPosition + template.length;
  
  return { newContent, newCursorPosition };
};


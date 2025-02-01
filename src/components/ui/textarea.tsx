import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`bg-gray-700 text-white border border-gray-600 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-500 ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string | RegExp): R;
      toContainText(text: string): R;
      toHaveValue(value: string | number | string[]): R;
      toBeVisible(): R;
      toHaveAttribute(attr: string, value?: string): R;
    }
  }
} 
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '../../components/brand/ColorPicker';
import '@testing-library/jest-dom';

describe('ColorPicker Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with initial color', () => {
    render(
      <ColorPicker
        value="#FF0000"
        onChange={mockOnChange}
      />
    );

    const colorButton = screen.getByLabelText('Color');
    expect(colorButton).toHaveStyle({ backgroundColor: '#FF0000' });
  });

  test('opens color palette on click', () => {
    render(
      <ColorPicker
        value="#FF0000"
        onChange={mockOnChange}
      />
    );

    // Click the color button
    fireEvent.click(screen.getByLabelText('Color'));

    // Check that the palette is displayed
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Color picker')).toBeInTheDocument();
  });

  test('selects color from predefined colors', () => {
    render(
      <ColorPicker
        value="#FF0000"
        onChange={mockOnChange}
      />
    );

    // Open color picker
    fireEvent.click(screen.getByLabelText('Color'));

    // Click a predefined color
    fireEvent.click(screen.getByLabelText('Select color #00FF00'));

    // Verify onChange was called with the selected color
    expect(mockOnChange).toHaveBeenCalledWith('#00FF00');
  });

  test('allows custom color input', () => {
    render(
      <ColorPicker
        value="#FF0000"
        onChange={mockOnChange}
      />
    );

    // Open color picker
    fireEvent.click(screen.getByLabelText('Color'));

    // Enter custom color
    const input = screen.getByLabelText('Custom color');
    fireEvent.change(input, { target: { value: '#0000FF' } });
    fireEvent.blur(input);

    // Verify onChange was called with the custom color
    expect(mockOnChange).toHaveBeenCalledWith('#0000FF');
  });

  test('validates hex color format', () => {
    render(
      <ColorPicker
        value="#FF0000"
        onChange={mockOnChange}
      />
    );

    // Open color picker
    fireEvent.click(screen.getByLabelText('Color'));

    // Enter invalid color
    const input = screen.getByLabelText('Custom color');
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.blur(input);

    // Check for validation message
    expect(screen.getByText('Invalid color format')).toBeInTheDocument();

    // Verify onChange was not called
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('closes palette when clicking outside', () => {
    render(
      <ColorPicker
        value="#FF0000"
        onChange={mockOnChange}
      />
    );

    // Open color picker
    fireEvent.click(screen.getByLabelText('Color'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click outside
    fireEvent.click(document.body);

    // Check that palette is closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('maintains selected color when reopening', () => {
    render(
      <ColorPicker
        value="#00FF00"
        onChange={mockOnChange}
      />
    );

    // Open color picker
    fireEvent.click(screen.getByLabelText('Color'));

    // Close color picker
    fireEvent.click(document.body);

    // Reopen color picker
    fireEvent.click(screen.getByLabelText('Color'));

    // Check that the previously selected color is still active
    const colorButton = screen.getByLabelText('Color');
    expect(colorButton).toHaveStyle({ backgroundColor: '#00FF00' });
  });
}); 
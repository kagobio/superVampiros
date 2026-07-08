import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('invoca los callbacks al pulsar − y +', async () => {
    const onDecrement = vi.fn();
    const onIncrement = vi.fn();
    render(
      <Stepper
        value={3}
        label="Leche"
        unit="ud"
        onDecrement={onDecrement}
        onIncrement={onIncrement}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Añadir uno de Leche' }));
    await userEvent.click(screen.getByRole('button', { name: 'Quitar uno de Leche' }));

    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it('deshabilita − al llegar al mínimo', () => {
    render(<Stepper value={0} label="Sal" onDecrement={vi.fn()} onIncrement={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Quitar uno de Sal' })).toBeDisabled();
  });
});

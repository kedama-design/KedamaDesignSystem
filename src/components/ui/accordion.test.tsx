import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

/**
 * Accordion は Base UI の primitive に載せている（仕様書 §2.2）。
 * フォーカス管理と aria-* を自作すると高くつくため。
 * ここで守るのは**開閉の契約**であって、Base UI の内部実装ではない。
 */
function Fixture() {
  return (
    <Accordion>
      <AccordionItem value="a">
        <AccordionTrigger>観点A</AccordionTrigger>
        <AccordionContent>Aの本文</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>観点B</AccordionTrigger>
        <AccordionContent>Bの本文</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe('Accordion', () => {
  it('renders triggers as buttons', () => {
    render(<Fixture />);
    expect(screen.getByRole('button', { name: /観点A/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /観点B/ })).toBeInTheDocument();
  });

  it('starts collapsed', () => {
    render(<Fixture />);
    expect(screen.getByRole('button', { name: /観点A/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands on click', async () => {
    render(<Fixture />);
    const trigger = screen.getByRole('button', { name: /観点A/ });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('is operable by keyboard', async () => {
    render(<Fixture />);
    const trigger = screen.getByRole('button', { name: /観点A/ });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('links the trigger to its panel', async () => {
    render(<Fixture />);
    const trigger = screen.getByRole('button', { name: /観点A/ });
    await userEvent.click(trigger);
    const panelId = trigger.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId as string)).toBeInTheDocument();
  });

  it('carries the expected slots', () => {
    const { container } = render(<Fixture />);
    expect(container.querySelector('[data-slot="accordion"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="accordion-item"]')).toHaveLength(2);
  });
});

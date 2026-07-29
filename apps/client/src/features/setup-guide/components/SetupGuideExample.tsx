import { useState } from 'react';
import { createSetupGuideItems } from '../data/items';
import type { SetupGuideItem } from '../types';
import { SetupGuide } from './SetupGuide';

/**
 * Standalone demo page for the setup guide component.
 * Holds local visibility and item state so designers can preview dismiss and step completion without the full {@link App} shell.
 * Dismiss resets items via {@link createSetupGuideItems}; reopen uses a single Polaris button.
 * @returns {import('react').ReactElement} Either the guide or a button to show it again.
 */
export function SetupGuideExample() {
  const [showGuide, setShowGuide] = useState(true);
  const [items, setItems] = useState<SetupGuideItem[]>(() => createSetupGuideItems());

  /**
   * Demo async handler that flips `complete` after a one second delay.
   * Mimics a network call before updating local checklist state; logs unexpected errors to the console.
   * @param {number} stepId - `SetupGuideItem.id` for the row that was toggled.
   * @returns {Promise<void>} Resolves after the timeout and state update finish.
   */
  const toggleStepCompletion = async (stepId: number) => {
    try {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 1000);
      });

      setItems((previousItems) =>
        previousItems.map((item) =>
          item.id === stepId ? { ...item, complete: !item.complete } : item,
        ),
      );
    } catch (error) {
      console.error(error);
    }
  };

  if (!showGuide) {
    return <s-button onClick={() => setShowGuide(true)}>Show Setup Guide</s-button>;
  }

  return (
    <div style={{ maxWidth: '60rem', margin: '0 auto' }}>
      <SetupGuide
        onDismiss={() => {
          setShowGuide(false);
          setItems(createSetupGuideItems());
        }}
        onStepComplete={toggleStepCompletion}
        items={items}
      />
    </div>
  );
}

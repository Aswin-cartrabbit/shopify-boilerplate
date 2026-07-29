import { useId, useState } from 'react';
import type { SetupGuideProps } from '../../types';
import styles from './SetupGuide.module.css';
import { SetupItem } from './SetupItem';

/**
 * Interactive onboarding checklist built from Polaris web components.
 * Tracks which step is expanded, overall progress, and collapse state of the guide header.
 * Calls `onStepComplete` when a step is marked done and `onDismiss` when the merchant closes the guide.
 * @param {SetupGuideProps} props - Checklist items and parent callbacks.
 * @returns {import('react').ReactElement} `<s-section>` wrapping the setup guide UI.
 */
export function SetupGuide({ onDismiss, onStepComplete, items }: SetupGuideProps) {
  const [expanded, setExpanded] = useState(() =>
    items.findIndex((item) => !item.complete),
  );
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const accessId = useId();
  const completedItemsLength = items.filter((item) => item.complete).length;
  const progress = (completedItemsLength / items.length) * 100;

  return (
    <s-section padding="none">
      <s-box padding="base" paddingBlockEnd="none">
        <s-stack direction="block" gap="none">
          <s-stack direction="inline" justifyContent="space-between" alignItems="center">
            <s-heading>Setup Guide</s-heading>
            <s-stack direction="inline" gap="small">
              <s-button commandFor="setup-guide-menu" variant="tertiary" icon="menu-horizontal" />
              <s-menu id="setup-guide-menu" accessibilityLabel="Setup guide options">
                <s-button onClick={onDismiss}>
                  <s-stack direction="inline" gap="small" alignItems="center">
                    <div
                      style={{
                        height: '1rem',
                        width: '1rem',
                        paddingTop: '.05rem',
                      }}
                    >
                      <s-icon type="x" tone="neutral" />
                    </div>
                    <span>Dismiss</span>
                  </s-stack>
                </s-button>
              </s-menu>

              <s-button
                variant="tertiary"
                icon={isGuideOpen ? 'chevron-up' : 'chevron-down'}
                onClick={() => {
                  setIsGuideOpen((prev) => {
                    if (!prev) {
                      setExpanded(items.findIndex((item) => !item.complete));
                    }
                    return !prev;
                  });
                }}
              />
            </s-stack>
          </s-stack>

          <s-text>Use this personalized guide to get your app up and running.</s-text>

          <div style={{ marginTop: '.8rem' }}>
            <s-stack
              direction="inline"
              alignItems="center"
              gap="small-300"
              paddingBlockEnd={!isGuideOpen ? 'small' : 'none'}
            >
              {completedItemsLength === items.length ? (
                <div style={{ maxHeight: '1rem' }}>
                  <s-stack direction="inline" gap="small">
                    <s-icon type="check" tone="neutral" />
                    <s-text color="subdued">Done</s-text>
                  </s-stack>
                </div>
              ) : (
                <s-text color="subdued">
                  {`${completedItemsLength} / ${items.length} completed`}
                </s-text>
              )}

              {completedItemsLength !== items.length ? (
                <div style={{ width: '100px' }}>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : null}
            </s-stack>
          </div>
        </s-stack>
      </s-box>

      <div
        className={`${styles.collapsible} ${isGuideOpen ? styles.collapsibleOpen : styles.collapsibleClosed}`}
        style={{ paddingBlockStart: isGuideOpen ? '20px' : '0px' }}
        id={accessId}
      >
        <div className={styles.collapsibleInner}>
          <s-box padding="small-300">
            <s-stack direction="block" gap="small-400">
              {items.map((item) => (
                <SetupItem
                  key={item.id}
                  expanded={expanded === item.id}
                  setExpanded={() => setExpanded(item.id)}
                  onComplete={onStepComplete}
                  {...item}
                />
              ))}
            </s-stack>
          </s-box>
        </div>
      </div>

      {completedItemsLength === items.length ? (
        <s-box background="subdued" padding="base">
          <s-stack direction="inline" justifyContent="end">
            <s-button onClick={onDismiss}>Dismiss Guide</s-button>
          </s-stack>
        </s-box>
      ) : null}
    </s-section>
  );
}

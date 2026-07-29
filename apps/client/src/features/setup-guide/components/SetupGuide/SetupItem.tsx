import { useState } from 'react';
import type { SetupGuideButton, SetupGuideButtonElementProps, SetupGuideImage } from '../../types';
import { checkIcon, outlineIcon } from './icons';
import styles from './SetupGuide.module.css';

type SetupItemProps = {
  id: number;
  title: string;
  description: string;
  image?: SetupGuideImage;
  complete: boolean;
  primaryButton?: SetupGuideButton;
  secondaryButton?: SetupGuideButton;
  expanded: boolean;
  setExpanded: () => void;
  onComplete: (id: number) => void | Promise<void>;
};

/**
 * Converts declarative button config into props for Polaris `<s-button>`.
 * Supports external links (`href` + `target`), plain labels, or click handlers from `onClick` / `onAction`.
 * @param {SetupGuideButton | undefined} button - Step button definition from setup guide item data.
 * @returns {SetupGuideButtonElementProps} Spreadable props for `<s-button>`.
 */
function getButtonProps(
  button?: SetupGuideButton,
): SetupGuideButtonElementProps {
  if (!button?.props) {
    return { children: button?.content };
  }

  const { url, external, onClick, onAction } = button.props;
  const clickHandler = onClick ?? onAction;

  if (url) {
    return {
      href: url,
      target: external ? ('_blank' as const) : undefined,
      children: button.content,
    };
  }

  return {
    onClick: clickHandler,
    children: button.content,
  };
}

/**
 * One row in the setup guide with expand/collapse, imagery, and completion control.
 * Clicking the title toggles expansion unless already open; the circle button calls `onComplete`.
 * Shows a spinner on the completion control while the async parent handler runs.
 * @param {SetupItemProps} props - Step content, expansion state, and completion callback.
 * @returns {import('react').ReactElement} Clickable Polaris layout for a single checklist step.
 */
export function SetupItem({
  id,
  complete,
  onComplete,
  expanded,
  setExpanded,
  title,
  description,
  image,
  primaryButton,
  secondaryButton,
}: SetupItemProps) {
  const [loading, setLoading] = useState(false);

  /**
   * Marks the step complete/incomplete through the parent and shows loading state on the control.
   * Delegates persistence logic to `onComplete`; always clears loading in `finally`.
   * @returns {Promise<void>} Resolves after `onComplete(id)` settles.
   */
  const markStepComplete = async () => {
    setLoading(true);
    try {
      await onComplete(id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <s-clickable borderRadius="small">
      <s-box
        borderRadius="small"
        background={expanded ? 'subdued' : undefined}
        paddingBlockStart="small-400"
        paddingInline="small-300"
        paddingBlockEnd="small-400"
      >
        <s-grid gridTemplateColumns="auto 1fr" alignItems="start" columnGap="small">
          <s-grid-item>
            <s-tooltip id={`complete-tooltip-${id}`}>
              {complete ? 'Mark as not done' : 'Mark as done'}
            </s-tooltip>
            <s-clickable onClick={markStepComplete} interestFor={`complete-tooltip-${id}`}>
              <div className={styles.completeButton}>
                {loading ? (
                  <s-spinner size="base" />
                ) : complete ? (
                  <div className={styles.completeMark}>{checkIcon}</div>
                ) : (
                  outlineIcon
                )}
              </div>
            </s-clickable>
          </s-grid-item>

          <s-grid-item>
            <div
              className={styles.itemContent}
              onClick={expanded ? undefined : setExpanded}
              style={{
                cursor: expanded ? 'default' : 'pointer',
                paddingBlockStart: '2px',
              }}
            >
              <s-stack direction="block">
                {expanded ? <s-heading>{title}</s-heading> : <s-text>{title}</s-text>}

                <div
                  className={`${styles.collapsible} ${expanded ? styles.collapsibleOpen : styles.collapsibleClosed}`}
                >
                  <div className={styles.collapsibleInner}>
                    <s-box paddingBlockStart="small" paddingBlockEnd="small">
                      <s-stack direction="block" gap="large">
                        <s-text>{description}</s-text>
                        {primaryButton || secondaryButton ? (
                          <s-stack direction="inline" gap="base">
                            {primaryButton ? (
                              <s-button variant="primary" {...getButtonProps(primaryButton)} />
                            ) : null}
                            {secondaryButton ? (
                              <s-button variant="tertiary" {...getButtonProps(secondaryButton)} />
                            ) : null}
                          </s-stack>
                        ) : null}
                      </s-stack>
                    </s-box>
                  </div>
                </div>
              </s-stack>

              {image && expanded ? (
                <img
                  className={styles.itemImage}
                  src={image.url}
                  alt={image.alt ?? ''}
                  style={{ maxHeight: '7.75rem' }}
                />
              ) : null}
            </div>
          </s-grid-item>
        </s-grid>
      </s-box>
    </s-clickable>
  );
}

export type SetupGuideButton = {
  content: string;
  props?: {
    url?: string;
    external?: boolean;
    onClick?: () => void;
    onAction?: () => void;
  };
};

/** Props spread onto Polaris `<s-button>` from {@link SetupGuideButton} config. */
export type SetupGuideButtonElementProps = {
  href?: string;
  target?: '_blank';
  onClick?: () => void;
  children?: string;
};

export type SetupGuideImage = {
  url: string;
  alt?: string;
};

export type SetupGuideItem = {
  id: number;
  title: string;
  description: string;
  image?: SetupGuideImage;
  complete: boolean;
  primaryButton?: SetupGuideButton;
  secondaryButton?: SetupGuideButton;
};

export type SetupGuideProps = {
  items: SetupGuideItem[];
  onDismiss: () => void;
  onStepComplete: (id: number) => void | Promise<void>;
};

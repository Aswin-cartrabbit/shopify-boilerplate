/// <reference types="@shopify/polaris-types" />

import type { HTMLAttributes, PropsWithChildren } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      's-app-nav': PropsWithChildren<HTMLAttributes<HTMLElement>>;
    }
  }
}

export {};

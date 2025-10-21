import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { ReactNode } from 'react';

const environmentId = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || 'a543ccda-473a-484a-8e62-a2e04f061783';

interface DynamicProviderProps {
  children: ReactNode;
}

export function DynamicProvider({ children }: DynamicProviderProps) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId,
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}


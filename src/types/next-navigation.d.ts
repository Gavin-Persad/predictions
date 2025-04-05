declare module 'next/navigation' {
    export function useRouter(): {
      push: (url: string) => void;
      replace: (url: string) => void;
      back: () => void;
      prefetch: (url: string) => void;
      refresh: () => void;
    }
  }
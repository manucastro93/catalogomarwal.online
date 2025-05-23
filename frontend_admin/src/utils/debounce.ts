
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    let timeout: ReturnType<typeof setTimeout>;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    }) as T;
  }
  
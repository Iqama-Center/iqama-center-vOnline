// Utility function to scroll to top when showing error messages
export const scrollToError = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Hook for handling error states with automatic scrolling
export const useErrorHandler = () => {
  const handleError = (setErrorState, errorMessage) => {
    setErrorState(errorMessage);
    scrollToError();
  };

  return { handleError, scrollToError };
};
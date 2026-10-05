import { useContext } from 'react';
import { UserMessageContext } from '@/contexts/error';

const useUserMessage = () => {
  const context = useContext(UserMessageContext);

  if (!context) {
    throw new Error('useUserMessage must be used within a UserMessageProvider');
  }

  return context;
};

export default useUserMessage;

'use client';

import { useState, useEffect } from 'react';

const messages = [
  '>> connecting to market data stream...',
  '>> authenticating user...',
  '>> fetching trade history...',
  '>> analyzing portfolio performance...',
  '>> loading risk management module...',
  '>> initializing market scanner...',
  '>> system check complete. ready.',
];

export function TerminalCaret() {
  const [currentMessage, setCurrentMessage] = useState('');
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [showCaret, setShowCaret] = useState(true);

  useEffect(() => {
    let messageIndex = 0;
    let charIndex = 0;
    let typingTimeout: NodeJS.Timeout;
    let messageInterval: NodeJS.Timeout;

    const type = () => {
      if (charIndex < currentMessage.length) {
        setDisplayedMessage((prev) => prev + currentMessage.charAt(charIndex));
        charIndex++;
        typingTimeout = setTimeout(type, 50);
      }
    };

    const changeMessage = () => {
      setDisplayedMessage('');
      charIndex = 0;
      setCurrentMessage(messages[messageIndex]);
      messageIndex = (messageIndex + 1) % messages.length;
      type();
    };

    // Initial call
    changeMessage();

    // Change message every 5 seconds
    messageInterval = setInterval(changeMessage, 5000);

    // Caret blinking
    const caretInterval = setInterval(() => {
      setShowCaret((prev) => !prev);
    }, 500);

    return () => {
      clearTimeout(typingTimeout);
      clearInterval(messageInterval);
      clearInterval(caretInterval);
    };
  }, [currentMessage]);

  return (
    <div className="absolute top-4 right-4 font-mono text-xs text-green-400/50 z-20 pointer-events-none">
      <span>{displayedMessage}</span>
      <span
        className={`w-2 h-4 bg-green-400/50 inline-block ml-1 ${showCaret ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

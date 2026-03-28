'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NicknameModalProps {
  onConnect: (nickname: string) => void;
}

export function NicknameModal({ onConnect }: NicknameModalProps) {
  const [nickname, setNickname] = useState('');

  const handleConnect = () => {
    if (nickname.trim()) {
      onConnect(nickname);
    }
  };

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black/50 z-50'>
      <div className='bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] rounded-lg p-8 w-96 relative border border-[#00d9ff]/20'>
        <button
          onClick={() => {}}
          className='absolute top-4 right-4 text-gray-400 hover:text-white'
        >
          ✕
        </button>
        
        <h2 className='text-xl font-bold text-white mb-6'>Who are you?</h2>
        
        <input
          type='text'
          placeholder='Nickname'
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
          className='w-full bg-[#1a2332] border border-[#00d9ff]/30 rounded px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9ff] mb-6'
        />
        
        <Button
          onClick={handleConnect}
          className='w-full bg-[#00d9ff] hover:bg-[#00b8d4] text-black font-bold'
        >
          Connect
        </Button>
      </div>
    </div>
  );
}

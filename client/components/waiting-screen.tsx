'use client';

export function WaitingScreen() {
  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black/50 z-50'>
      <div className='bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] rounded-lg p-8 w-96 border border-[#00d9ff]/20'>
        <h2 className='text-2xl font-bold text-white mb-4 text-center'>
          Finding a random player...
        </h2>
        
        <p className='text-center text-gray-400 mb-8'>
          It usually takes 25 seconds
        </p>
        
        <div className='flex justify-center'>
          <div className='flex gap-2'>
            <div className='w-2 h-2 bg-[#00d9ff] rounded-full animate-pulse'></div>
            <div className='w-2 h-2 bg-[#00d9ff] rounded-full animate-pulse delay-100'></div>
            <div className='w-2 h-2 bg-[#00d9ff] rounded-full animate-pulse delay-200'></div>
          </div>
        </div>
      </div>
    </div>
  );
}

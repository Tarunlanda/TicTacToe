'use client';

interface WinnerScreenProps {
  playerIndex: number;
  winner: number | null;
  points: number;
  playerNickname: string;
  opponentNickname: string;
  onPlayAgain: () => void;
}

export function WinnerScreen({
  playerIndex,
  winner,
  points,
  playerNickname,
  opponentNickname,
  onPlayAgain,
}: WinnerScreenProps) {
  const isWinner = winner !== null && playerIndex === winner;
  const isDraw = winner === null;

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black/50 z-50'>
      <div className='bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] rounded-lg p-8 w-96 border border-[#00d9ff]/20'>
        <div className='text-center mb-8'>
          {isDraw ? (
            <>
              <div className='text-9xl font-bold text-gray-400 mb-4'>
                🤝
              </div>
              <h2 className='text-3xl font-bold text-[#00d9ff] mb-2'>Draw</h2>
              <p className='text-2xl font-bold text-[#00d9ff]'>No points awarded</p>
            </>
          ) : isWinner ? (
            <>
              <div className='text-9xl font-bold text-white mb-4'>
                {playerIndex === 0 ? '✕' : '○'}
              </div>
              <h2 className='text-3xl font-bold text-[#00d9ff] mb-2'>
                WINNER!
              </h2>
              <p className='text-2xl font-bold text-[#00d9ff]'>+{points} pts</p>
            </>
          ) : (
            <>
              <div className='text-9xl font-bold text-gray-500 mb-4'>
                {playerIndex === 0 ? '✕' : '○'}
              </div>
              <h2 className='text-3xl font-bold text-gray-400 mb-2'>You Lost</h2>
            </>
          )}
        </div>

        <div className='bg-[#0f1419]/50 rounded-lg p-4 mb-6 border border-[#00d9ff]/20'>
          <h3 className='text-[#00d9ff] font-bold mb-3 flex items-center gap-2'>
            🏆 Leaderboard
          </h3>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between text-white'>
              <span>W/L/D</span>
              <span>Rating</span>
            </div>
            <div className='flex justify-between text-white font-bold'>
              <span>{isWinner ? '3/0' : '2/1'}</span>
              <span>{isWinner ? '2300' : '2100'}</span>
            </div>
            <div className='flex justify-between text-gray-400 text-xs mt-3'>
              {isWinner ? (
                <>
                  <span>1. {playerNickname || 'You'}</span>
                  <span>{isWinner ? '2300' : '2100'}</span>
                </>
              ) : (
                <>
                  <span>1. {opponentNickname}</span>
                  <span>2100</span>
                </>
              )}
            </div>
            <div className='flex justify-between text-gray-400 text-xs'>
              {isWinner ? (
                <>
                  <span>2. {opponentNickname}</span>
                  <span>500</span>
                </>
              ) : (
                <>
                  <span>2. {playerNickname || 'You'}</span>
                  <span>{isWinner ? '2300' : '1900'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onPlayAgain}
          className='w-full bg-transparent border border-[#00d9ff] text-[#00d9ff] rounded px-4 py-2 font-bold hover:bg-[#00d9ff]/10 transition'
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

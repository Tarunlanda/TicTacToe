'use client';
import { useState, useEffect, useRef } from 'react';
import Square from './square';
import { MatchData } from '@heroiclabs/nakama-js';
import Nakama from '@/lib/nakama';
import {
  OpCode,
  StartMessage,
  DoneMessage,
  UpdateMessage,
} from '@/lib/messages';

import { Button } from '@/components/ui/button';
import { NicknameModal } from './nickname-modal';
import { WaitingScreen } from './waiting-screen';
import { WinnerScreen } from './winner-screen';

export default function Game() {
  const [squares, setSquares] = useState<(number | null)[]>(
    Array(9).fill(null)
  );
  const [playerIndex, setPlayerIndex] = useState<number>(-1);
  const [playerTurn, setPlayerTurn] = useState<number>(-1);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [gameMessage, setMessage] = useState<string>('Welcome to TicTacToe');
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showNicknameModal, setShowNicknameModal] = useState<boolean>(true);
  const [showWaitingScreen, setShowWaitingScreen] = useState<boolean>(false);
  const [showWinnerScreen, setShowWinnerScreen] = useState<boolean>(false);
  const [winner, setWinner] = useState<number>(-1);
  const [playerNickname, setPlayerNickname] = useState<string>('');
  const [opponentNickname, setOpponentNickname] = useState<string>('Opponent');
  const [sessionId, setSessionId] = useState<string>('');
  const [lastMatchSessionId, setLastMatchSessionId] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [opponentId, setOpponentId] = useState<string>('');
  const nakamaRef = useRef<Nakama | undefined>(undefined);

  useEffect(() => {
    setSessionId(`${Date.now()}_${Math.random()}`);
  }, []);

  function initSocket() {
    if (
      !nakamaRef.current ||
      !nakamaRef.current.socket ||
      !nakamaRef.current.session
    )
      return;
    const userId = nakamaRef.current.session.user_id;

    let socket = nakamaRef.current.socket;

    socket.onmatchdata = (matchState: MatchData) => {
      if (!nakamaRef.current) return;
      const json_string = new TextDecoder().decode(matchState.data);
      const json: string = json_string ? JSON.parse(json_string) : '';
      console.log('op_code: ', matchState.op_code);

      let myPlayerIndex = nakamaRef.current.gameState.playerIndex;

      if (typeof json === 'object' && json !== null) {
        switch (matchState.op_code) {
          case OpCode.START:
            const startMessage = json as StartMessage;
            
            // Check if this is a self-match (both players are the same)
            const playerIds = Object.keys(startMessage.marks);
            if (playerIds.length < 2) {
              console.log('Self-match detected! Rejecting...');
              setMessage('Error: Cannot match with yourself! Searching again...');
              setShowWaitingScreen(true);
              nakamaRef.current.matchId = null;
              setIsSearching(false);
              setTimeout(() => findMatch(), 2000);
              return;
            }
            
            // Check if we already matched with this opponent (prevent loops)
            const opponentUserId = playerIds.find(id => id !== userId);
            setOpponentId(opponentUserId || '');
            
            if (opponentUserId === lastMatchSessionId) {
              console.log('Matched with same opponent, rejecting...');
              setMessage('Error: Already matched! Searching for new opponent...');
              setShowWaitingScreen(true);
              nakamaRef.current.matchId = null;
              setTimeout(() => findMatch(), 2000);
              return;
            }
            
            setLastMatchSessionId(opponentUserId || '');
            setTimeLeft(0);
            setSquares(startMessage.board);
            setPlayerTurn(startMessage.mark);
            setGameStarted(true);
            setShowWaitingScreen(false);
            setIsSearching(false);
            setMessage('Game Started!');

            let tmpId = startMessage.marks[userId!];
            if (tmpId !== null) {
              setPlayerIndex(tmpId);
              nakamaRef.current.gameState.playerIndex = tmpId;
            } else {
              console.error('tmpId is null');
            }
            break;
          case OpCode.UPDATE:
            const updateMessage = json as UpdateMessage;
            if (updateMessage.mark === myPlayerIndex) {
              setMessage('Your Turn!');
            }
            setPlayerTurn(updateMessage.mark);
            setSquares(updateMessage.board);
            setDeadline(updateMessage.deadline);
            break;
          case OpCode.DONE:
            const doneMessage = json as DoneMessage;
            setDeadline(doneMessage.nextGameStart);
            setGameStarted(false);
            setSquares(doneMessage.board);
            setPlayerTurn(-1);
            setWinner(doneMessage.winner);
            setShowWinnerScreen(true);
            break;
          case OpCode.MOVE:
            // Handle MOVE message
            break;
          case OpCode.REJECTED:
            // Handle REJECTED message
            break;
          default:
            // Handle unknown message
            break;
        }
      }
    };
  }

  useEffect(() => {
    const initNakama = async () => {
      nakamaRef.current = new Nakama();
      await nakamaRef.current.authenticate();
      initSocket();
    };
    initNakama();
  }, []);

  useEffect(() => {
    if (deadline !== null) {
      const intervalId = setInterval(() => {
        setTimeLeft(deadline * 1000 - Date.now());
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [deadline]);

  function handleClick(i: number) {
    if (!gameStarted) {
      setMessage("Game hasn't started yet!");
      return;
    }
    if (!nakamaRef.current) return;

    if (playerTurn === playerIndex && squares[i] === null) {
      const nextSquares = squares.slice();

      nextSquares[i] = playerIndex;
      setSquares(nextSquares);
      nakamaRef.current.makeMove(i);
      setMessage("Wait for other player's turn!");
    } else if (playerTurn !== playerIndex) {
      setMessage("It's not your turn!");
    }
  }

  async function findMatch() {
    if (!nakamaRef.current || isSearching) return;
    
    setIsSearching(true);
    setShowWaitingScreen(true);
    setOpponentNickname('Opponent');
    
    try {
      await nakamaRef.current.findMatch(playerNickname, sessionId);
      if (nakamaRef.current.matchId === null) {
        setMessage('Server Error: Failed to find match! Please ensure server is running and try again.');
        setShowWaitingScreen(false);
        setIsSearching(false);
      }
      console.log('find match, matchId: ', nakamaRef.current.matchId!);
    } catch (error) {
      setMessage('Error finding match!');
      setShowWaitingScreen(false);
      setIsSearching(false);
      console.error(error);
    }
  }

  const handleNicknameConnect = (nickname: string) => {
    setPlayerNickname(nickname);
    setOpponentNickname('Opponent');
    setShowNicknameModal(false);
    setMessage(`Welcome ${nickname}!`);
  };

  const handlePlayAgain = () => {
    setShowWinnerScreen(false);
    setSquares(Array(9).fill(null));
    setGameStarted(false);
    setOpponentNickname('Opponent');
  };

  return (
    <>
      {showNicknameModal && (
        <NicknameModal onConnect={handleNicknameConnect} />
      )}

      {showWaitingScreen && <WaitingScreen />}

      {showWinnerScreen && playerIndex !== -1 && (
        <WinnerScreen
          playerIndex={playerIndex}
          winner={winner}
          points={200}
          playerNickname={playerNickname}
          opponentNickname={`Player (${opponentId?.substring(0, 8) || 'Unknown'})`}
          onPlayAgain={handlePlayAgain}
        />
      )}

      <div className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f1419] to-[#1a1f2e]'>
        {!gameStarted && !showWaitingScreen && (
          <div className='mb-8 text-center'>
            <h1 className='text-4xl font-bold text-white mb-4'>TicTacToe Online</h1>
            <p className='text-gray-400 mb-6'>{gameMessage}</p>
            <Button
              onClick={findMatch}
              className='bg-[#00d9ff] hover:bg-[#00b8d4] text-black font-bold px-8 py-3'
            >
              Find Match
            </Button>
          </div>
        )}

        {gameStarted && (
          <div className='w-full'>
            <div className='flex justify-center mb-8'>
              <div className='bg-gradient-to-r from-[#00d9ff] to-[#00b8d4] px-6 py-2 rounded text-black font-bold'>
                {playerTurn === playerIndex ? 'Your Turn' : "Opponent's Turn"}
              </div>
            </div>

            <div className='flex justify-center gap-12 mb-8'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-white mb-2'>{playerNickname || 'You'}</div>
                <div className='text-4xl font-bold text-[#00d9ff]'>
                  {playerIndex === 0 ? '✕' : '○'}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-white mb-2'>{opponentNickname}</div>
                <div className='text-4xl font-bold text-[#f3b236]'>
                  {playerIndex === 0 ? '○' : '✕'}
                </div>
              </div>
            </div>

            {deadline !== null && (
              <div className='flex justify-center mb-8'>
                <div className='bg-[#1a2332] px-6 py-2 rounded text-[#00d9ff] font-bold'>
                  ⏱️ {timeLeft > 0
                    ? new Date(timeLeft).toISOString().substr(14, 5)
                    : '0:00'}
                </div>
              </div>
            )}

            <div className='flex justify-center'>
              <div className='space-y-4'>
                <div className='flex gap-4 justify-center'>
                  <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
                  <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
                  <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
                </div>
                <div className='flex gap-4 justify-center'>
                  <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
                  <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
                  <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
                </div>
                <div className='flex gap-4 justify-center'>
                  <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
                  <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
                  <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

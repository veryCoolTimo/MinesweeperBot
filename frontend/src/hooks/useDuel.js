import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export const DUEL_STATE = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  FOUND: 'found',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost'
}

export function useDuel(userId, username) {
  const [duelState, setDuelState] = useState(DUEL_STATE.IDLE)
  const [match, setMatch] = useState(null)
  const [opponent, setOpponent] = useState(null)
  const [myProgress, setMyProgress] = useState(0)
  const [opponentProgress, setOpponentProgress] = useState(0)
  const [countdown, setCountdown] = useState(null)

  const matchRef = useRef(null)
  const playerIdRef = useRef(null)
  const channelRef = useRef(null)

  // Generate a random seed for the board
  const generateSeed = () => {
    return Math.random().toString(36).substring(2, 15)
  }

  // Find or create a match
  const findMatch = useCallback(async (difficulty = 'easy') => {
    if (!userId) return

    setDuelState(DUEL_STATE.SEARCHING)

    try {
      // First, look for an existing waiting match
      const { data: existingMatches, error: findError } = await supabase
        .from('matches')
        .select('*, match_players(*)')
        .eq('status', 'waiting')
        .eq('difficulty', difficulty)
        .order('created_at', { ascending: true })
        .limit(1)

      if (findError) throw findError

      let matchData
      let isCreator = false

      if (existingMatches && existingMatches.length > 0) {
        // Join existing match
        matchData = existingMatches[0]

        // Make sure it's not our own match
        const existingPlayer = matchData.match_players.find(p => p.user_id === userId)
        if (existingPlayer) {
          // It's our match, wait for opponent
          matchRef.current = matchData
          playerIdRef.current = existingPlayer.id
          subscribeToMatch(matchData.id)
          return
        }

        // Join as second player
        const { data: playerData, error: joinError } = await supabase
          .from('match_players')
          .insert({
            match_id: matchData.id,
            user_id: userId,
            username: username || 'Player'
          })
          .select()
          .single()

        if (joinError) throw joinError

        playerIdRef.current = playerData.id

        // Update match status to playing
        await supabase
          .from('matches')
          .update({
            status: 'playing',
            started_at: new Date().toISOString()
          })
          .eq('id', matchData.id)

      } else {
        // Create new match
        isCreator = true
        const seed = generateSeed()

        const { data: newMatch, error: createError } = await supabase
          .from('matches')
          .insert({
            seed,
            difficulty,
            status: 'waiting'
          })
          .select()
          .single()

        if (createError) throw createError

        matchData = newMatch

        // Add ourselves as first player
        const { data: playerData, error: playerError } = await supabase
          .from('match_players')
          .insert({
            match_id: matchData.id,
            user_id: userId,
            username: username || 'Player'
          })
          .select()
          .single()

        if (playerError) throw playerError

        playerIdRef.current = playerData.id
      }

      matchRef.current = matchData
      setMatch(matchData)
      subscribeToMatch(matchData.id)

    } catch (error) {
      console.error('Error finding match:', error)
      setDuelState(DUEL_STATE.IDLE)
    }
  }, [userId, username])

  // Subscribe to match updates
  const subscribeToMatch = useCallback((matchId) => {
    // Unsubscribe from previous channel if exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`
        },
        (payload) => {
          console.log('Match update:', payload)
          const newMatch = payload.new
          setMatch(newMatch)
          matchRef.current = newMatch

          if (newMatch.status === 'playing' && duelState === DUEL_STATE.SEARCHING) {
            setDuelState(DUEL_STATE.FOUND)
            // Start countdown
            setCountdown(3)
          }

          if (newMatch.status === 'finished') {
            // Match is done
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_players',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          console.log('Player update:', payload)
          const player = payload.new

          if (player.user_id === userId) {
            setMyProgress(player.progress)
            if (player.is_winner) {
              setDuelState(DUEL_STATE.WON)
            } else if (player.is_finished && !player.is_winner) {
              // Check if opponent won
            }
          } else {
            setOpponent(player)
            setOpponentProgress(player.progress)
            if (player.is_winner) {
              setDuelState(DUEL_STATE.LOST)
            }
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    // Also fetch current players
    fetchPlayers(matchId)
  }, [userId, duelState])

  // Fetch current players in match
  const fetchPlayers = async (matchId) => {
    const { data: players, error } = await supabase
      .from('match_players')
      .select('*')
      .eq('match_id', matchId)

    if (error) {
      console.error('Error fetching players:', error)
      return
    }

    const opponentData = players.find(p => p.user_id !== userId)
    if (opponentData) {
      setOpponent(opponentData)
      setOpponentProgress(opponentData.progress)
    }

    // If we have 2 players and match is playing, start the game
    if (players.length === 2) {
      const matchData = matchRef.current
      if (matchData?.status === 'playing') {
        setDuelState(DUEL_STATE.FOUND)
        setCountdown(3)
      }
    }
  }

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(c => c - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setDuelState(DUEL_STATE.PLAYING)
      setCountdown(null)
    }
  }, [countdown])

  // Update progress
  const updateProgress = useCallback(async (progress, cellsRevealed) => {
    if (!playerIdRef.current) return

    await supabase
      .from('match_players')
      .update({
        progress,
        cells_revealed: cellsRevealed
      })
      .eq('id', playerIdRef.current)
  }, [])

  // Report game finished
  const reportFinished = useCallback(async (won, finishTime) => {
    if (!playerIdRef.current || !matchRef.current) return

    // Update our player record
    await supabase
      .from('match_players')
      .update({
        is_finished: true,
        is_winner: won,
        finish_time: finishTime,
        progress: 100
      })
      .eq('id', playerIdRef.current)

    if (won) {
      setDuelState(DUEL_STATE.WON)

      // Mark match as finished
      await supabase
        .from('matches')
        .update({
          status: 'finished',
          finished_at: new Date().toISOString()
        })
        .eq('id', matchRef.current.id)
    } else {
      // We lost (hit a mine)
      setDuelState(DUEL_STATE.LOST)
    }
  }, [])

  // Cancel search
  const cancelSearch = useCallback(async () => {
    if (matchRef.current && matchRef.current.status === 'waiting') {
      // Delete the match if we created it and no one joined
      await supabase
        .from('matches')
        .delete()
        .eq('id', matchRef.current.id)
        .eq('status', 'waiting')
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    setDuelState(DUEL_STATE.IDLE)
    setMatch(null)
    setOpponent(null)
    matchRef.current = null
    playerIdRef.current = null
  }, [])

  // Leave match
  const leaveMatch = useCallback(async () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    setDuelState(DUEL_STATE.IDLE)
    setMatch(null)
    setOpponent(null)
    setMyProgress(0)
    setOpponentProgress(0)
    setCountdown(null)
    matchRef.current = null
    playerIdRef.current = null
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  return {
    duelState,
    match,
    opponent,
    myProgress,
    opponentProgress,
    countdown,
    findMatch,
    updateProgress,
    reportFinished,
    cancelSearch,
    leaveMatch
  }
}

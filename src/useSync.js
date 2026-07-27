import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { hasSupabaseConfig, makeClient, TABLE } from './supabase'
import { newState, normalize, readCache, SECRET_KEY, writeCache } from './state'

const SAVE_DEBOUNCE = 1500
const RETRY_INTERVAL = 20000

export function useSync() {
  const configured = hasSupabaseConfig()
  const [secret, setSecret] = useState(() => {
    try {
      return localStorage.getItem(SECRET_KEY) || ''
    } catch {
      return ''
    }
  })
  const [state, setStateInner] = useState(null)
  const [rowId, setRowId] = useState(null)
  const [offline, setOffline] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  const client = useMemo(
    () => (configured && secret ? makeClient(secret) : null),
    [configured, secret]
  )

  const stateRef = useRef(null)
  const rowIdRef = useRef(null)
  const skipSave = useRef(true)
  stateRef.current = state
  rowIdRef.current = rowId

  const adopt = useCallback((next) => {
    skipSave.current = true
    setStateInner(next)
  }, [])

  const setState = useCallback((updater) => {
    setStateInner((prev) => (typeof updater === 'function' ? updater(prev) : updater))
  }, [])

  // Finds this passphrase's row, creating it the first time. Returns the row id.
  const ensureRow = useCallback(
    async (seed) => {
      const { data, error } = await client
        .from(TABLE)
        .select('id,data')
        .eq('secret', secret)
        .limit(1)
      if (error) throw error
      if (data && data.length) {
        return { id: data[0].id, data: normalize(data[0].data) }
      }
      const initial = seed || readCache() || newState()
      const { data: inserted, error: insertError } = await client
        .from(TABLE)
        .insert({ secret, data: initial })
        .select('id')
        .single()
      if (insertError) throw insertError
      return { id: inserted.id, data: initial }
    },
    [client, secret]
  )

  // Initial load.
  useEffect(() => {
    let cancelled = false
    if (!configured) {
      adopt(readCache() || newState())
      setOffline(false)
      return
    }
    if (!secret) {
      setStateInner(null)
      return
    }
    ;(async () => {
      try {
        const row = await ensureRow()
        if (cancelled) return
        setRowId(row.id)
        adopt(row.data)
        writeCache(row.data)
        setOffline(false)
      } catch {
        if (cancelled) return
        adopt(readCache() || newState())
        setOffline(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [configured, secret, ensureRow, adopt])

  const push = useCallback(
    async (value) => {
      if (!client) return
      try {
        let id = rowIdRef.current
        if (!id) {
          const row = await ensureRow(value)
          id = row.id
          setRowId(id)
        }
        const { error } = await client
          .from(TABLE)
          .update({ data: value, updated_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
        writeCache(value)
        setOffline(false)
        setSaveFailed(false)
      } catch {
        setSaveFailed(true)
        setOffline(true)
      }
    },
    [client, ensureRow]
  )

  // Debounced save. The cache is written straight away so work done while
  // offline survives a reload; the row is last-write-wins.
  useEffect(() => {
    if (!state) return
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    writeCache(state)
    if (!client) return
    const t = setTimeout(() => {
      void push(state)
    }, SAVE_DEBOUNCE)
    return () => clearTimeout(t)
  }, [state, client, push])

  // Background retry while we are degraded.
  useEffect(() => {
    if (!client) return
    if (!offline && !saveFailed) return
    const t = setInterval(() => {
      if (stateRef.current) void push(stateRef.current)
    }, RETRY_INTERVAL)
    return () => clearInterval(t)
  }, [client, offline, saveFailed, push])

  const submitSecret = useCallback((value) => {
    const trimmed = value.trim()
    if (!trimmed) return
    try {
      localStorage.setItem(SECRET_KEY, trimmed)
    } catch {
      /* ignore */
    }
    setSecret(trimmed)
  }, [])

  return {
    state,
    setState,
    adopt,
    needsSecret: configured && !secret,
    submitSecret,
    offline,
    saveFailed,
    configured,
  }
}

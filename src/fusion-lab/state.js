/**
 * Fusion Lab — Page State Machine
 * States: idle | running | success | failed
 */

const LabState = {
  _state: "idle",
  _result: null,
  _task: null,
  _history: [],
  _listeners: [],

  get status() { return this._state },
  get result() { return this._result },
  get task() { return this._task },
  get history() { return this._history },

  onChange(fn) { this._listeners.push(fn) },

  _emit() {
    for (const fn of this._listeners) fn(this._state, this._result, this._task)
  },

  setRunning() {
    this._state = "running"
    this._result = null
    this._task = null
    this._emit()
  },

  setSuccess(result, task) {
    this._state = "success"
    this._result = result
    this._task = task
    this._history.unshift({ result, task, createdAt: new Date().toISOString() })
    if (this._history.length > 20) this._history.pop()
    this._emit()
  },

  setFailed(error) {
    this._state = "failed"
    this._result = { error: error?.message || String(error) }
    this._task = null
    this._emit()
  },

  setIdle() {
    this._state = "idle"
    this._emit()
  },

  setTaskProgress(task) {
    this._task = task
    this._emit()
  },
}

if (typeof module !== "undefined") module.exports = LabState
else window.LabState = LabState
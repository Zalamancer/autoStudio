#!/usr/bin/env bash
set -euo pipefail

SESSION="conductor"
WORKDIR="/Users/ihsanduru/autoStudio/AutoAnimation"
OUTDIR="/tmp/conductor"

# Strip ANSI escape codes from input
strip_ansi() {
  sed 's/\x1b\[[0-9;]*[a-zA-Z]//g' | sed 's/\x1b\][^\x07]*\x07//g' | sed 's/\x1b[()][B0-9]//g' | sed 's/\x1b\[?[0-9;]*[a-zA-Z]//g'
}

session_exists() {
  tmux has-session -t "$SESSION" 2>/dev/null
}

cmd_start() {
  local num_workers="${1:-3}"

  if session_exists; then
    echo "Session '$SESSION' already exists. Run 'stop' first or use existing workers."
    exit 1
  fi

  mkdir -p "$OUTDIR"

  echo "Creating tmux session '$SESSION' with $num_workers worker shells..."

  # Create session with first window
  tmux new-session -d -s "$SESSION" -n "worker-1" -x 220 -y 50
  tmux send-keys -t "$SESSION:worker-1" "cd $WORKDIR" Enter

  for i in $(seq 2 "$num_workers"); do
    tmux new-window -t "$SESSION" -n "worker-$i"
    tmux send-keys -t "$SESSION:worker-$i" "cd $WORKDIR" Enter
  done

  sleep 1
  echo "Started $num_workers worker shells. Ready for tasks."
}

cmd_send() {
  local worker="$1"
  shift
  local prompt="$*"

  if ! session_exists; then
    echo "No conductor session. Run 'start' first."
    exit 1
  fi

  if ! tmux list-windows -t "$SESSION" -F '#{window_name}' 2>/dev/null | grep -q "^worker-${worker}$"; then
    echo "Worker $worker does not exist."
    exit 1
  fi

  # Write prompt to file to avoid shell escaping issues with tmux send-keys
  local prompt_file="$OUTDIR/worker-${worker}-prompt.txt"
  local output_file="$OUTDIR/worker-${worker}-output.txt"
  local status_file="$OUTDIR/worker-${worker}-status"

  mkdir -p "$OUTDIR"
  printf '%s' "$prompt" > "$prompt_file"
  echo "running" > "$status_file"
  : > "$output_file"

  # Run claude in non-interactive print mode (-p) reading prompt from file
  # Output goes to both the tmux pane (visible) and to a file (readable)
  tmux send-keys -t "$SESSION:worker-$worker" \
    "unset CLAUDECODE; claude -p --dangerously-skip-permissions < '${prompt_file}' 2>&1 | tee '${output_file}'; echo done > '${status_file}'" Enter

  echo "Sent task to worker $worker."
}

# Send a prompt from a file (for very long/complex prompts)
cmd_send_file() {
  local worker="$1"
  local src_file="$2"

  if ! session_exists; then
    echo "No conductor session. Run 'start' first."
    exit 1
  fi

  if [ ! -f "$src_file" ]; then
    echo "Prompt file not found: $src_file"
    exit 1
  fi

  local prompt_file="$OUTDIR/worker-${worker}-prompt.txt"
  local output_file="$OUTDIR/worker-${worker}-output.txt"
  local status_file="$OUTDIR/worker-${worker}-status"

  mkdir -p "$OUTDIR"
  cp "$src_file" "$prompt_file"
  echo "running" > "$status_file"
  : > "$output_file"

  tmux send-keys -t "$SESSION:worker-$worker" \
    "unset CLAUDECODE; claude -p --dangerously-skip-permissions < '${prompt_file}' 2>&1 | tee '${output_file}'; echo done > '${status_file}'" Enter

  echo "Sent task (from file) to worker $worker."
}

cmd_read() {
  local worker="$1"
  local output_file="$OUTDIR/worker-${worker}-output.txt"

  if [ -f "$output_file" ] && [ -s "$output_file" ]; then
    cat "$output_file"
  else
    echo "(No output yet from worker $worker)"
  fi
}

cmd_read_all() {
  if ! session_exists; then
    echo "No conductor session. Run 'start' first."
    exit 1
  fi

  local workers
  workers=$(tmux list-windows -t "$SESSION" -F '#{window_name}' 2>/dev/null | grep '^worker-' | sort -t- -k2 -n)

  for w in $workers; do
    local num="${w#worker-}"
    local output_file="$OUTDIR/worker-${num}-output.txt"
    echo "===== Worker $num [$(cmd_worker_status "$num")] ====="
    if [ -f "$output_file" ] && [ -s "$output_file" ]; then
      tail -20 "$output_file"
    else
      echo "(no output yet)"
    fi
    echo ""
  done
}

cmd_worker_status() {
  local worker="$1"
  local status_file="$OUTDIR/worker-${worker}-status"

  if [ ! -f "$status_file" ]; then
    echo "idle"
  elif grep -q "done" "$status_file" 2>/dev/null; then
    echo "done"
  elif grep -q "running" "$status_file" 2>/dev/null; then
    echo "running"
  else
    echo "idle"
  fi
}

cmd_status() {
  if ! session_exists; then
    echo "No conductor session running."
    exit 1
  fi

  local workers
  workers=$(tmux list-windows -t "$SESSION" -F '#{window_name}' 2>/dev/null | grep '^worker-' | sort -t- -k2 -n)

  for w in $workers; do
    local num="${w#worker-}"
    local st
    st=$(cmd_worker_status "$num")
    local output_file="$OUTDIR/worker-${num}-output.txt"
    local size="0"
    if [ -f "$output_file" ]; then
      size=$(wc -c < "$output_file" | tr -d ' ')
    fi

    case "$st" in
      running) echo "Worker $num: RUNNING (output: ${size} bytes so far)" ;;
      done)    echo "Worker $num: DONE (output: ${size} bytes)" ;;
      *)       echo "Worker $num: IDLE" ;;
    esac
  done
}

# Wait for a specific worker or all workers to finish
cmd_wait() {
  local target="${1:-all}"
  local timeout="${2:-600}"
  local elapsed=0

  if ! session_exists; then
    echo "No conductor session. Run 'start' first."
    exit 1
  fi

  echo "Waiting for worker(s) to finish (timeout: ${timeout}s)..."

  while [ "$elapsed" -lt "$timeout" ]; do
    local all_done=true

    if [ "$target" = "all" ]; then
      local workers
      workers=$(tmux list-windows -t "$SESSION" -F '#{window_name}' 2>/dev/null | grep '^worker-' | sort -t- -k2 -n)
      for w in $workers; do
        local num="${w#worker-}"
        local st
        st=$(cmd_worker_status "$num")
        if [ "$st" = "running" ]; then
          all_done=false
          break
        fi
      done
    else
      local st
      st=$(cmd_worker_status "$target")
      if [ "$st" = "running" ]; then
        all_done=false
      fi
    fi

    if $all_done; then
      echo "All target workers finished."
      return 0
    fi

    sleep 5
    elapsed=$((elapsed + 5))
  done

  echo "Timeout reached (${timeout}s). Some workers may still be running."
  return 1
}

cmd_stop() {
  if session_exists; then
    tmux kill-session -t "$SESSION" 2>/dev/null || true
  fi
  echo "Conductor session stopped."
}

cmd_list() {
  if ! session_exists; then
    echo "No conductor session running."
    exit 1
  fi

  echo "Active workers in session '$SESSION':"
  local workers
  workers=$(tmux list-windows -t "$SESSION" -F '#{window_name}' 2>/dev/null | grep '^worker-' | sort -t- -k2 -n)

  for w in $workers; do
    local num="${w#worker-}"
    local st
    st=$(cmd_worker_status "$num")
    echo "  worker-$num: $st"
  done
}

cmd_clean() {
  rm -rf "$OUTDIR"
  echo "Cleaned output directory."
}

# --- Main ---
case "${1:-help}" in
  start)
    cmd_start "${2:-3}"
    ;;
  send)
    if [ $# -lt 3 ]; then
      echo "Usage: $0 send <worker#> <prompt>"
      exit 1
    fi
    worker_num="$2"
    shift 2
    cmd_send "$worker_num" "$@"
    ;;
  send-file)
    if [ $# -lt 3 ]; then
      echo "Usage: $0 send-file <worker#> <prompt-file>"
      exit 1
    fi
    cmd_send_file "$2" "$3"
    ;;
  read)
    if [ $# -lt 2 ]; then
      echo "Usage: $0 read <worker#>"
      exit 1
    fi
    cmd_read "$2"
    ;;
  read-all)
    cmd_read_all
    ;;
  status)
    cmd_status
    ;;
  wait)
    cmd_wait "${2:-all}" "${3:-600}"
    ;;
  stop)
    cmd_stop
    ;;
  list)
    cmd_list
    ;;
  clean)
    cmd_clean
    ;;
  help|*)
    cat <<'USAGE'
tmux-based Claude Code Orchestrator

Usage: conductor.sh <command> [args]

Commands:
  start [N]                     Start N worker shells (default: 3)
  send <worker#> <prompt>       Send a prompt to a worker (runs claude -p)
  send-file <worker#> <file>    Send a prompt from a file to a worker
  read <worker#>                Read full output from a worker
  read-all                      Show last 20 lines from all workers
  status                        Check running/done/idle status of all workers
  wait [worker#|all] [timeout]  Wait for worker(s) to finish (default: all, 600s)
  stop                          Kill all workers
  list                          List all active workers with status
  clean                         Remove all output files
  help                          Show this help

Examples:
  conductor.sh start 3
  conductor.sh send 1 "List all files in src/services/"
  conductor.sh status
  conductor.sh wait all 300
  conductor.sh read 1
  conductor.sh stop
USAGE
    ;;
esac

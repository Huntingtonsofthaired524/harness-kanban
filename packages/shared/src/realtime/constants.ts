export const REALTIME_SOCKET_NAMESPACE = '/realtime'

export const REALTIME_SOCKET_EVENTS = {
  join: 'realtime:join',
  inbound: 'realtime:inbound',
} as const

export const AGENT_APPROVAL_SOCKET_EVENTS = {
  request: 'agent:approval:request',
  response: 'agent:approval:response',
} as const

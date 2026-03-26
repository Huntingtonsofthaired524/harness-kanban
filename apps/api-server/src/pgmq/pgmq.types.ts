export type PgmqMessage<TPayload> = {
  msg_id: number
  read_ct: number
  enqueued_at: Date
  vt: Date | null
  message: TPayload
}

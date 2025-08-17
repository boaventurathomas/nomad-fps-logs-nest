export function parsePtDateTime(s: string): Date {
  // Format: DD/MM/YYYY HH:mm:ss
  const [date, time] = s?.split(' ')
  if (!date || !time) {
    return new Date(NaN)
  }
  const [dd, mm, yyyy] = date?.split('/').map(Number)
  const [HH, MM, SS] = time?.split(':').map(Number)
  return new Date(yyyy, mm - 1, dd, HH, MM, SS)
}

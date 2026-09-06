// Public wording only. Supabase keeps its existing standard/overflow/waitlist values.
export function reservationTicketStatus(seatTypes: string[]) {
  if (seatTypes.length && seatTypes.every((seat) => seat === "standard")) return "confirmed";
  if (seatTypes.length && seatTypes.every((seat) => seat === "overflow")) return "standby";
  if (seatTypes.length && seatTypes.every((seat) => seat === "waitlist")) return "waitlisted";
  return "mixed";
}

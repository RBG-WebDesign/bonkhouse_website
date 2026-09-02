// create_reservation_atomic raises short, stable messages; turn them into
// something a guest can act on. Anything unrecognised is a real failure.
const KNOWN: Array<[string, number, string]> = [
  ["already reserved", 409, "You already have seats for this screening. Check your inbox for the confirmation, or release those seats first if you need to change them."],
  ["rsvp not open yet", 403, "RSVPs have not opened yet for this screening."],
  ["rsvp closed", 403, "RSVPs have closed for this screening."],
  ["invite code required", 403, "That invite code is not available."],
  ["over ticket limit", 400, "That is more tickets than this screening allows per RSVP."],
  ["event not open", 403, "RSVPs are not open for this event."]
];

export function rsvpErrorResponse(message: string | null | undefined): { status: number; error: string } {
  const text = message || "";
  for (const [needle, status, error] of KNOWN) {
    if (text.includes(needle)) return { status, error };
  }
  return { status: 500, error: "Could not create the reservation." };
}

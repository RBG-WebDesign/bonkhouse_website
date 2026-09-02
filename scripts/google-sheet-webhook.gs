// RSVP → Google Sheet receiver (Google Apps Script).
//
// Supabase fires a Database Webhook whenever a reservation is inserted or
// updated; this script appends a row for new RSVPs and updates the Status
// cell when one is cancelled.
//
// Setup (once):
//   1. Open the Google Sheet you want to use → Extensions → Apps Script.
//   2. Paste this file, replacing the default code.
//   3. Change SECRET to a long random string.
//   4. Deploy → New deployment → type "Web app" → Execute as: Me,
//      Who has access: Anyone → Deploy. Copy the web app URL.
//   5. In Supabase: Database → Webhooks → Create: table `reservations`,
//      events Insert + Update, type HTTP request, POST, URL
//      <web app URL>?key=<SECRET>. Done.

const SECRET = "change-me";
const SUPABASE_URL = "https://nwnxoqrmqsjyznegykfc.supabase.co";
const SUPABASE_KEY = "sb_publishable_FJGSI523nOCGZ6JuZSjBsg_1wnLTCma"; // public read-only key
const HEADER = ["Time", "Screening", "Name", "Email", "Seats", "Status", "Reservation ID"];

function doPost(e) {
  if (!e || !e.parameter || e.parameter.key !== SECRET) {
    return ContentService.createTextOutput("forbidden").setMimeType(ContentService.MimeType.TEXT);
  }

  const payload = JSON.parse(e.postData.contents);
  const record = payload.record || {};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER);
    sheet.getRange(1, 1, 1, HEADER.length).setFontWeight("bold");
  }

  if (payload.type === "INSERT") {
    sheet.appendRow([
      new Date(record.created_at),
      screeningTitle(record.event_id),
      record.guest_name,
      record.guest_email,
      record.quantity,
      record.status,
      record.id
    ]);
  } else if (payload.type === "UPDATE" && record.id) {
    const ids = sheet.getRange(2, HEADER.length, Math.max(1, sheet.getLastRow() - 1), 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (ids[i][0] === record.id) {
        sheet.getRange(i + 2, 6).setValue(record.status);
        break;
      }
    }
  }

  return ContentService.createTextOutput("ok").setMimeType(ContentService.MimeType.TEXT);
}

// Reservations only carry the event id; look the title up on the public view.
function screeningTitle(eventId) {
  if (!eventId) return "";
  try {
    const response = UrlFetchApp.fetch(
      SUPABASE_URL + "/rest/v1/public_events?select=title&id=eq." + encodeURIComponent(eventId),
      { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY }, muteHttpExceptions: true }
    );
    const rows = JSON.parse(response.getContentText());
    return rows[0] ? rows[0].title : eventId;
  } catch (error) {
    return eventId;
  }
}

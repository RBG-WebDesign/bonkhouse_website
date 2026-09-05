import Link from "next/link";

// Landing page for the "release your seats" link in ticket emails. Nothing is
// cancelled until the guest presses the button (a POST), so link prefetching
// by mail clients can't release seats by accident.
export default async function CancelPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reservation = typeof params.reservation === "string" ? params.reservation : "";
  const token = typeof params.token === "string" ? params.token : "";
  const done = params.done === "1";
  const failed = params.error === "1";

  let stamp = "Release seats?";
  let headline = "Can't make it?";
  let body = "Press the button and your seats go back to the room. If you change your mind later you can RSVP again while seats remain.";

  if (done) {
    stamp = "Released";
    headline = "Your seats are free again";
    body = "Thanks for letting us know. A confirmation is on its way to your inbox, and if anyone was waiting for seats, they just got the good news.";
  } else if (failed || !reservation || !token) {
    stamp = "Nothing to release";
    headline = "That link didn't match a reservation";
    body = "It may have been used already, or the address got mangled on the way. If you still hold seats and want to release them, use the link in your most recent ticket email.";
  }

  const showForm = !done && !failed && reservation && token;

  return (
    <div className="bh-container bh-page bh-verdict">
      <div className="bh-stamp inline-block -rotate-3 border-4 border-butter px-5 py-3 font-display text-3xl uppercase tracking-wider text-butter sm:text-4xl">
        {stamp}
      </div>
      <h1 className="bh-page-title">{headline}</h1>
      <p className="bh-intro">{body}</p>

      <div className="bh-actions">
        {showForm ? (
          <form action="/api/rsvp/cancel" method="post">
            <input name="reservation" type="hidden" value={reservation} />
            <input name="token" type="hidden" value={token} />
            <button
              className="bh-button"
              type="submit"
            >
              Release my seats
            </button>
          </form>
        ) : null}
        <Link className="bh-button bh-button--text" href="/screenings">
          {showForm ? "Keep my seats" : "See what's screening"}
        </Link>
      </div>
    </div>
  );
}

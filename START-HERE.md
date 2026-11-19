# Start here — complete source projects

Keep the two folders separate. Open the backend folder in IntelliJ and the frontend folder in VS Code. You do not need to generate a new Spring Initializr or Angular project: both source projects are included.

1. Read the backend README. Start Docker Desktop, copy `.env.example` to `.env` once, then run `docker compose up -d --wait` in the backend folder.
2. In IntelliJ select JDK 21 and set the environment variables from the backend README, including `DB_PASSWORD`, `SPRING_PROFILES_ACTIVE=demo` and `DEMO_PASSWORD`. Start `CinemaBackendApplication`.
3. In the frontend folder run `npm ci` then `npm start` with Node 24. Open http://localhost:4200.
4. Try the client flow, then sign out and use the staff / admin demo accounts. Their password is the value you chose in backend `DEMO_PASSWORD` when the accounts were first created.
5. Read `docs/GIT-WORKFLOW.md` before publishing. The archive includes local Git history. GitHub sign-in and the actual push / PR are still required. No credentials are included in the archive.
6. Follow `docs/DEPLOYMENT.md` to configure the public services. Frontend and backend deploy independently; the frontend API proxy keeps login cookies on the same browser origin.

Both projects have code, automated tests, CI configuration and deployment instructions. The downloads do not by themselves publish a website or complete the Studi submission. Actual public URLs, real PR / CI links and a browser acceptance check must be added after deployment. Consult `docs/VALIDATION.md` for exactly what was tested.

For later updates, use Git branches / pull requests and `git pull --ff-only`. Do not repeatedly paste source files into the IDE.

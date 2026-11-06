# Le Grand Cinema Angular foundation

Node 24, Angular 22 and TypeScript. Run npm ci then npm start.

The shell contains the main landmark and keyboard skip link. The catalogue and screenings
will be developed on feature/us01-film-catalog and feature/us02-screenings.

main: releases; develop: integration; feature/usXX-description: Trello story; fix/description: bug fix.
The API URL is public configuration; never put database credentials here.

US01 adds the film catalogue with explicit loading, failure and empty states.
Screening selection belongs to the next story, US02.
